# Validation Strategy

Data validation happens in layers. Each layer validates what it owns; never trust the client.

## Validation Layers

### 1. Frontend (Zod + Formik)

**Where:** Client-side form validation.

**Purpose:** Immediate user feedback, UX polish. This is NOT security.

**Example:** Email format, required fields, field length.

```typescript
// frontend/src/features/checkout/forms/checkout-form.tsx
const checkoutSchema = z.object({
  customerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9\s-]+$/),
  deliveryCity: z.string().min(1),
  items: z.array(z.object({
    id: z.number().positive(),
    quantity: z.number().int().positive(),
  })),
});
```

**Never rely on this for:**
- Price validation
- Quantity limits
- Permission checks
- Payment status

### 2. API Request (DRF Serializers)

**Where:** `shop/serializers/`

**Purpose:** Validate structure, types, and business rules at the API boundary.

**Scope:** Email, phone, address format; quantity > 0; required fields; FK existence.

```python
# backend/shop/serializers/orders.py
class CheckoutSerializer(serializers.Serializer):
    customerName = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40)
    deliveryCity = serializers.CharField(max_length=120)
    items = CheckoutItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item required.")
        for item in value:
            if item['quantity'] <= 0:
                raise serializers.ValidationError("Quantity must be > 0.")
        return value
```

**Always validate:**
- Email format
- Phone format (basic regex)
- Address length/content
- Promo code existence
- Product existence (FK constraint)
- Item quantity > 0

### 3. Service Layer (Business Logic)

**Where:** `shop/services/orders.py`

**Purpose:** Enforce business rules that span multiple models or have complex logic.

**Scope:** Price calculations, discount limits, delivery thresholds, state machine transitions.

```python
# backend/shop/services/orders.py
def create_order_from_checkout(checkout_data, user):
    """Validate business rules and create order atomically."""
    with transaction.atomic():
        # Serializer already validated structure
        # Service validates business logic
        
        # Promo code exists and is valid?
        promo = None
        if checkout_data.get('promo_code_id'):
            promo = PromoCode.objects.get(pk=checkout_data['promo_code_id'])
            if not promo.is_active:
                raise PromoCodeExpiredError()
            if promo.min_order_amount > subtotal:
                raise MinOrderNotMetError(promo.min_order_amount)
        
        # Delivery threshold met?
        if subtotal < settings.MIN_DELIVERY_AMOUNT:
            raise MinDeliveryThresholdError(settings.MIN_DELIVERY_AMOUNT)
        
        # Create order
        order = Order.objects.create(
            user=user,
            subtotal=subtotal,
            discount=discount,
            total=total,
        )
        return order
```

**Never do here:**
- Trust client prices
- Skip serializer validation
- Assume payment already verified

### 4. External Payment Verification (LiqPay)

**Where:** `shop/views/payments.py` (callback handler)

**Purpose:** Verify payment actually completed before marking order paid.

**Scope:** HMAC signature, amount matches, order exists, idempotency.

```python
# backend/shop/views/payments.py
class LiqPayCallbackView(APIView):
    def post(self, request):
        # 1. Verify HMAC signature (reject if tampered)
        data = request.data.get('data')
        signature = request.data.get('signature')
        if not self._verify_signature(data, signature):
            return Response(status=400)  # Bad request, don't process
        
        # 2. Decode and parse payload
        payload = decode_data(data)  # Safe to parse after signature check
        
        # 3. Verify amount matches what we charged
        if Decimal(payload['amount']) != order.total:
            return Response({"detail": "Amount mismatch"}, status=400)
        
        # 4. Verify order exists and state is correct
        order = Order.objects.get(pk=payload['order_id'])
        if order.payment_status == 'paid':
            return Response(status=200)  # Idempotent: already paid
        
        # 5. Mark paid atomically
        with transaction.atomic():
            order.payment_status = 'paid'
            order.save(update_fields=['payment_status'])
            transaction.on_commit(lambda: notify_customer(order))
        
        return Response(status=200)
```

## Validation Checklist

When adding a new endpoint:

