'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
  getConfirmationCopy,
  type ConfirmationCopyRequest,
} from '@/components/ui/confirmation-copy';
import FeedbackState from '@/components/ui/feedback-state';
import { useLocale } from '@/components/providers/locale-provider';
import { useHydrated } from '@/hooks/use-hydrated';
import { useTranslation } from '@/hooks/use-translation';
import { formatTemplate, getBouquetCountLabel } from '@/utils/i18n';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { useGetProducts } from '@/features/catalog/api/use-products';

import CartEmptyState from './components/cart-empty-state';
import CartInfoCards from './components/cart-info-cards';
import CartLineItem from './components/cart-line-item';
import CartLoadingState from './components/cart-loading-state';
import CartSummary from './components/cart-summary';
import { getCartSummary } from './components/cart.helpers';
import CartPromoCodeForm from './forms/cart-promo-code-form';
import { selectCartViewState } from './store/cart.selectors';
import { useCartStore } from './store/cart.store';
import type { CartItemWithDetails } from './cart.types';
import {
  trackCartItemAdded,
  trackCartItemRemoved,
  trackCartViewed,
} from '@/services/analytics/analytics.events';

type CartConfirmation = {
  request: ConfirmationCopyRequest;
  onConfirm: () => void;
} | null;

export default function CartFeature() {
  const isHydrated = useHydrated();
  const [confirmation, setConfirmation] = useState<CartConfirmation>(null);

  const { items, removeItem, updateQuantity, clearCart } = useCartStore(
    useShallow(selectCartViewState)
  );

  const { t } = useTranslation();
  const { locale } = useLocale();

  const trackedCartKeyRef = useRef<string | null>(null);

  const {
    data: catalogItems = [],
    isError: isCatalogError,
    isLoading: isCatalogLoading,
    refetch: refetchCatalogItems,
  } = useGetProducts();

  const { cartItems, deliveryCost, itemCount, subtotal, total } =
    useMemo(() => {
      if (!isHydrated) {
        return getCartSummary([], []);
      }

      return getCartSummary(items, catalogItems);
    }, [items, catalogItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !isNonEmptyArray(cartItems)) {
      return;
    }

    const cartKey = cartItems
      .map((item) => `${item.id}:${item.quantity}:${item.price}`)
      .join('|');

    if (trackedCartKeyRef.current === cartKey) {
      return;
    }

    trackedCartKeyRef.current = cartKey;

    trackCartViewed({
      itemCount,
      value: total,
      locale,
    });
  }, [cartItems, isHydrated, itemCount, locale, total]);

  const trackQuantityChange = useCallback(
    (item: CartItemWithDetails, nextQuantity: number) => {
      const delta = nextQuantity - item.quantity;

      if (delta === 0) {
        return;
      }

      const quantity = Math.abs(delta);
      const track = delta > 0 ? trackCartItemAdded : trackCartItemRemoved;

      track({
        item,
        quantity,
        source: 'cart',
        locale,
      });
    },
    [locale]
  );

  const handleUpdateQuantity = useCallback(
    (item: CartItemWithDetails, quantity: number) => {
      trackQuantityChange(item, quantity);
      updateQuantity(item.id, quantity);
    },
    [trackQuantityChange, updateQuantity]
  );

  const requestRemoveItem = useCallback(
    (item: CartItemWithDetails) => {
      setConfirmation({
        request: {
          action: 'delete',
          entity: 'cartItem',
          entityName: item.name,
        },
        onConfirm: () => {
          removeItem(item.id);

          trackCartItemRemoved({
            item,
            quantity: item.quantity,
            source: 'cart',
            locale,
          });
        },
      });
    },
    [locale, removeItem]
  );

  const requestClearCart = useCallback(() => {
    setConfirmation({
      request: {
        action: 'clear',
        entity: 'cart',
      },
      onConfirm: () => {
        cartItems.forEach((item) => {
          trackCartItemRemoved({
            item,
            quantity: item.quantity,
            source: 'cart_clear',
            locale,
          });
        });

        clearCart();
      },
    });
  }, [cartItems, clearCart, locale]);

  const handleRetryCatalog = useCallback(async () => {
    await refetchCatalogItems();
  }, [refetchCatalogItems]);

  const handleConfirm = useCallback(() => {
    confirmation?.onConfirm();
    setConfirmation(null);
  }, [confirmation]);

  const handleConfirmationOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setConfirmation(null);
    }
  }, []);

  const confirmationCopy = useMemo(() => {
    if (!confirmation) {
      return null;
    }

    return getConfirmationCopy(t, confirmation.request);
  }, [confirmation, t]);

  if (!isHydrated) {
    return null;
  }

  if (isCatalogLoading) {
    const placeholders = Math.max(items.length || 0, 2);

    return <CartLoadingState placeholders={placeholders} />;
  }

  if (isCatalogError) {
    return (
      <FeedbackState
        tone='error'
        title={t('cart_error_title')}
        description={t('cart_error_description')}
        actionLabel={t('common_try_again')}
        onAction={handleRetryCatalog}
      />
    );
  }

  if (!isNonEmptyArray(cartItems)) {
    return <CartEmptyState />;
  }

  return (
    <div className='grid gap-10 lg:grid-cols-[1.6fr_0.9fr]'>
      <div className='space-y-6'>
        <div className='flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/60 px-6 py-5 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left'>
          <p>
            {formatTemplate(t('cart_item_count'), {
              count: itemCount,
              item: getBouquetCountLabel(itemCount, locale),
            })}
          </p>

          <Button
            variant='ghost'
            size='sm'
            onClick={requestClearCart}
            aria-label={t('cart_clear_cart')}>
            {t('cart_clear_cart')}
          </Button>
        </div>

        {cartItems.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            onRemove={requestRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
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

      {confirmationCopy ? (
        <ConfirmationDialog
          open
          tone='danger'
          title={confirmationCopy.title}
          description={confirmationCopy.description}
          confirmLabel={confirmationCopy.confirmLabel}
          cancelLabel={confirmationCopy.cancelLabel}
          closeLabel={confirmationCopy.closeLabel}
          onConfirm={handleConfirm}
          onOpenChange={handleConfirmationOpenChange}
        />
      ) : null}
    </div>
  );
}
