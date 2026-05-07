import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

export default function CartEmptyState() {
  const { t } = useTranslation();

  return (
    <div className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'>
      <h2 className='font-display mb-3 text-2xl font-bold'>
        {t('cart_empty_title')}
      </h2>
      <p className='mb-6 text-sm text-muted-foreground'>
        {t('cart_empty_description')}
      </p>
      <Button
        asChild
        size='lg'>
        <Link href='/catalog'>{t('cart_empty_cta')}</Link>
      </Button>
    </div>
  );
}
