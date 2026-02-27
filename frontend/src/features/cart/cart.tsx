'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InfoCard from '@/components/ui/info-card';
import { useHydrated } from '@/hooks/use-hydrated';
import type { CatalogItem } from '@/types/catalog';
import { getCatalogItemImage } from '@/utils/get-catalog-item-image';
import { Skeleton } from '@/components/ui/skeleton';
import { FREE_DELIVERY_THRESHOLD } from '@/constants/delivery.constants';
import { formatCurrency, formatTemplate } from '@/utils/i18n';
import { useGetProducts } from '@/hooks/tan-stack-query/products/use-products';
import { useCartStore } from './cart.store';
import CartItemSkeleton from './cart-item-skeleton';
import useTranslations from '@/hooks/use-translations';
import { useLocale } from '@/components/providers/locale-provider';

type CartItemWithDetails = CatalogItem & { quantity: number };

const DELIVERY_FEE = 150;

export default function CartFeature() {
  const isHydrated = useHydrated();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const strings = useTranslations();
  const { locale } = useLocale();
  const cartCopy = strings.cart;
  const deliveryCopy = strings.delivery;
  const freeDeliveryMessage = formatTemplate(deliveryCopy.freeDeliveryMessage, {
    threshold: formatCurrency(FREE_DELIVERY_THRESHOLD, locale),
  });
  const { data: catalogItems = [], isLoading: isCatalogLoading } =
    useGetProducts();

  const cartItems = useMemo<CartItemWithDetails[]>(() => {
    if (!isHydrated) {
      return [];
    }

    return items
      .map((item) => {
        const catalogItem = catalogItems?.find(
          (catalogEntry) => catalogEntry.id === item.id
        );
        if (!catalogItem) {
          return null;
        }
        return { ...catalogItem, quantity: item.quantity };
      })
      .filter((item): item is CartItemWithDetails => Boolean(item));
  }, [items, isHydrated, catalogItems]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const deliveryCost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryCost;

  if (!isHydrated) {
    return null;
  }

  if (isCatalogLoading) {
    const placeholders = Math.max(items.length || 0, 2);

    return (
      <div className='grid gap-10 lg:grid-cols-[1.6fr_0.9fr]'>
        <div className='space-y-6'>
          <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/60 px-6 py-4 text-sm text-muted-foreground'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-9 w-32 rounded-full' />
          </div>

          {Array.from({ length: placeholders }).map((_, idx) => (
            <CartItemSkeleton key={`cart-skeleton-${idx}`} />
          ))}

          <div className='rounded-2xl bg-muted/50 px-6 py-4 text-sm text-muted-foreground'>
            <Skeleton className='h-4 w-48' />
          </div>
        </div>

        <aside className='space-y-6'>
          <div className='rounded-3xl bg-gradient-card p-6 shadow-card space-y-4'>
            <Skeleton className='h-7 w-40' />
            <div className='space-y-3 pt-2'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-4 w-20' />
              </div>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
            <div className='border-t border-border pt-4'>
              <Skeleton className='h-6 w-28' />
            </div>
            <Skeleton className='h-11 w-full rounded-lg' />
            <Skeleton className='h-11 w-full rounded-lg' />
          </div>

          <div className='rounded-3xl bg-muted/60 p-5 space-y-4'>
            <Skeleton className='h-4 w-40' />
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Skeleton className='h-11 w-full rounded-lg' />
              <Skeleton className='h-11 w-full rounded-lg' />
            </div>
            <Skeleton className='h-3 w-56' />
          </div>

          <div className='grid gap-3'>
            <Skeleton className='h-20 w-full rounded-2xl' />
            <Skeleton className='h-20 w-full rounded-2xl' />
            <Skeleton className='h-20 w-full rounded-2xl' />
          </div>
        </aside>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'>
        <h2 className='font-display mb-3 text-2xl font-bold'>
          {cartCopy.emptyTitle}
        </h2>
        <p className='mb-6 text-sm text-muted-foreground'>
          {cartCopy.emptyDescription}
        </p>
        <Button
          asChild
          size='lg'>
          <Link href='/catalog'>{cartCopy.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='grid gap-10 lg:grid-cols-[1.6fr_0.9fr]'>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/60 px-6 py-4 text-sm text-muted-foreground'>
          <p>
            {formatTemplate(cartCopy.itemCount, { count: itemCount })}
          </p>
          <Button
            variant='ghost'
            size='sm'
            onClick={clearCart}>
            {cartCopy.clearCart}
          </Button>
        </div>

        {cartItems.map((item) => (
          <div
            key={item.id}
            className='flex flex-col gap-5 rounded-3xl bg-gradient-card p-5 shadow-card md:flex-row md:items-center'>
            <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted md:h-28 md:w-28'>
              <Image
                src={getCatalogItemImage(item)}
                alt={item.name}
                fill
                sizes='(max-width: 768px) 100vw, 7rem'
                className='object-cover'
              />
            </div>

            <div className='flex-1 space-y-2'>
              <span className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
                {item.tag}
              </span>
              <h3 className='font-display text-xl font-semibold'>
                {item.name}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {item.description}
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                aria-label={`Decrease ${item.name} quantity`}>
                <Minus className='h-4 w-4' />
              </Button>
              <span className='min-w-[2.5rem] text-center text-base font-semibold'>
                {item.quantity}
              </span>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                aria-label={`Increase ${item.name} quantity`}>
                <Plus className='h-4 w-4' />
              </Button>
            </div>

            <div className='flex items-center justify-between gap-4 md:flex-col md:items-end'>
              <div className='text-right'>
                <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>
                  Сума
                </p>
                <p className='font-display text-2xl text-primary'>
                  {formatCurrency(item.price * item.quantity, locale)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {formatCurrency(item.price, locale)} / букет
                </p>
              </div>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name} from cart`}>
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        ))}

        <div className='rounded-2xl bg-muted/50 px-6 py-4 text-sm text-muted-foreground'>
          {cartCopy.note}
        </div>
      </div>

      <aside className='space-y-6'>
        <div className='rounded-3xl bg-gradient-card p-6 shadow-card'>
          <h3 className='font-display text-2xl font-semibold'>
            {cartCopy.summaryTitle}
          </h3>

          <div className='mt-6 space-y-4 text-sm text-muted-foreground'>
            <div className='flex items-center justify-between'>
              <span>{cartCopy.bouquetCost}</span>
              <span className='font-semibold text-foreground'>
                {formatCurrency(subtotal, locale)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span>{cartCopy.delivery}</span>
              <span className='font-semibold text-foreground'>
                {deliveryCost === 0
                  ? 'Безкоштовно'
                  : formatCurrency(deliveryCost, locale)}
              </span>
            </div>
          </div>

          <div className='mt-6 flex items-center justify-between border-t border-border pt-4'>
            <span className='text-base font-semibold'>{cartCopy.total}</span>
            <span className='font-display text-2xl font-semibold text-primary'>
              {formatCurrency(total, locale)}
            </span>
          </div>

          <Button
            className='mt-6 w-full'
            size='lg'>
            {cartCopy.checkoutButton}
          </Button>
          <Button
            asChild
            variant='outline'
            className='mt-3 w-full'>
            <Link href='/catalog'>{cartCopy.continueShopping}</Link>
          </Button>
        </div>

        <form
          onSubmit={(event) => event.preventDefault()}
          className='rounded-3xl bg-muted/60 p-5'>
          <div className='flex items-center gap-2 text-sm font-semibold text-primary'>
            <TicketPercent className='h-4 w-4' />
            {cartCopy.promo.title}
          </div>
          <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
            <Input
              placeholder={cartCopy.promo.placeholder}
              className='bg-background'
            />
            <Button
              type='submit'
              variant='secondary'>
              {cartCopy.promo.button}
            </Button>
          </div>
          <p className='mt-3 text-xs text-muted-foreground'>
            {formatTemplate(cartCopy.promo.message, {
              freeDelivery: freeDeliveryMessage,
            })}
          </p>
        </form>

        <div className='grid gap-3'>
          <InfoCard title={cartCopy.infoCards.delivery.title}>
            {cartCopy.infoCards.delivery.description}
          </InfoCard>
          <InfoCard title={cartCopy.infoCards.packaging.title}>
            {cartCopy.infoCards.packaging.description}
          </InfoCard>
          <InfoCard title={cartCopy.infoCards.support.title}>
            {cartCopy.infoCards.support.description}
          </InfoCard>
        </div>
      </aside>
    </div>
  );
}
