import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SurfacePanel from '@/components/ui/surface-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/utils/i18n';
import { getLocalizedPath } from '@/i18n/routing';

type CartSummaryProps = {
  subtotal: number;
  deliveryCost: number;
  total: number;
};

export default function CartSummary({
  subtotal,
  deliveryCost,
  total,
}: CartSummaryProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <SurfacePanel as='div'>
      <h3 className='font-display text-2xl font-semibold'>
        {t('cart_summary_title')}
      </h3>

      <div className='mt-6 space-y-4 text-sm text-muted-foreground'>
        <div className='flex items-center justify-between'>
          <span>{t('cart_bouquet_cost')}</span>
          <span className='font-semibold text-foreground'>
            {formatCurrency(subtotal, locale)}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span>{t('cart_delivery')}</span>
          <span className='font-semibold text-foreground'>
            {deliveryCost === 0
              ? t('common_free')
              : formatCurrency(deliveryCost, locale)}
          </span>
        </div>
      </div>

      <div className='mt-6 flex items-center justify-between border-t border-border pt-4'>
        <span className='text-base font-semibold'>{t('cart_total')}</span>
        <span className='font-display text-2xl font-semibold text-primary'>
          {formatCurrency(total, locale)}
        </span>
      </div>

      <Button
        asChild
        className='mt-6 w-full'
        size='lg'>
        <Link href={getLocalizedPath('/checkout', locale)}>
          {t('cart_checkout_button')}
        </Link>
      </Button>
      <Button
        asChild
        variant='outline'
        className='mt-3 w-full'>
        <Link href={getLocalizedPath('/catalog', locale)}>
          {t('cart_continue_shopping')}
        </Link>
      </Button>
    </SurfacePanel>
  );
}
