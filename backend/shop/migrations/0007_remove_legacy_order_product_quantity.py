from decimal import Decimal

from django.db import migrations


def migrate_legacy_order_items(apps, schema_editor):
    Order = apps.get_model("shop", "Order")
    OrderItem = apps.get_model("shop", "OrderItem")

    legacy_orders = Order.objects.filter(product_id__isnull=False)
    for order in legacy_orders.iterator():
        if OrderItem.objects.filter(order_id=order.pk).exists():
            continue

        product = order.product
        quantity = order.quantity or 1
        unit_price = product.price
        item_total = unit_price * quantity
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
            total=item_total,
        )

        update_fields = []
        if not order.subtotal:
            order.subtotal = item_total
            update_fields.append("subtotal")
        if not order.total:
            order.total = item_total + (order.delivery_cost or Decimal("0.00"))
            update_fields.append("total")
        if update_fields:
            order.save(update_fields=update_fields)


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0006_order_status_note_alter_order_status"),
    ]

    operations = [
        migrations.RunPython(migrate_legacy_order_items, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="order",
            name="product",
        ),
        migrations.RemoveField(
            model_name="order",
            name="quantity",
        ),
    ]
