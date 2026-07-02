# Subscription Post-Launch Audit Playbook

After shipping subscriptions to production, use this playbook to monitor health and catch issues early.

## Daily Automated Checks (Cron)

Schedule this daily check via your monitoring system (e.g., GitHub Actions, Cron, Airflow):

```bash
cd /path/to/backend
python manage.py audit_subscriptions --format json
```

This runs:
- Active subscription count (expect growth)
- Stuck pending payments (should be 0; if > 0, webhook issue)
- Failed payments (track trends)
- Duplicate provider_order_ids (idempotency bug indicator)
- Monthly Recurring Revenue (MRR) calculation

**Output:** JSON suitable for alerting systems.

### GitHub Actions Daily Check

The scheduled workflow lives in `.github/workflows/subscription-audit.yml`.
It runs every day at 06:00 UTC (09:00 Kyiv), executes
`audit_subscriptions --full --format json` against the production database,
and fails the job (GitHub emails you) when any check reports `FAIL`.

Required repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `AUDIT_DATABASE_URL` | Production `postgresql://...` connection string (read access is enough) |
| `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY` | Needed only for Django settings to load; audit itself does not call LiqPay |

If `AUDIT_DATABASE_URL` is not configured, the workflow skips with a warning
instead of failing. Trigger a manual run anytime via **Actions → Subscription
Audit → Run workflow**.

## Weekly Full Audit (Manual)

Run every Monday morning:

```bash
python manage.py audit_subscriptions --full
```

This adds:
- Payment success rate (should be >= 95%)
- Recent cancellations (trend analysis)
- Refund anomalies (subscriptions that should be canceled)

**Review checklist:**
- [ ] No stuck pending payments
- [ ] Success rate >= 95%
- [ ] No duplicate charges
- [ ] MRR trending up (or stable)
- [ ] Cancellation rate < 5% (normal churn)

## Payment Synchronization (If Webhooks Missed)

If a payment webhook was delayed or lost, manually sync:

```bash
# Sync last 7 days
python manage.py sync_liqpay_payments --days 7

# Preview changes first
python manage.py sync_liqpay_payments --days 7 --dry-run

# Sync specific order
python manage.py sync_liqpay_payments --order-id "liq_12345678"
```

This queries LiqPay API to reconcile payment status and updates Bloomify records.

## Investigation Scenarios

### Scenario: "Customer says they were charged twice"

**1. Check payment records:**

```python
# Django shell
from shop.models import SubscriptionPayment

order_id = "liq_12345678"  # From customer
payments = SubscriptionPayment.objects.filter(provider_order_id=order_id)
print(f"Found {payments.count()} payments for {order_id}")

for p in payments:
    print(f"  Payment {p.pk}: status={p.status}, amount={p.amount}, created={p.created_at}")
```

**2. Check logs for duplicate webhooks:**

```python
from shop.models import SubscriptionPaymentLog

for p in payments:
    logs = SubscriptionPaymentLog.objects.filter(payment=p)
    print(f"Payment {p.pk}: {logs.count()} log entries")
```

**3. If truly duplicated:**

- Issue refund in LiqPay dashboard (manual refund)
- Notify customer
- Review idempotency logic in `shop/services/subscriptions.py` (`apply_subscription_payment_payload`)

### Scenario: "Payments stuck in pending"

**1. Find stuck payments:**

```python
from datetime import timedelta
from django.utils import timezone
from shop.models import SubscriptionPayment

stuck = SubscriptionPayment.objects.filter(
    status='pending',
    created_at__lt=timezone.now() - timedelta(hours=1)
)

for p in stuck:
    print(f"Order {p.provider_order_id}: pending for {timezone.now() - p.created_at}")
```

**2. Check if webhook arrived:**

```python
from shop.models import SubscriptionPaymentLog

for p in stuck:
    logs = SubscriptionPaymentLog.objects.filter(payment=p)
    if logs.exists():
        print(f"Webhook arrived but status not updated")
    else:
        print(f"No webhook yet — check LiqPay delivery logs")
```

**3. Manually sync:**

```bash
python manage.py sync_liqpay_payments --order-id "liq_12345678"
```

**4. If still pending after sync:**

- Contact LiqPay support
- Check callback URL configuration in `settings.py`
- Check LiqPay webhook signing (HMAC signature)

### Scenario: "Cancellation wasn't processed"

**1. Check subscription state:**

```python
from shop.models import Subscription

sub = Subscription.objects.get(pk=123)
print(f"Status: {sub.status}")
print(f"Next billing: {sub.next_billing_date}")
print(f"Canceled at: {sub.canceled_at}")
```

**2. If stuck in 'active' when should be 'canceled':**

```python
# Manually cancel (force)
sub.status = "canceled"
sub.canceled_at = timezone.now()
sub.save()

# Optional: Create cancel log
from shop.models import SubscriptionStatusLog
SubscriptionStatusLog.objects.create(
    subscription=sub,
    old_status="active",
    new_status="canceled",
    reason="Manual cancel: customer complaint"
)
```

