'use client';

import { useMemo } from 'react';
import { PaginationContainer } from '@/components/pagination/pagination';
import type { CatalogItem } from '@/types/catalog';
import { useGetProducts } from '@/hooks/tan-stack-query/products/use-products';
import CatalogCard from './catalog-card';
import { mapProductToCatalogItem } from './catalog-mappers';

type CatalogGridProps = {
  items?: CatalogItem[];
  pageSize?: number;
  className?: string;
};

export default function CatalogGrid({
  items,
  pageSize = 6,
  className,
}: CatalogGridProps) {
  const { data } = useGetProducts();

  const resolvedItems = useMemo(() => {
    return (data ?? items ?? []).map(mapProductToCatalogItem);
  }, [data, items]);

  return (
    <PaginationContainer
      items={resolvedItems}
      pageSize={pageSize}
      className={className}
      renderPage={(pageItems) => (
        <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {pageItems.map((product) => (
            <CatalogCard
              key={product.id}
              item={product}
            />
          ))}
        </div>
      )}
    />
  );
}
