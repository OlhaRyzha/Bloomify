import type { ReactNode } from 'react';
import Image from 'next/image';
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
import { Container } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';

const authAssets = {
  login: {
    image: heroImage,
    aspect: 'aspect-[5/3]',
    icons: [Calendar, Heart, ShieldCheck] as LucideIcon[],
  },
  register: {
    image: subscriptionImage,
    aspect: 'aspect-[4/3]',
    icons: [Gift, Sparkles, Truck] as LucideIcon[],
  },
} as const;

type AuthVariant = keyof typeof authAssets;

type AuthShellProps = {
  variant: AuthVariant;
  children: ReactNode;
};

type AuthShellHighlight = {
  description: string;
  title: string;
};

export default async function AuthShell({ variant, children }: AuthShellProps) {
  const { t } = await getServerTranslator();
  const assets = authAssets[variant];
  const highlights = t(`auth_shell_${variant}_highlights`, {
    returnObjects: true,
  }) as unknown as AuthShellHighlight[];

  return (
    <section className='relative overflow-hidden bg-gradient-hero pb-16 pt-28'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute left-6 top-16 h-72 w-72 rounded-full bg-blush/30 blur-3xl' />
        <div className='absolute bottom-8 right-8 h-96 w-96 rounded-full bg-sage/30 blur-3xl' />
      </div>

      <Container className='relative'>
        <div className='grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='order-2 space-y-8 lg:order-1'>
            <span className='inline-flex items-center gap-2 rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground'>
              {t(`auth_shell_${variant}_label`)}
            </span>

            <div className='space-y-4'>
              <h1 className='font-display text-4xl font-bold md:text-5xl'>
                {t(`auth_shell_${variant}_title`)}
              </h1>
              <p className='text-base text-muted-foreground md:text-lg'>
                {t(`auth_shell_${variant}_description`)}
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              {highlights.map((item, index) => {
                const Icon = assets.icons[index];
                return (
                  <div
                    key={item.title}
                    className='rounded-2xl bg-card/70 p-4 shadow-soft backdrop-blur'>
                    <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <Icon
                        className='h-5 w-5'
                        aria-hidden
                      />
                    </div>
                    <p className='text-sm font-semibold text-foreground'>
                      {item.title}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div
              className='relative opacity-0 animate-fade-up'
              style={{ animationDelay: '0.2s' }}>
              <div className='absolute -left-6 -top-6 h-24 w-24 rounded-full bg-gold/30 blur-2xl' />
              <div
                className={`relative ${assets.aspect} overflow-hidden rounded-3xl bg-gradient-card p-3 shadow-card`}>
                <Image
                  src={assets.image}
                  alt={t(`auth_shell_${variant}_image_alt`)}
                  sizes='(max-width: 1024px) 100vw, 45vw'
                  className='rounded-2xl'
                />
              </div>
              <div className='absolute -bottom-6 right-6 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-card'>
                <p className='text-[0.6rem] uppercase tracking-[0.3em] text-primary-foreground/70'>
                  {t(`auth_shell_${variant}_badge_label`)}
                </p>
                <p className='font-display text-lg font-semibold'>
                  {t(`auth_shell_${variant}_badge_value`)}
                </p>
              </div>
            </div>
          </div>

          <div className='order-1 flex w-full justify-center lg:order-2 lg:justify-end'>
            <div className='w-full max-w-md'>{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
