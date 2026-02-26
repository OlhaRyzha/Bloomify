'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AddToCartButton from '@/components/ui/add-to-cart-button';
import { useHydrated } from '@/hooks/use-hydrated';
import type { CatalogItem } from '@/types/catalog';
import { getCatalogItemImage } from '@/utils/get-catalog-item-image';
import { useFavoritesStore } from '@/features/favorites/favorites.store';
import { cn } from '@/lib/utils';

type CatalogCardProps = {
  item: CatalogItem;
  className?: string;
};

export default function CatalogCard({ item, className }: CatalogCardProps) {
  const isHydrated = useHydrated();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(item.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavoriteActive = isHydrated && isFavorite;
  const imageSrc = getCatalogItemImage(item);

  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden border-0 bg-gradient-card shadow-card transition-all duration-500 hover:shadow-elevated',
        className
      )}>
      <div className='relative aspect-square overflow-hidden'>
        <Link
          href={`/catalog/${item.id}`}
          className='absolute inset-0 z-0 block'>
          <Image
            src={imageSrc}
            alt={item.name}
            fill
            sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover transition-transform duration-700 group-hover:scale-105'
          />
        </Link>

        <span className='absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
          {item.tag}
        </span>

        <button
          type='button'
          className={cn(
            'absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300',
            isFavoriteActive
              ? 'bg-blush/90 opacity-100'
              : 'bg-background/80 opacity-0 hover:bg-blush group-hover:opacity-100'
          )}
          aria-pressed={isFavoriteActive}
          onClick={() => toggleFavorite(item.id)}
          aria-label={
            isFavoriteActive
              ? `Remove ${item.name} from favorites`
              : `Add ${item.name} to favorites`
          }>
          <Heart
            className={cn(
              'h-5 w-5 transition-colors',
              isFavoriteActive ? 'fill-primary text-primary' : 'text-foreground'
            )}
          />
        </button>
      </div>

      <CardContent className='flex flex-1 flex-col p-6'>
        <h3 className='font-display mb-2 text-xl font-semibold leading-tight'>
          <Link
            href={`/catalog/${item.id}`}
            className='transition-colors hover:text-primary'>
            {item.name}
          </Link>
        </h3>
        <p className='mb-4 text-sm text-muted-foreground line-clamp-2'>
          {item.description}
        </p>
        <div className='mt-auto flex items-center justify-between'>
          <span className='font-display text-2xl font-bold text-primary'>
            {item.price} ₴
          </span>
          <AddToCartButton
            size='sm'
            itemId={item.id}
          />
        </div>
      </CardContent>
    </Card>
  );
}
