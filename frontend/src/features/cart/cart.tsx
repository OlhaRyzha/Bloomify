'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
  getConfirmationCopy,
  type ConfirmationCopyRequest,
} from '@/components/ui/confirmation-copy';
import FeedbackState from '@/components/ui/feedback-state';
import { useHydrated } from '@/hooks/use-hydrated';
import { formatTemplate, getBouquetCountLabel } from '@/utils/i18n';
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
import { useLocale } from '@/components/providers/locale-provider';
import type { CartItemWithDetails } from './cart.types';
import {
  trackCartItemAdded,
  trackCartItemRemoved,
  trackCartViewed,
} from '@/services/analytics/analytics.events';

type CartConfirmation =
  | {
      request: ConfirmationCopyRequest;
      onConfirm: () => void;
    }
  | null;

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

  const { cartItems, deliveryCost, itemCount, subtotal, total } = useMemo(() => {
    if (!isHydrated) {
      return getCartSummary([], []);
    }

    return getCartSummary(items, catalogItems);
  }, [items, isHydrated, catalogItems]);

  useEffect(() => {
    if (!isHydrated || !isNonEmptyArray(cartItems)) {
      return;
    }

    const cartKey = cartItems
      .map((item) => `${item.id}:${item.quantity}`)
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

  const trackQuantityChange = (
    item: CartItemWithDetails,
    nextQuantity: number
  ) => {
    const delta = nextQuantity - item.quantity;
    if (delta === 0) {
      return;
    }

    const quantity = Math.abs(delta);
    const track = delta > 0 ? trackCartItemAdded : trackCartItemRemoved;
    track({ item, quantity, source: 'cart', locale });
  };

  const requestRemoveItem = (item: CartItemWithDetails) => {
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
  };

  const requestClearCart = () => {
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
  };

  const activeConfirmation = confirmation;
  const confirmationCopy = activeConfirmation
    ? getConfirmationCopy(t, activeConfirmation.request)
    : null;

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
        onAction={async () => {
          await refetchCatalogItems();
        }}
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
            onUpdateQuantity={(id, quantity) => {
              trackQuantityChange(item, quantity);
              updateQuantity(id, quantity);
            }}
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
          onConfirm={() => activeConfirmation?.onConfirm()}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmation(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
