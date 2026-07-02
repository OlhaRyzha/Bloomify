"""
Subscription post-launch audit command.

Runs daily checks for revenue integrity, payment health, and customer issues.

Usage:
    python manage.py audit_subscriptions [--full] [--format json|text]

Examples:
    # Daily quick check
    python manage.py audit_subscriptions

    # Full audit with all checks
    python manage.py audit_subscriptions --full

    # Output as JSON for monitoring
    python manage.py audit_subscriptions --format json
"""

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from django.utils import timezone

from shop.models import Subscription, SubscriptionPayment


class Command(BaseCommand):
    help = "Audit subscription health and revenue integrity"

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--full",
            action="store_true",
            help="Run full audit with detailed analysis",
        )
        parser.add_argument(
            "--format",
            default="text",
            choices=["text", "json"],
            help="Output format",
        )

    def handle(self, *args, **options) -> None:
        full = options.get("full", False)
        output_format = options.get("format", "text")

        results = self._run_audit(full=full)

        if output_format == "json":
            import json

            self.stdout.write(json.dumps(results, indent=2, default=str))
        else:
            self._print_text_report(results)

    def _run_audit(self, full: bool = False) -> dict:
        """Run all audit checks."""
        now = timezone.now()
        results: dict = {
            "timestamp": now.isoformat(),
            "checks": {},
            "passed": True,
        }

        # 1. Active subscriptions count
        results["checks"]["active_count"] = self._check_active_subscriptions()

        # 2. Stuck pending payments
        results["checks"]["stuck_pending"] = self._check_stuck_pending_payments()

        # 3. Failed payments
        results["checks"]["failed_payments"] = self._check_failed_payments()

        # 4. Duplicate provider_order_ids (idempotency bug)
        results["checks"]["duplicate_ids"] = self._check_duplicate_provider_ids()

        # 5. MRR calculation
        results["checks"]["mrr"] = self._calculate_mrr()

        if full:
            # 6. Payment success rate
            results["checks"][
                "payment_success_rate"
            ] = self._check_payment_success_rate()

            # 7. Recent cancellations
            results["checks"][
                "recent_cancellations"
            ] = self._check_recent_cancellations()

            # 8. Refund anomalies
            results["checks"]["refund_anomalies"] = self._check_refund_anomalies()

        # Mark as failed if any critical check failed
        for _, check_result in results["checks"].items():
            if check_result.get("status") == "FAIL":
                results["passed"] = False

        return results

    def _check_active_subscriptions(self) -> dict:
        """Count active subscriptions."""
        count = Subscription.objects.filter(status="active").count()
        return {
            "status": "OK",
            "active_subscriptions": count,
            "threshold": "expecting > 0",
        }

    def _check_stuck_pending_payments(self) -> dict:
        """Find payments pending for > 1 hour."""
        one_hour_ago = timezone.now() - timedelta(hours=1)
        stuck = SubscriptionPayment.objects.filter(
            status="pending",
            created_at__lt=one_hour_ago,
        ).count()

        status = "FAIL" if stuck > 0 else "OK"
        return {
            "status": status,
            "stuck_pending_count": stuck,
            "threshold": "should be 0",
            "action": (
                "Check LiqPay webhook delivery logs if > 0" if stuck > 0 else None
            ),
        }

    def _check_failed_payments(self) -> dict:
        """Count failed payments in last 24 hours."""
        last_24h = timezone.now() - timedelta(hours=24)
        failed = SubscriptionPayment.objects.filter(
            status="failed",
            created_at__gte=last_24h,
        ).count()

        return {
            "status": "OK",
            "failed_payments_24h": failed,
            "note": "High count may indicate payment provider issues",
        }

    def _check_duplicate_provider_ids(self) -> dict:
        """Detect duplicate provider_order_ids (idempotency bug indicator)."""
        dupes = (
            SubscriptionPayment.objects.values("provider_order_id")
            .annotate(count=Count("id"))
            .filter(count__gt=1)
        )

        dupe_count = dupes.count()
        status = "FAIL" if dupe_count > 0 else "OK"

        result: dict = {
            "status": status,
            "duplicate_provider_ids_count": dupe_count,
        }

        if dupe_count > 0:
            result["action"] = (
                "Review idempotency logic; issue refunds if duplicate charges"
            )
            result["duplicates"] = [
                {"provider_order_id": d["provider_order_id"], "count": d["count"]}
                for d in dupes[:5]
            ]

        return result

    def _calculate_mrr(self) -> dict:
        """Calculate Monthly Recurring Revenue."""
        active_subs = Subscription.objects.filter(status="active").select_related(
            "plan"
        )

        total_mrr = Decimal("0.00")
        for sub in active_subs:
            total_mrr += sub.plan.price

        return {
            "status": "OK",
            "mrr_uah": str(total_mrr),
            "active_subscriptions": active_subs.count(),
            "note": "Based on active subscription count × plan price",
        }

    def _check_payment_success_rate(self) -> dict:
        """Calculate % of payments that reached 'paid' status."""
        total = SubscriptionPayment.objects.count()

        if total == 0:
            return {"status": "OK", "message": "No payments yet"}

        paid = SubscriptionPayment.objects.filter(status="paid").count()
        success_rate = (paid / total) * 100 if total > 0 else 0

        status = "OK" if success_rate >= 95 else "WARN"

        return {
            "status": status,
            "success_rate_percent": round(success_rate, 2),
            "paid_count": paid,
            "total_count": total,
            "threshold": ">= 95% is healthy",
        }

    def _check_recent_cancellations(self) -> dict:
        """Check cancellations in last 7 days."""
        last_7d = timezone.now() - timedelta(days=7)
        canceled = Subscription.objects.filter(
            status="canceled",
            created_at__gte=last_7d,
        ).count()

        return {
            "status": "OK",
            "canceled_last_7d": canceled,
            "note": "Normal churn; investigate if spike > 10%",
        }

    def _check_refund_anomalies(self) -> dict:
        """Find refund-related anomalies."""
        anomaly_subs = (
            Subscription.objects.filter(
                Q(status="active") & Q(payments__status="refunded")
            )
            .distinct()
            .values_list("pk", flat=True)[:5]
        )

        anomaly_count = len(list(anomaly_subs))
        status = "FAIL" if anomaly_count > 0 else "OK"

        result: dict = {
            "status": status,
            "active_subs_with_refund_count": anomaly_count,
        }

        if anomaly_count > 0:
            result["action"] = (
                "Manually cancel these subscriptions and issue refund credits"
            )
            result["affected_subscription_ids"] = list(anomaly_subs)

        return result

    def _print_text_report(self, results: dict) -> dict:
        """Format results as human-readable text."""
        self.stdout.write(self.style.SUCCESS("Subscription Audit Report"))
        self.stdout.write(f"Timestamp: {results['timestamp']}\n")

        for check_name, check_result in results["checks"].items():
            status = check_result.get("status", "?")

            if status == "FAIL":
                style = self.style.ERROR
            elif status == "WARN":
                style = self.style.WARNING
            else:
                style = self.style.SUCCESS

            self.stdout.write(style(f"▸ {check_name.upper()}: {status}"))

            for key, value in check_result.items():
                if key not in ("status",):
                    if isinstance(value, list):
                        self.stdout.write(f"    {key}:")
                        for item in value:
                            self.stdout.write(f"      - {item}")
                    else:
                        self.stdout.write(f"    {key}: {value}")

            self.stdout.write("")

        overall = (
            self.style.SUCCESS("✓ PASSED")
            if results["passed"]
            else self.style.ERROR("✗ FAILED")
        )
        self.stdout.write(f"Overall: {overall}\n")

        return results
