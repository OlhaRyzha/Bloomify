from decimal import Decimal

from django.test import TestCase

from shop import models
from shop.models.order import OrderItem, OrderStatusLog
from shop.tests.factories import create_order, create_product


class ModelsSmokeTest(TestCase):
    def test_models_module_imports(self):
        self.assertIsNotNone(models)


class OrderModelTest(TestCase):
    def test_total_price_falls_back_to_order_items_when_total_is_empty(self):
        product = create_product(price="125.00")
        order = create_order(total=Decimal("0.00"))
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=2,
            unit_price="125.00",
            total="250.00",
        )

        self.assertEqual(order.total_price, Decimal("250.00"))


class OrderStatusLogTest(TestCase):
    def test_status_change_creates_log_entry(self):
        order = create_order(status="pending")
        initial_log_count = OrderStatusLog.objects.filter(order=order).count()

        order.status = "paid"
        order.save()

        final_log_count = OrderStatusLog.objects.filter(order=order).count()
        self.assertEqual(final_log_count, initial_log_count + 1)

    def test_status_log_records_old_and_new_status(self):
        order = create_order(status="pending")

        order.status = "processing"
        order.save()

        log = OrderStatusLog.objects.filter(order=order).latest("changed_at")
        self.assertEqual(log.old_status, "pending")
        self.assertEqual(log.new_status, "processing")

    def test_no_log_created_when_status_unchanged(self):
        order = create_order(status="pending")
        OrderStatusLog.objects.filter(order=order).delete()

        order.customer_name = "New Name"
        order.save()

        self.assertEqual(OrderStatusLog.objects.filter(order=order).count(), 0)

    def test_multiple_status_changes_create_multiple_logs(self):
        order = create_order(status="pending")
        OrderStatusLog.objects.filter(order=order).delete()

        statuses = ["paid", "processing", "ready_for_delivery", "delivered"]
        for status in statuses:
            order.status = status
            order.save()

        logs = list(
            OrderStatusLog.objects.filter(order=order)
            .order_by("changed_at")
            .values_list("new_status", flat=True)
        )
        self.assertEqual(logs, statuses)
