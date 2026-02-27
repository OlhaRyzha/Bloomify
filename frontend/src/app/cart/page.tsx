import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
import CartFeature from '@/features/cart/cart';
import { getServerTranslator } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Кошик',
  description:
    'Оформіть замовлення у Bloomify — перегляньте вибрані букети, додайте побажання та оберіть зручний час доставки.',
};

export default async function CartPage() {
  const { t } = await getServerTranslator();

  return (
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <SectionHeader
          label={t('cart_page_label')}
          title={t('cart_page_title')}
          description={t('cart_page_description')}
        />

        <CartFeature />
      </div>
    </section>
  );
}
