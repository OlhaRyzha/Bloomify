import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/utils/i18n';
import { getCatalogItemImage } from '@/utils/get-catalog-item-image';
import type { CartItemWithDetails } from './cart.types';

type CartLineItemProps = {
  item: CartItemWithDetails;
  onRemove: (id: string) => void;
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
    <article className='flex flex-col gap-5 rounded-3xl bg-gradient-card p-5 shadow-card md:flex-row md:items-center'>
      <figure className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted md:h-28 md:w-28'>
        <Image
          src={getCatalogItemImage(item)}
          alt={item.name}
          fill
          sizes='(max-width: 768px) 100vw, 7rem'
          className='object-cover'
        />
      </figure>

      <div className='flex-1 space-y-2'>
        <span className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
          {item.tag}
        </span>
        <h3 className='font-display text-xl font-semibold'>{item.name}</h3>
        <p className='text-sm text-muted-foreground'>{item.description}</p>
      </div>

      <div className='flex items-center gap-3'>
        <Button
          variant='outline'
          size='icon-sm'
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          aria-label={`Decrease ${item.name} quantity`}>
          <Minus className='h-4 w-4' />
        </Button>
        <span className='min-w-[2.5rem] text-center text-base font-semibold'>
          {item.quantity}
        </span>
        <Button
          variant='outline'
          size='icon-sm'
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          aria-label={`Increase ${item.name} quantity`}>
          <Plus className='h-4 w-4' />
        </Button>
      </div>

      <div className='flex items-center justify-between gap-4 md:flex-col md:items-end'>
        <div className='text-right'>
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
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name} from cart`}>
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </article>
  );
}
