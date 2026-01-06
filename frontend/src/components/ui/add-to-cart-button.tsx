'use client';

import type { ComponentProps } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { ShoppingBag } from 'lucide-react';
import { Button, buttonVariants } from './button';
import { useCartStore } from '@/features/cart/cart.store';

type AddToCartButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'size' | 'variant'
> & {
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
  label?: string;
  itemId?: string;
};

export default function AddToCartButton({
  size = 'sm',
  variant = 'default',
  label = 'До кошика',
  itemId,
  className,
  onClick,
  ...props
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const iconClassName = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const handleClick: ComponentProps<typeof Button>['onClick'] = (event) => {
    onClick?.(event);

    if (event?.defaultPrevented || !itemId) {
      return;
    }

    addItem(itemId);
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={itemId ? handleClick : onClick}
      {...props}>
      <ShoppingBag className={iconClassName} />
      {label}
    </Button>
  );
}
