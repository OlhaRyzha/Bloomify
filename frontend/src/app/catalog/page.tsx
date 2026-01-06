import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
import CatalogGrid from '@/features/catalog/catalog-grid';

export const metadata: Metadata = {
  title: 'Каталог букетів',
  description:
    'Ознайомтесь з каталогом букетів Bloomify — витончені флористичні композиції для будь-якої нагоди. Авторські букети з доставкою по всій Україні.',
};

export default function CatalogPage() {
  return (
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <SectionHeader
          label='Вибір флористів'
          title='Каталог букетів'
          description='Обирайте витончені флористичні композиції для будь-якої нагоди — від ніжних знаків уваги до розкішних подарунків. Кожен букет створений з любов’ю, сезонних квітів та бездоганного смаку наших флористів.'
        />

        <CatalogGrid />
      </div>
    </section>
  );
}
