import type { ReactNode } from 'react';
import Image, { type StaticImageData } from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Gift,
  Heart,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import heroImage from '@/assets/hero-flowers.jpg';
import subscriptionImage from '@/assets/subscription-box.jpg';

const authContent = {
  login: {
    label: 'Особистий кабінет',
    title: 'Повернімося до ваших улюблених букетів',
    description:
      'Увійдіть, щоб швидко оформлювати замовлення, керувати підпискою та зберігати вподобані композиції.',
    aspect: 'aspect-[5/3]',
    image: heroImage,
    imageAlt: 'Рожеві троянди в стильному букеті Bloomify',
    badge: {
      label: 'Ваші підбірки',
      value: 'Квіткові історії',
    },
    highlights: [
      {
        title: 'Історія замовлень',
        description: 'Вся ваша історія покупок в одному місці.',
        icon: Calendar,
      },
      {
        title: 'Збережені вподобання',
        description: 'Швидкий доступ до улюблених букетів.',
        icon: Heart,
      },
      {
        title: 'Безпечні платежі',
        description: 'Захищений профіль та сповіщення.',
        icon: ShieldCheck,
      },
    ],
  },
  register: {
    label: 'Створити акаунт',
    title: 'Нова квіткова історія починається тут',
    description:
      'Зареєструйтесь, щоб отримати бонус на перше замовлення, збирати улюблені букети та відстежувати доставку.',
    image: subscriptionImage,
    aspect: 'aspect-[4/3]',
    imageAlt: 'Ніжні півонії у святковому букеті Bloomify',
    badge: {
      label: 'Подарунок',
      value: 'Знижка -10%',
    },
    highlights: [
      {
        title: 'Бонуси та подарунки',
        description: 'Спеціальні пропозиції для нових клієнтів.',
        icon: Gift,
      },
      {
        title: 'Підписка на новинки',
        description: 'Дізнавайтесь першими про сезонні колекції.',
        icon: Sparkles,
      },
      {
        title: 'Відстеження доставки',
        description: 'Статус букетів в реальному часі.',
        icon: Truck,
      },
    ],
  },
} as const;

type AuthVariant = keyof typeof authContent;

type AuthShellProps = {
  variant: AuthVariant;
  children: ReactNode;
};

type Highlight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type AuthContent = {
  label: string;
  title: string;
  description: string;
  aspect: string;
  image: StaticImageData;
  imageAlt: string;
  badge: { label: string; value: string };
  highlights: readonly Highlight[];
};

export default function AuthShell({ variant, children }: AuthShellProps) {
  const content = authContent[variant] as AuthContent;

  return (
    <section className='relative overflow-hidden bg-gradient-hero pb-16 pt-28'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute left-6 top-16 h-72 w-72 rounded-full bg-blush/30 blur-3xl' />
        <div className='absolute bottom-8 right-8 h-96 w-96 rounded-full bg-sage/30 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-6xl px-4'>
        <div className='grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='order-2 space-y-8 lg:order-1'>
            <span className='inline-flex items-center gap-2 rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground'>
              {content.label}
            </span>

            <div className='space-y-4'>
              <h1 className='font-display text-4xl font-bold md:text-5xl'>
                {content.title}
              </h1>
              <p className='text-base text-muted-foreground md:text-lg'>
                {content.description}
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              {content.highlights.map((item) => (
                <div
                  key={item.title}
                  className='rounded-2xl bg-card/70 p-4 shadow-soft backdrop-blur'>
                  <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <item.icon className='h-5 w-5' />
                  </div>
                  <p className='text-sm font-semibold text-foreground'>
                    {item.title}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div
              className='relative opacity-0 animate-fade-up'
              style={{ animationDelay: '0.2s' }}>
              <div className='absolute -left-6 -top-6 h-24 w-24 rounded-full bg-gold/30 blur-2xl' />
              <div
                className={`relative ${content.aspect} overflow-hidden rounded-3xl bg-gradient-card p-3 shadow-card`}>
                <Image
                  src={content.image}
                  alt={content.imageAlt}
                  className='rounded-2xl'
                />
              </div>
              <div className='absolute -bottom-6 right-6 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-card'>
                <p className='text-[0.6rem] uppercase tracking-[0.3em] text-primary-foreground/70'>
                  {content.badge.label}
                </p>
                <p className='font-display text-lg font-semibold'>
                  {content.badge.value}
                </p>
              </div>
            </div>
          </div>

          <div className='order-1 flex w-full justify-center lg:order-2 lg:justify-end'>
            <div className='w-full max-w-md'>{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
