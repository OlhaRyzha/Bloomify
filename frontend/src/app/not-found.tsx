import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section className='relative overflow-hidden bg-gradient-hero pb-24 pt-28'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -left-10 top-24 h-72 w-72 rounded-full bg-blush/40 blur-3xl' />
        <div className='absolute -bottom-10 right-0 h-96 w-96 rounded-full bg-sage/30 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-4xl px-4 text-center'>
        <span className='mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground'>
          Помилка 404
        </span>
        <h1 className='font-display text-5xl font-bold md:text-6xl'>
          Сторінку не знайдено
        </h1>
        <p className='mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg'>
          Схоже, що цієї сторінки більше немає або адреса введена некоректно.
        </p>

        <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
          <Button
            asChild
            size='lg'>
            <Link href='/'>
              <Home className='mr-2 h-5 w-5' />
              На головну
            </Link>
          </Button>
          <Button
            asChild
            size='lg'
            variant='secondary'>
            <Link href='/catalog'>
              Перейти в каталог
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
