import InfoCard from '@/components/ui/info-card';
import { useTranslation } from '@/hooks/use-translation';

export default function CartInfoCards() {
  const { t } = useTranslation();

  return (
    <div className='grid gap-3'>
      <InfoCard title={t('label_delivery')}>
        {t('cart_info_cards_delivery_description')}
      </InfoCard>
      <InfoCard title={t('cart_info_cards_packaging_title')}>
        {t('cart_info_cards_packaging_description')}
      </InfoCard>
      <InfoCard title={t('label_support')}>
        {t('cart_info_cards_support_description')}
      </InfoCard>
    </div>
  );
}
