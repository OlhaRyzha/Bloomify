'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-flowers.jpg';
import { Button } from '../ui/button';
import { FREE_DELIVERY_THRESHOLD } from '@/constants/delivery.constants';
import { formatCurrency, formatTemplate } from '@/utils/i18n';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';

export default function HeroSection() {
  const { t } = useTranslation();
  const stats = [
    { value: '5000+', label: t('hero.stats.satisfiedCustomers') },
    { value: '50+', label: t('hero.stats.flowerVarieties') },
    { value: '24/7', label: t('hero.stats.support') },
  ];
  const { locale } = useLocale();
  const freeDeliveryMessage = formatTemplate(t('delivery.freeDeliveryMessage'), {
    threshold: formatCurrency(FREE_DELIVERY_THRESHOLD, locale),
  });

  return (
    <section className='relative flex min-h-screen items-center overflow-hidden bg-gradient-hero pt-20'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute left-10 top-20 h-72 w-72 rounded-full bg-blush/30 blur-3xl' />
        <div className='absolute bottom-20 right-10 h-96 w-96 rounded-full bg-sage/30 blur-3xl' />
      </div>

      <div className='relative z-10 mx-auto w-full max-w-6xl p-4'>
        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='text-center lg:text-left'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className='mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/60 px-4 py-2 backdrop-blur-sm'>
              <Sparkles className='h-4 w-4 text-yellow-600' />
              <span className='text-sm font-medium text-secondary-foreground'>
                {t('hero.badge')}
              </span>
            </motion.div>

            <h1 className='font-display mb-6 text-5xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl'>
              {t('hero.titleLine1')}
              <br />
              <span className='text-primary'>{t('hero.titleLine2')}</span>
            </h1>

            <p className='mx-auto mb-8 max-w-xl text-lg text-muted-foreground lg:mx-0'>
              {t('hero.description')}
            </p>

            <div className='flex flex-col justify-center gap-4 sm:flex-row lg:justify-start'>
              <Button
                asChild
                size='lg'>
                <Link href='/catalog'>
                  {t('hero.primaryCta')}
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>

              <Button
                asChild
                variant='secondary'
                size='lg'>
                <Link href='/#subscription'>{t('hero.secondaryCta')}</Link>
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className='mt-12 flex justify-center gap-8 lg:justify-start'>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className='text-center lg:text-left'>
                  <p className='font-display text-2xl font-bold text-primary'>
                    {stat.value}
                  </p>
                  <p className='text-xs text-muted-foreground'>{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className='relative'>
            <div className='relative'>
              <div className='absolute inset-0 rotate-6 rounded-3xl bg-gradient-to-br from-blush/20 to-sage/20 blur-2xl' />

              <Image
                src={heroImage}
                alt={t('hero.imageAlt')}
                priority
                className='relative mx-auto w-full max-w-lg rounded-3xl shadow-elevated animate-float'
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className='absolute -bottom-6 right-4 lg:right-8'>
              <div className='rounded-full  bg-gradient-to-r from-blush/60 to-[#6b7760]/70 px-5 py-3 shadow-lg backdrop-blur-sm'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>🚚</span>
                  <span className='text-sm font-semibold text-white'>
                    {freeDeliveryMessage}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
