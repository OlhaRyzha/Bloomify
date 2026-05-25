import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FallbackImage from '@/components/ui/fallback-image';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/utils/i18n';
import { getCatalogItemImage } from '@/utils/get-catalog-item-image';
import type { CartItemWithDetails } from './cart.types';

type CartLineItemProps = {
  item: CartItemWithDetails;
  onRemove: (item: CartItemWithDetails) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
};

export default function CartLineItem({
  item,
  onRemove,
  onUpdateQuantity,
}: CartLineItemProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <article className='relative grid gap-5 rounded-3xl bg-gradient-card p-5 pt-8 pr-12 text-center shadow-card sm:grid-cols-[7rem_1fr] sm:text-left lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:p-6 lg:pt-10 lg:pr-16'>
      <Button
        variant='ghost'
        size='icon-sm'
        className='absolute right-4 top-4'
        onClick={() => onRemove(item)}
        aria-label={t('cart_remove_item_label', { name: item.name })}>
        <Trash2
          className='h-4 w-4'
          aria-hidden
        />
      </Button>

      <figure className='relative mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-muted sm:mx-0'>
        <FallbackImage
          src={getCatalogItemImage(item)}
          alt={item.name}
          fill
          sizes='(max-width: 768px) 100vw, 7rem'
          className='object-cover'
        />
      </figure>

      <div className='min-w-0 space-y-2'>
        <span className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
          {item.tag}
        </span>
        <h3 className='font-display text-xl font-semibold'>{item.name}</h3>
        <p className='text-sm text-muted-foreground'>{item.description}</p>
      </div>

      <div className='mx-auto flex w-full max-w-40 flex-col items-center gap-4 sm:col-span-2 lg:col-span-1 lg:mx-0 lg:w-40'>
        <div className='grid w-full grid-cols-[2rem_1fr_2rem] items-center justify-items-center gap-3'>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            aria-label={t('cart_decrease_quantity_label', { name: item.name })}>
            <Minus
              className='h-4 w-4'
              aria-hidden
            />
          </Button>
          <span className='text-center text-base font-semibold'>
            {item.quantity}
          </span>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            aria-label={t('cart_increase_quantity_label', { name: item.name })}>
            <Plus
              className='h-4 w-4'
              aria-hidden
            />
          </Button>
        </div>

        <div className='w-full text-center'>
          <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>
            {t('cart_sum')}
          </p>
          <p className='font-display text-2xl text-primary'>
            {formatCurrency(item.price * item.quantity, locale)}
          </p>
          <p className='text-xs text-muted-foreground'>
            {formatCurrency(item.price, locale)} / {t('common_bouquet')}
          </p>
        </div>
      </div>
    </article>
  );
}
