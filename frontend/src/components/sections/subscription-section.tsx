import Image from 'next/image';
import {
  Check,
  Crown,
  Sparkles,
  Gift,
  type LucideIcon,
} from 'lucide-react';
import subscriptionImage from '@/assets/subscription-box.jpg';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { formatTemplate } from '@/utils/i18n';
import { getServerTranslator } from '@/i18n/server';

type Plan = {
  name: string;
  price: number;
  period: string;
  icon: LucideIcon;
  description: string;
  features: string[];
  popular: boolean;
};

const planConfig: Array<{
  key: 'base' | 'premium' | 'luxe';
  price: number;
  icon: LucideIcon;
  popular: boolean;
}> = [
  { key: 'base', price: 999, icon: Gift, popular: false },
  { key: 'premium', price: 1799, icon: Sparkles, popular: true },
  { key: 'luxe', price: 2999, icon: Crown, popular: false },
];

export default async function SubscriptionSection() {
  const { t } = await getServerTranslator();
  const plans: Plan[] = planConfig.map((config) => {
    const base = `plan_${config.key}`;
    return {
      name: t(`${base}_name`),
      description: t(`${base}_description`),
      period: t(`${base}_period`),
      price: config.price,
      icon: config.icon,
      features: t(`${base}_features`, { returnObjects: true }) as unknown as string[],
      popular: config.popular,
    };
  });
  return (
    <section
      id='subscription'
      className='bg-gradient-hero py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-16 text-center'>
          <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
            {t('sections_subscription_label')}
          </span>
          <h2 className='font-display mb-4 text-4xl font-bold md:text-5xl'>
            {t('sections_subscription_title')}
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            {t('sections_subscription_description')}
          </p>
        </header>

        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <div className='relative order-2 lg:order-1'>
            <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-sage/30 to-blush/30 blur-2xl' />
            <Image
              src={subscriptionImage}
              alt={t('sections_subscription_image_alt')}
              className='relative mx-auto w-full max-w-md rounded-3xl shadow-elevated'
              priority={false}
            />
          </div>

          <div className='order-1 space-y-4 lg:order-2'>
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  'relative overflow-hidden transition-all duration-300 hover:shadow-elevated',
                  plan.popular
                    ? 'bg-primary text-primary-foreground ring-2 ring-gold'
                    : 'bg-card hover:bg-card/80'
                )}>
                {plan.popular && (
                  <div className='absolute right-0 top-0 rounded-bl-xl bg-gold px-4 py-1 text-xs font-semibold text-forest'>
                    {t('sections_subscription_popular_badge')}
                  </div>
                )}

                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          plan.popular
                            ? 'bg-primary-foreground/20'
                            : 'bg-primary/10'
                        )}>
                        <plan.icon
                          className={cn(
                            'h-6 w-6',
                            plan.popular
                              ? 'text-primary-foreground'
                              : 'text-primary'
                          )}
                          aria-hidden
                        />
                      </div>

                      <div>
                        <h3
                          className={cn(
                            'font-display text-xl font-bold',
                            plan.popular
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                          )}>
                          {plan.name}
                        </h3>
                        <p
                          className={cn(
                            'text-sm',
                            plan.popular
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          )}>
                          {plan.description}
                        </p>
                      </div>
                    </div>

                    <div className='text-right'>
                      <span
                        className={cn(
                          'font-display text-3xl font-bold',
                          plan.popular
                            ? 'text-primary-foreground'
                            : 'text-primary'
                        )}>
                        {plan.price}₴
                      </span>
                      <span
                        className={cn(
                          'block text-sm',
                          plan.popular
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        )}>
                        /{plan.period}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='mb-4 flex flex-wrap gap-2'>
                    {plan.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                          plan.popular
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}>
                        <Check
                          className='h-3 w-3'
                          aria-hidden
                        />
                        {feature}
                      </span>
                    ))}

                    {plan.features.length > 3 && (
                      <span
                        className={cn(
                          'px-2 py-1 text-xs',
                          plan.popular
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        )}>
                        {formatTemplate(t('sections_subscription_more_label'), {
                          count: plan.features.length - 3,
                        })}
                      </span>
                    )}
                  </div>

                  <Button
                    className={cn(
                      'w-full',
                      plan.popular && 'bg-gold text-forest font-semibold'
                    )}
                    variant='default'>
                    {t('sections_subscription_cta')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
