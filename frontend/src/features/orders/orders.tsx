'use client';

import { useMemo, useRef } from 'react';

import FeedbackState from '@/components/ui/feedback-state';
import { getLocalizedPath } from '@/i18n/routing';
import { useTranslation } from '@/hooks/use-translation';
import { getInfiniteQueryItems } from '@/utils/query/get-infinite-query-items';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';

import OrdersList from './list/orders-list';
import { useInfiniteOrders } from './api/use-orders';
import { useInfiniteScroll } from '@/shared/query/use-infinite-scroll';

export default function OrdersFeature() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { locale, t } = useTranslation();

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
    return (
      <FeedbackState
        title={t('orders_empty_title')}
        description={t('orders_empty_description')}
        actionLabel={t('orders_empty_cta')}
        actionHref={getLocalizedPath('/catalog', locale)}
        className='bg-gradient-card shadow-card'
      />
    );
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