- [ ] **Frontend:** Zod schema for required fields, format (email, phone)
- [ ] **DRF Serializer:** Type hints, max_length, choices, FK validation
- [ ] **Service:** Business rules (thresholds, state machines, limits)
- [ ] **Tests:** Test happy path + each validation error

### Example: Add Delivery Address Validation

```python
# Step 1: Frontend (Zod)
const deliverySchema = z.object({
  address: z.string().min(5).max(255),  // UX feedback
});

# Step 2: Serializer (DRF)
class CheckoutSerializer(serializers.Serializer):
    deliveryAddress = serializers.CharField(
        max_length=255,
        min_length=5,
    )

# Step 3: Service (Business Logic)
def validate_delivery(city, address):
    if len(address) > 255:  # Belt-and-suspenders
        raise AddressTooLongError()
    if not re.match(r'^[\w\s,\-\.]+$', address):
        raise InvalidAddressFormatError()
    return address

# Step 4: Tests
class CheckoutValidationTest(TestCase):
    def test_address_too_short(self):
        response = self.client.post('/checkout', {
            'address': 'St'
        })
        self.assertEqual(response.status_code, 400)
    
    def test_address_too_long(self):
        response = self.client.post('/checkout', {
            'address': 'x' * 256
        })
        self.assertEqual(response.status_code, 400)
```

## Special Cases

### Price Validation

**Never trust client prices.** Always recalculate:

```python
def create_order_from_checkout(checkout_data, user):
    # Client sent prices, but recalculate from DB
    items_subtotal = Decimal('0.00')
    for item_data in checkout_data['items']:
        product = Product.objects.get(pk=item_data['product_id'])
        items_subtotal += product.price * item_data['quantity']
    
    # Verify client's subtotal matches reality
    if Decimal(checkout_data['subtotal']) != items_subtotal:
        raise PriceManipulationError()
    
    # Apply promo, delivery, taxes
    discount = apply_promo_code(promo_code, items_subtotal)
    total = items_subtotal - discount + delivery_cost
    
    # Never use client's 'total' field
```

### Promo Code Validation

Always re-verify promo code on checkout (don't trust frontend):

```python
def apply_promo_code(code_string, subtotal, user):
    promo = PromoCode.objects.get(code=code_string)
    
    # Is it active right now?
    if not promo.is_active or promo.expires_at < now():
        raise PromoCodeExpiredError()
    
    # Does user meet minimum order?
    if subtotal < promo.min_order_amount:
        raise MinOrderNotMetError()
    
    # Is it per-user limited?
    if promo.max_uses_per_user:
        used_count = Order.objects.filter(
            user=user,
            promo_code=promo,
        ).count()
        if used_count >= promo.max_uses_per_user:
            raise PromoCodeLimitExceededError()
    
    return promo.discount_percent / 100 * subtotal
```

### Rate Limiting

Protect sensitive endpoints:

```python
# backend/shop/views/orders.py
class CheckoutView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"
    
    def post(self, request):
        # Default: 10 checkouts per minute per IP
        # See settings: THROTTLE_RATES['checkout'] = '10/minute'
        ...
```

## When Validation Fails

**Client errors (4xx):** Serializer validation, missing fields, bad format.

```python
serializer = CheckoutSerializer(data=request.data)
if not serializer.is_valid():
    return Response(serializer.errors, status=400)
```

**Server errors (5xx):** Unexpected DB state, missing objects.

```python
try:
    product = Product.objects.get(pk=item_data['product_id'])
except Product.DoesNotExist:
    return Response(status=500)  # Shouldn't happen if serializer checks FK
```

## Testing Validation

Always test both happy path and rejection cases:

```python
class CheckoutValidationTest(TestCase):
    def test_checkout_valid_creates_order(self):
        response = self.client.post('/checkout', valid_payload)
        self.assertEqual(response.status_code, 201)
    
    def test_checkout_missing_email_rejected(self):
        payload = valid_payload.copy()
        del payload['email']
        response = self.client.post('/checkout', payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.json())
    
    def test_checkout_manipulated_price_rejected(self):
        payload = valid_payload.copy()
        payload['subtotal'] = '999999.00'  # Wrong!
        response = self.client.post('/checkout', payload)
        self.assertEqual(response.status_code, 400)
```