### Scenario: "Upgrade charged wrong amount"

**1. Check upgrade calculation:**

```python
from shop.models import SubscriptionPayment

payment = SubscriptionPayment.objects.select_related(
    "subscription__plan", "target_plan"
).get(pk=123)
sub = payment.subscription

print(f"Payment amount: {payment.amount}")
print(f"Old plan: {sub.plan.name} @ {sub.plan.price}")
print(f"New plan: {payment.target_plan.name} @ {payment.target_plan.price}")

# Upgrade charge is the plan price difference
# (see UpgradeSubscriptionView in shop/views/subscriptions.py)
expected = payment.target_plan.price - sub.plan.price
print(f"Expected: {expected}")

if payment.amount != expected:
    print(f"ERROR: Mismatch! {payment.amount} vs {expected}")
```

**2. If wrong:**

- Issue refund/credit manually
- Review the upgrade logic in `UpgradeSubscriptionView` (`shop/views/subscriptions.py`)
- Add test case to prevent regression

## Monitoring Dashboard Queries

Add these to your monitoring tool (Datadog, Grafana, etc.):

### Daily Revenue (MRR)

```sql
SELECT 
  COUNT(DISTINCT subscription_id) as active_subs,
  SUM(subscription_plan.price) as mrr
FROM subscription
JOIN subscription_plan ON subscription.plan_id = subscription_plan.id
WHERE subscription.status = 'active'
```

Expected: Trending upward week-over-week.

### Payment Health

```sql
SELECT 
  status,
  COUNT(*) as count
FROM subscription_payment
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status
```

Expected: High % in 'paid', low % in 'failed' or 'pending'.

### Success Rate (Last 7 Days)

```sql
SELECT 
  ROUND(100.0 * COUNT(CASE WHEN status = 'paid' THEN 1 END) / COUNT(*), 2) as success_rate
FROM subscription_payment
WHERE created_at >= NOW() - INTERVAL '7 days'
```

Expected: >= 95%.

### Churn Rate (Monthly)

```sql
SELECT 
  ROUND(100.0 * COUNT(CASE WHEN status = 'canceled' THEN 1 END) / COUNT(DISTINCT subscription_id), 2) as churn_rate
FROM subscription
WHERE updated_at >= NOW() - INTERVAL '30 days'
```

Expected: < 10% for early customers.

## Escalation Procedures

### Alert: Stuck pending > 5

**Severity:** High
**Action:**
1. Run `audit_subscriptions` to confirm
2. Check LiqPay delivery logs
3. Manually sync: `sync_liqpay_payments --days 1`
4. If still stuck, contact LiqPay support

### Alert: Duplicate provider_order_ids detected

**Severity:** Critical (revenue leak)
**Action:**
1. Count affected customers
2. Issue refunds manually in LiqPay dashboard
3. Notify customers
4. Review idempotency logic
5. Add monitoring query to prevent future occurrences

### Alert: Success rate < 90%

**Severity:** High
**Action:**
1. Check for LiqPay service status
2. Review recent code changes
3. Check payment provider configuration
4. Contact LiqPay support if widespread

### Alert: MRR drop > 20% week-over-week

**Severity:** High (business impact)
**Action:**
1. Analyze churn spike (did a batch cancel?)
2. Check for bugs in upgrade/downgrade
3. Review support tickets for payment issues
4. Notify product/business team

## Handoff to Support / Billing Team

Share these docs with your support team:

1. **How to check subscription status:**
   - Django admin: Orders → Subscriptions
   - Search by customer email
   - See status (pending, active, canceled)

2. **How to cancel subscription:**
   ```bash
   python manage.py shell
   from shop.models import Subscription
   sub = Subscription.objects.get(pk=123)
   sub.cancel()  # Cancels immediately
   ```

3. **How to issue refund:**
   - Use LiqPay dashboard (manual)
   - Link to payment in Bloomify admin
   - Document reason in internal notes

4. **Escalation path:**
   - Engineering: Issues with webhooks, stuck payments, duplicate charges
   - LiqPay support: Service issues, configuration, webhook delivery

## Runbook Commands

Quick reference for on-call:

```bash
# Daily check
python manage.py audit_subscriptions

# Full audit
python manage.py audit_subscriptions --full

# Investigate stuck payments
python manage.py sync_liqpay_payments --days 1 --dry-run

# Fix stuck payments
python manage.py sync_liqpay_payments --days 1

# Check specific order
python manage.py sync_liqpay_payments --order-id "liq_12345678"
```

## First Month Post-Launch Checklist

- [ ] Day 1: Deploy and monitor real-time logs
- [ ] Day 1-7: Run `audit_subscriptions --full` daily
- [ ] Day 7: Review payment success rate, MRR, churn
- [ ] Day 14: Compare against baseline (day 7-14 vs day 1-7)
- [ ] Day 30: Full health check, identify trends
- [ ] Day 30: Document any issues and fixes for future reference
