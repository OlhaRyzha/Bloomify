import { useInfiniteQuery } from '@tanstack/react-query';

import OrderService from './orders.service';
import { ordersQueryKeys } from './query-keys';

const ORDERS_PAGE_SIZE = 6;

export function useInfiniteOrders() {
  return useInfiniteQuery({
    queryKey: ordersQueryKeys.lists(),
    queryFn: ({ pageParam = 1 }) =>
      OrderService.getOrders({
        page: pageParam,
        pageSize: ORDERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}
