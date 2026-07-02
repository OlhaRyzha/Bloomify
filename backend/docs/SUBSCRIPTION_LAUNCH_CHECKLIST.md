# Subscription Launch Checklist

After shipping recurring subscriptions to production, run this audit to catch edge cases and revenue-impacting bugs before customers report them.

## Pre-Launch (Before Go-Live)

- [ ] **Load test payment retry logic**
  - Simulate 50 concurrent payment attempts
  - Verify no duplicate charges when webhook retries
  - Check idempotency under high load

- [ ] **Test cancellation flows**
  - Cancel immediately after subscribe
  - Cancel mid-cycle (proration correct?)
  - Cancel after failed payment (doesn't retry old payment)

- [ ] **Verify refund process**
  - Issue refund via LiqPay dashboard
  - Confirm webhook cancels subscription
  - Check customer sees refunded state

- [ ] **Test edge cases in staging**
  - Subscribe → fail → cancel → retry
  - Subscribe → fail → upgrade (same plan)
  - Webhook arrives 10 minutes late (should still work)

## First Week (Monitor Closely)

### Daily Checks

```bash
# In Django shell or admin
from shop.models import Subscription, SubscriptionPayment

# How many subscriptions are active?
active = Subscription.objects.filter(status='active').count()
print(f"Active subscriptions: {active}")

# Are there stuck pending payments?
pending = SubscriptionPayment.objects.filter(status='pending', created_at__lt=now()-timedelta(hours=1))
print(f"Stuck pending payments: {pending.count()}")

# Any failed payments that didn't get retried?
failed = SubscriptionPayment.objects.filter(status='failed')
print(f"Failed payments: {failed.count()}")

# Are there duplicate provider_order_ids (sign of idempotency bug)?
from django.db.models import Count
dupes = SubscriptionPayment.objects.values('provider_order_id').annotate(count=Count('id')).filter(count__gt=1)
print(f"Duplicate provider_order_ids: {dupes.count()}")
```

### Weekly Reports

1. **Revenue integrity:**
   - Total MRR (active subscriptions × average plan price)
   - Growth week-over-week
   - No unexpected drops

2. **Payment success rate:**
   - % of payments that reached "paid" status
   - % that failed
   - % that had to be retried

3. **Support tickets:**
   - Any customers claiming they were double-charged?
   - Any cancellation issues?
   - Any failed payment errors they encountered?

## Post-Launch Investigation (If Issues Arise)

### Symptom: Customer says they were charged twice

```python
# Investigate
order_id = "some-liqpay-order-id"
payments = SubscriptionPayment.objects.filter(provider_order_id=order_id)
print(f"Payments for {order_id}: {payments.count()}")

for p in payments:
    print(f"  Payment {p.pk}: status={p.status}, created={p.created_at}")
    print(f"    Webhook signatures: {SubscriptionPaymentLog.objects.filter(payment=p).count()}")
```

**Likely cause:** Webhook arrived twice; check idempotency logic.

**Fix:** If idempotency broken, issue refund manually in LiqPay dashboard, notify customer.

### Symptom: Payments stuck in "pending"

```python
from datetime import timedelta
from django.utils import timezone

# Find payments older than 1 hour in pending
stuck = SubscriptionPayment.objects.filter(
    status='pending',
    created_at__lt=timezone.now() - timedelta(hours=1)
)

for p in stuck:
    print(f"Payment {p.pk}: created {p.created_at}, subscription {p.subscription.pk}")
```

**Likely cause:**
- Webhook never arrived from LiqPay
- Webhook arrived but view crashed before saving
- LiqPay integration misconfigured

**Action:**
- Check LiqPay logs for failed delivery
- Run manual sync: `python manage.py sync_liqpay_payments --days 1`
- Contact LiqPay support if signature/URL mismatch

### Symptom: Refunds not stopping subscriptions

```python
# Find subscriptions that should be canceled (refunded)
from shop.models import Subscription

active_with_refunded = Subscription.objects.filter(
    status='active',
    payments__status='refunded'
).distinct()

print(f"Active subs with refunded payments: {active_with_refunded.count()}")
for sub in active_with_refunded[:10]:
    print(f"  Subscription {sub.pk}: should be canceled")
```

**Likely cause:** Refund webhook doesn't trigger subscription cancellation.

**Fix:** Manually cancel via admin, issue refund credit.

### Symptom: Upgrade charges wrong amount

```python
payment = SubscriptionPayment.objects.get(pk=123)
subscription = payment.subscription

print(f"Payment amount: {payment.amount}")
print(f"Old plan price: {subscription.plan.price}")
print(f"New plan price: {payment.target_plan.price}")
print(f"Expected diff: {payment.target_plan.price - subscription.plan.price}")
```

**Likely cause:** Pro-rata calculation wrong, or not applied.

**Action:** Check service logic in `calculate_upgrade_charge()`, adjust for future payments.

## Testing Checklist (Before Marking "Safe")

Run these in staging with real data:

```bash
# 1. Idempotency: Same webhook twice = same outcome
curl -X POST http://localhost:8000/payments/liqpay/subscription-callback \
  -d "data=<base64>&signature=<sig>"
curl -X POST http://localhost:8000/payments/liqpay/subscription-callback \
  -d "data=<base64>&signature=<sig>"
# Both should return 200, subscription status should be same

# 2. Retry: Late webhook = subscription still activated
# Simulate delay, send callback 10 minutes later
# Should still activate subscription

# 3. Rate limiting: Can't spam checkout
for i in {1..15}; do
  curl -X POST http://localhost:8000/subscriptions/subscribe \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"plan_id": 1}' &
done
# Should get 429s after limit

# 4. Cancel immediately: Subscribe then cancel
curl -X POST http://localhost:8000/subscriptions/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan_id": 1}'
curl -X POST http://localhost:8000/subscriptions/unsubscribe \
  -H "Authorization: Bearer $TOKEN"
# Subscription should be canceled, no charge should happen
```

## Hand-Off to Support

**Tell support team:**

1. **How to check subscription status:**
   - In admin: Orders → Subscriptions
   - Find customer by email
   - See status (pending, active, canceled)

2. **What to do if customer claims they were charged twice:**
   - Don't refund without verification
   - Check payment logs
   - If confirmed duplicate, issue refund via LiqPay dashboard
   - Notify engineering

3. **What to do if customer wants to cancel:**
   - Link them to unsubscribe endpoint
   - Cancellation is instant
   - No refund unless within X days (define policy)

4. **What to do if subscription didn't activate:**
   - Ask customer if they saw payment confirmation
   - Check payment status in admin
   - If stuck in "pending", notify engineering
