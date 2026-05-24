import FeedbackState from '@/components/ui/feedback-state';
import { useTranslation } from '@/hooks/use-translation';
import { getLocalizedPath } from '@/i18n/routing';

export default function CartEmptyState() {
  const { locale, t } = useTranslation();

  return (
    <FeedbackState
      title={t('cart_empty_title')}
      description={t('cart_empty_description')}
      actionLabel={t('cart_empty_cta')}
      actionHref={getLocalizedPath('/catalog', locale)}
      className='bg-gradient-card shadow-card'
    />
  );
}
