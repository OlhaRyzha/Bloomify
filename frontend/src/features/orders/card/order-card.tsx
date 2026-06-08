import Image from 'next/image';

import type { Order } from '../api/orders.shemas';

type OrderCardProps = {
  order: Order;
  t: (key: string) => string;
};

const ORDER_STATUS_LABEL_KEYS: Record<string, string> = {
  pending: 'order_status_pending',
  processing: 'order_status_processing',
  ready_for_delivery: 'order_status_ready_for_delivery',
  out_for_delivery: 'order_status_out_for_delivery',
  delivered: 'order_status_delivered',
  failed: 'order_status_failed',
  fulfilled: 'order_status_fulfilled',
  canceled: 'order_status_canceled',
  paid: 'status_paid',
};

const PAYMENT_STATUS_LABEL_KEYS: Record<string, string> = {
  not_required: 'payment_status_not_required',
  pending: 'payment_status_pending',
  paid: 'status_paid',
  failed: 'payment_status_failed',
  canceled: 'payment_status_canceled',
};

const PAYMENT_METHOD_LABEL_KEYS: Record<string, string> = {
  apple_pay: 'label_apple_pay',
  google_pay: 'label_google_pay',
  card: 'label_card',
  cash_on_delivery: 'status_payment_on_delivery',
};

const getOrderStatusLabelKey = (status: string) =>
  ORDER_STATUS_LABEL_KEYS[status] ?? `order_status_${status}`;

const getPaymentStatusLabelKey = (status: string) =>
  PAYMENT_STATUS_LABEL_KEYS[status] ?? `payment_status_${status}`;

const getPaymentMethodLabelKey = (paymentMethod: string) =>
  PAYMENT_METHOD_LABEL_KEYS[paymentMethod] ?? `payment_method_${paymentMethod}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export default function OrderCard({ order, t }: OrderCardProps) {
  const firstItem = order.items[0];
  const extraItemsCount = Math.max(order.items.length - 1, 0);

  return (
    <article className='rounded-3xl border border-border bg-card p-5 shadow-card'>
      <div className='flex flex-col gap-5 md:flex-row md:items-start md:justify-between'>
        <div className='flex min-w-0 gap-4'>
          {firstItem?.imageUrl && (
            <div className='relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted'>
              <Image
                src={firstItem.imageUrl}
                alt={firstItem.name}
                fill
                className='object-cover'
              />
            </div>
          )}

          <div className='min-w-0'>
            <div className='mb-2 flex flex-wrap items-center gap-2'>
              <h3 className='text-base font-semibold text-foreground'>
                {t('label_order')} #{order.id}
              </h3>

              <span className='rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'>
                {t(getOrderStatusLabelKey(order.status))}
              </span>
            </div>

            <p className='text-sm text-muted-foreground'>
              {formatDate(order.createdAt)}
            </p>

            {firstItem && (
              <div className='mt-3'>
                <p className='font-medium text-foreground'>{firstItem.name}</p>

                <p className='text-sm text-muted-foreground'>
                  {t('orders_quantity')}: {firstItem.quantity}
                  {extraItemsCount > 0 &&
                    ` + ${extraItemsCount} ${t('orders_more_items')}`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className='flex shrink-0 flex-col gap-2 text-left md:text-right'>
          <p className='text-lg font-semibold text-foreground'>
            ₴{order.total.toLocaleString('uk-UA')}
          </p>

          <p className='text-sm text-muted-foreground'>
            {t(getPaymentMethodLabelKey(order.paymentMethod))}
          </p>

          <p className='text-sm text-muted-foreground'>
            {t('orders_payment')}:{' '}
            {t(getPaymentStatusLabelKey(order.paymentStatus))}
          </p>
        </div>
      </div>

      {order.items.length > 1 && (
        <div className='mt-5 border-t border-border pt-4'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {order.items.slice(1).map((item) => (
              <div
                key={item.id}
                className='flex items-center gap-3 rounded-2xl bg-muted/40 p-3'>
                {item.imageUrl && (
                  <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted'>
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className='object-cover'
                    />
                  </div>
                )}

                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{item.name}</p>

                  <p className='text-xs text-muted-foreground'>
                    {item.quantity} × ₴{item.unitPrice.toLocaleString('uk-UA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
