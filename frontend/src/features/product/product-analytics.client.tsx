'use client';

import { useTranslation } from '@/hooks/use-translation';
import AnalyticsEvent from '@/services/analytics/analytics-event';
import { trackProductViewed } from '@/services/analytics/analytics.events';
import type { CatalogItem } from '@/types/catalog';

type ProductAnalyticsProps = {
  product: CatalogItem;
};

export default function ProductAnalytics({ product }: ProductAnalyticsProps) {
  const { locale } = useTranslation();

  return (
    <AnalyticsEvent
      dedupeKey={`${locale}:${product.id}`}
      track={() => {
        trackProductViewed({
          item: product,
          locale,
        });
      }}
    />
  );
}
