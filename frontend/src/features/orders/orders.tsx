'use client';

import { useMemo, useRef } from 'react';

import { CatalogActionFeedbackState } from '@/components/ui/translated-feedback-state';
import { useTranslation } from '@/hooks/use-translation';
import { getInfiniteQueryItems } from '@/services/api/query/get-infinite-query-items';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';

import OrdersList from './list/orders-list';
import { useInfiniteOrders } from './api/use-orders';
import { useInfiniteScroll } from '@/services/api/query/use-infinite-scroll';

export default function OrdersFeature() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteOrders();

  const orders = useMemo(
    () => getInfiniteQueryItems(data?.pages),
    [data?.pages]
  );

  useInfiniteScroll({
    targetRef: loadMoreRef,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  if (!isNonEmptyArray(orders) && !isLoading) {
    return <CatalogActionFeedbackState translationKeyPrefix='orders' />;
  }

  return (
    <>
      <OrdersList
        orders={orders}
        loading={isLoading}
        t={t}
      />

      <div
        ref={loadMoreRef}
        className='h-8'
      />

      {isFetchingNextPage && (
        <OrdersList
          orders={[]}
          loading
          t={t}
        />
      )}
    </>
  );
}
