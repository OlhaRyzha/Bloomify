'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { catalogItems } from '@/features/catalog/catalog-items';
import { useHydrated } from '@/hooks/use-hydrated';
import { useFavoritesStore } from './favorites.store';

export default function FavoritesFeature() {
  const isHydrated = useHydrated();
  const favoriteIds = useFavoritesStore((state) => state.ids);

  const favoriteItems = useMemo(
    () =>
      isHydrated
        ? catalogItems.filter((item) => favoriteIds.includes(item.id))
        : [],
    [favoriteIds, isHydrated]
  );

  if (!isHydrated) {
    return null;
  }

  if (favoriteItems.length === 0) {
    return (
      <div className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'>
        <h2 className='font-display mb-3 text-2xl font-bold'>
          У вас ще немає вибраних букетів
        </h2>
        <p className='mb-6 text-sm text-muted-foreground'>
          Натискайте на сердечко біля букетів, щоб додати їх до вибраного.
        </p>
        <Button
          asChild
          size='lg'>
          <Link href='/catalog'>Перейти до каталогу</Link>
        </Button>
      </div>
    );
  }

  return <CatalogGrid items={favoriteItems} />;
}
