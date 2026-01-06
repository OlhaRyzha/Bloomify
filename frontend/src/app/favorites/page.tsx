import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/section-header';
import FavoritesFeature from '@/features/favorites/favorites';

export const metadata: Metadata = {
  title: 'Вибране',
  description:
    'Переглядайте збережені букети Bloomify, які вам найбільше сподобались. Поверніться до улюблених композицій та легко оформлюйте замовлення.',
};

export default function FavoritesPage() {
  return (
    <section className='bg-background pb-16 pt-28'>
      <div className='mx-auto max-w-6xl px-4'>
        <SectionHeader
          label='Ваші вподобання'
          title='Вибране'
          description='Тут зібрані букети, які торкнулися вашого серця. Зберігайте натхнення та обирайте ідеальний момент для замовлення.'
        />

        <FavoritesFeature />
      </div>
    </section>
  );
}
