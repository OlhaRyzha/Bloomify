"""
Synchronize subscription payment statuses with LiqPay.

Useful if webhooks missed or to manually reconcile payment status.

Usage:
    python manage.py sync_liqpay_payments [--days 7] [--dry-run]

Examples:
    # Sync payments from last 7 days
    python manage.py sync_liqpay_payments --days 7

    # Preview changes without applying
    python manage.py sync_liqpay_payments --days 7 --dry-run

    # Force sync specific order
    python manage.py sync_liqpay_payments --order-id 123
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from shop.models import SubscriptionPayment
from shop.services.payments import liqpay_sync_payment_status


class Command(BaseCommand):
    help = "Synchronize subscription payment statuses with LiqPay"

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Sync payments from last N days (default: 7)",
        )
        parser.add_argument(
            "--order-id",
            type=str,
            help="Sync specific order ID instead of date range",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without applying",
        )

    def handle(self, *args, **options) -> None:
        days = options.get("days", 7)
        order_id = options.get("order_id", None)
        dry_run = options.get("dry_run", False)

        if order_id:
            self._sync_single_order(order_id, dry_run=dry_run)
        else:
            self._sync_date_range(days, dry_run=dry_run)

    def _sync_single_order(self, order_id: str, dry_run: bool = False) -> None:
        """Sync single order."""
        try:
            payment = SubscriptionPayment.objects.get(provider_order_id=order_id)
        except SubscriptionPayment.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Payment not found: {order_id}"))
            return

        self.stdout.write(f"Syncing order: {order_id}")
        old_status = payment.status

        if dry_run:
            self.stdout.write("[DRY RUN] Would check status with LiqPay")
            self.stdout.write(f"Current status: {old_status}")
            return

        # Actually sync
        try:
            liqpay_sync_payment_status(payment)
            payment.refresh_from_db()

            if payment.status != old_status:
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Updated: {old_status} → {payment.status}")
                )
            else:
                self.stdout.write(f"  No change (status: {payment.status})")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Failed to sync: {e}"))

    def _sync_date_range(self, days: int, dry_run: bool = False) -> None:
        """Sync all payments from last N days."""
        cutoff_date = timezone.now() - timedelta(days=days)

        payments = SubscriptionPayment.objects.filter(
            created_at__gte=cutoff_date
        ).exclude(status__in=("paid", "canceled", "refunded"))

        count = payments.count()
        self.stdout.write(f"Found {count} non-final payments in last {days} days\n")

        if dry_run:
            self.stdout.write("[DRY RUN] Would sync:")
            for payment in payments[:5]:
                self.stdout.write(
                    f"  - Order {payment.provider_order_id}: {payment.status}"
                )
            if count > 5:
                self.stdout.write(f"  ... and {count - 5} more")
            return

        updated_count = 0
        for payment in payments:
            old_status = payment.status

            try:
                liqpay_sync_payment_status(payment)
                payment.refresh_from_db()

                if payment.status != old_status:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ Order {payment.provider_order_id}: {old_status} → {payment.status}"
                        )
                    )
                    updated_count += 1
                else:
                    self.stdout.write(
                        f"  Order {payment.provider_order_id}: {payment.status} (no change)"
                    )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ Order {payment.provider_order_id}: {e}")
                )

        self.stdout.write(f"\nSynced {count} payments, {updated_count} updated")
