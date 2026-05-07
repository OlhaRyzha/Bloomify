'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import { formatTemplate } from '@/utils/i18n';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { selectCartViewState } from './store/cart.selectors';
import { useCartStore } from './store/cart.store';
import { useTranslation } from '@/hooks/use-translation';
import CartEmptyState from './cart-empty-state';
import CartInfoCards from './cart-info-cards';
import CartLineItem from './cart-line-item';
import CartLoadingState from './cart-loading-state';
import CartPromoCodeForm from './forms/cart-promo-code-form';
import CartSummary from './cart-summary';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { getCartSummary } from './cart.helpers';

export default function CartFeature() {
  const isHydrated = useHydrated();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore(
    useShallow(selectCartViewState)
  );
  const { t } = useTranslation();
  const { data: catalogItems = [], isLoading: isCatalogLoading } =
    useGetProducts();

  const { cartItems, deliveryCost, itemCount, subtotal, total } = useMemo(() => {
    if (!isHydrated) {
      return getCartSummary([], []);
    }

    return getCartSummary(items, catalogItems);
  }, [items, isHydrated, catalogItems]);

  if (!isHydrated) {
    return null;
  }

  if (isCatalogLoading) {
    const placeholders = Math.max(items.length || 0, 2);

    return <CartLoadingState placeholders={placeholders} />;
  }

  if (!isNonEmptyArray(cartItems)) {
    return <CartEmptyState />;
  }

  return (
    <div className='grid gap-10 lg:grid-cols-[1.6fr_0.9fr]'>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/60 px-6 py-4 text-sm text-muted-foreground'>
          <p>{formatTemplate(t('cart_item_count'), { count: itemCount })}</p>
          <Button
            variant='ghost'
            size='sm'
            onClick={clearCart}
            aria-label={t('cart_clear_cart')}>
            {t('cart_clear_cart')}
          </Button>
        </div>

        {cartItems.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}

        <div className='rounded-2xl bg-muted/50 px-6 py-4 text-sm text-muted-foreground'>
          {t('cart_note')}
        </div>
      </div>

      <aside className='space-y-6'>
        <CartSummary
          subtotal={subtotal}
          deliveryCost={deliveryCost}
          total={total}
        />
        <CartPromoCodeForm />
        <CartInfoCards />
      </aside>
    </div>
  );
}
