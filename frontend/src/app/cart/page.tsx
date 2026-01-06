import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
import CartFeature from '@/features/cart/cart';

export const metadata: Metadata = {
  title: 'Кошик',
  description:
    'Оформіть замовлення у Bloomify — перегляньте вибрані букети, додайте побажання та оберіть зручний час доставки.',
};

export default function CartPage() {
  return (
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <SectionHeader
          label='Ваше замовлення'
          title='Кошик'
          description='Перевірте деталі замовлення, відрегулюйте кількість букетів та оформіть доставку.'
        />

        <CartFeature />
      </div>
    </section>
  );
}
