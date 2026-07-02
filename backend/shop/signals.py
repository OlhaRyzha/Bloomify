from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from shop.models.order import Order, OrderStatusLog

_order_status_cache: dict[int, str | None] = {}


@receiver(pre_save, sender=Order)
def cache_order_status(sender: type[Order], instance: Order, **kwargs) -> None:  # type: ignore[no-untyped-def]
    """Cache the old status before update."""
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            _order_status_cache[instance.pk] = old_instance.status
        except Order.DoesNotExist:
            _order_status_cache[instance.pk] = None


@receiver(post_save, sender=Order)
def log_order_status_change(  # type: ignore[no-untyped-def]
    sender: type[Order], instance: Order, created: bool, **kwargs
) -> None:
    """Log order status changes to OrderStatusLog for audit trail."""
    if created:
        return

    old_status = _order_status_cache.pop(instance.pk, None)

    if old_status and old_status != instance.status:
        OrderStatusLog.objects.create(
            order=instance,
            old_status=old_status,
            new_status=instance.status,
            reason="admin_change",
        )
