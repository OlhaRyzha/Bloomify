import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
import FavoritesFeature from '@/features/favorites/favorites';
import { getServerTranslator } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Вибране',
  description:
    'Переглядайте збережені букети Bloomify, які вам найбільше сподобались. Поверніться до улюблених композицій та легко оформлюйте замовлення.',
};

export default async function FavoritesPage() {
  const { t } = await getServerTranslator();

  return (
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <SectionHeader
          label={t('favorites_page_label')}
          title={t('favorites_page_title')}
          description={t('favorites_page_description')}
        />

        <FavoritesFeature />
      </div>
    </section>
  );
}
