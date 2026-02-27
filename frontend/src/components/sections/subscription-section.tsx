'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Gift } from 'lucide-react';
import subscriptionImage from '@/assets/subscription-box.jpg';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { formatTemplate } from '@/utils/i18n';

type Plan = {
  name: string;
  price: number;
  period: string;
  icon: React.ElementType;
  description: string;
  features: string[];
  popular: boolean;
};

const planConfig: Array<{
  key: 'base' | 'premium' | 'luxe';
  price: number;
  icon: React.ElementType;
  popular: boolean;
}> = [
  { key: 'base', price: 999, icon: Gift, popular: false },
  { key: 'premium', price: 1799, icon: Sparkles, popular: true },
  { key: 'luxe', price: 2999, icon: Crown, popular: false },
];

export default function SubscriptionSection() {
  const { t } = useTranslation();
  const plans: Plan[] = planConfig.map((config) => {
    const base = `sections.subscription.plans.${config.key}`;
    return {
      name: t(`${base}.name`),
      description: t(`${base}.description`),
      period: t(`${base}.period`),
      price: config.price,
      icon: config.icon,
      features: t(`${base}.features`, { returnObjects: true }) as unknown as string[],
      popular: config.popular,
    };
  });
  return (
    <section
      id='subscription'
      className='bg-gradient-hero py-24'>
        <div className='mx-auto max-w-6xl px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='mb-16 text-center'>
            <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
              {t('sections.subscription.label')}
            </span>
            <h2 className='font-display mb-4 text-4xl font-bold md:text-5xl'>
              {t('sections.subscription.title')}
            </h2>
            <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
              {t('sections.subscription.description')}
            </p>
          </motion.div>

        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className='relative order-2 lg:order-1'>
            <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-sage/30 to-blush/30 blur-2xl' />
            <Image
              src={subscriptionImage}
              alt='Квіткова підписка Bloomify'
              className='relative mx-auto w-full max-w-md rounded-3xl shadow-elevated'
              priority={false}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className='order-1 space-y-4 lg:order-2'>
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
                    {t('sections.subscription.popularBadge')}
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
                        <Check className='h-3 w-3' />
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
                        {formatTemplate(t('sections.subscription.moreLabel'), {
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
                    {t('sections.subscription.cta')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
