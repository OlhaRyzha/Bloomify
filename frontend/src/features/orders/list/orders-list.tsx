import { Orders } from '../api/orders.shemas';
import OrderCard from '../card/order-card';
import OrderCardSkeleton from '../card/order-card-skeleton';

type OrdersListProps = {
  orders: Orders;
  loading: boolean;
  t: (key: string) => string;
};

export default function OrdersList({ orders, loading, t }: OrdersListProps) {
  if (loading) {
    return (
      <div className='space-y-5'>
        {Array.from({ length: 3 }).map((_, index) => (
          <OrderCardSkeleton key={`order-card-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      {orders?.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          t={t}
        />
      ))}
    </div>
  );
}
