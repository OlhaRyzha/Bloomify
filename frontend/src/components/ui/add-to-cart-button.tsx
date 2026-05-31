'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button, buttonVariants } from './button';
import {
  selectAddCartItem,
  selectCartItemQuantity,
  selectUpdateCartQuantity,
} from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import {
  trackCartItemAdded,
  trackCartItemRemoved,
} from '@/services/analytics/analytics.events';

type AddToCartButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'size' | 'variant'
> & {
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
  label?: string;
  itemId?: string;
  itemName?: string;
  itemCategory?: string;
  itemPrice?: number;
  source?: string;
};

export default function AddToCartButton({
  size = 'sm',
  variant = 'default',
  label,
  itemId,
  itemName,
  itemCategory,
  itemPrice,
  source,
  className,
  onClick,
  ...props
}: AddToCartButtonProps) {
  const addItem = useCartStore(selectAddCartItem);
  const updateQuantity = useCartStore(selectUpdateCartQuantity);
  const quantity = useCartStore(selectCartItemQuantity(itemId));
  const debouncedQuantity = useDebounce(quantity, 600);
  const previousToastQuantity = useRef(quantity);
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const iconClassName = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonLabel = label ?? t('cart_add_button');
  const itemLabel = itemName ?? t('cart_add_toast_fallback_name');

  useEffect(() => {
    if (!itemId || debouncedQuantity <= 0) {
      previousToastQuantity.current = debouncedQuantity;
      return;
    }

    if (previousToastQuantity.current === debouncedQuantity) {
      return;
    }

    previousToastQuantity.current = debouncedQuantity;
    toast({
      title: t('cart_quantity_toast_title'),
      description: t('cart_quantity_toast_description', {
        count: debouncedQuantity,
        name: itemLabel,
      }),
      variant: 'info',
      duration: 2500,
      className: 'max-w-xs px-4 py-3',
    });
  }, [debouncedQuantity, itemId, itemLabel, t, toast]);

  const handleClick: ComponentProps<typeof Button>['onClick'] = (event) => {
    onClick?.(event);

    if (event?.defaultPrevented || !itemId) {
      return;
    }

    addItem(itemId);
    trackCartItemAdded({
      item: {
        id: itemId,
        name: itemLabel,
        tag: itemCategory,
        price: itemPrice ?? 0,
      },
      source,
      locale,
    });
  };

  if (itemId && quantity > 0) {
    const quantityButtonSize = size === 'lg' ? 'icon' : 'icon-sm';

    return (
      <div
        role='group'
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-primary px-1 py-1 text-primary-foreground',
          size === 'lg' ? 'h-10' : 'h-8',
          className
        )}
        aria-label={t('cart_quantity_controls_label', { name: itemLabel })}>
        <Button
          type='button'
          variant='ghost'
          size={quantityButtonSize}
          className='text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground'
          onClick={() => {
            updateQuantity(itemId, quantity - 1);
            trackCartItemRemoved({
              item: {
                id: itemId,
                name: itemLabel,
                tag: itemCategory,
                price: itemPrice ?? 0,
              },
              source,
              locale,
            });
          }}
          aria-label={t('cart_decrease_quantity_label', { name: itemLabel })}>
          <Minus
            className='h-4 w-4'
            aria-hidden={true}
          />
        </Button>
        <span className='min-w-6 text-center text-sm font-semibold'>
          {quantity}
        </span>
        <Button
          type='button'
          variant='ghost'
          size={quantityButtonSize}
          className='text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground'
          onClick={() => {
            updateQuantity(itemId, quantity + 1);
            trackCartItemAdded({
              item: {
                id: itemId,
                name: itemLabel,
                tag: itemCategory,
                price: itemPrice ?? 0,
              },
              source,
              locale,
            });
          }}
          aria-label={t('cart_increase_quantity_label', { name: itemLabel })}>
          <Plus
            className='h-4 w-4'
            aria-hidden={true}
          />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={itemId ? handleClick : onClick}
      {...props}>
      <ShoppingBag
        className={iconClassName}
        aria-hidden
      />
      {buttonLabel}
    </Button>
  );
}
