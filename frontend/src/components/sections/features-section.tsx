'use client';

import { motion } from 'framer-motion';
import { Truck, Shield, Clock, Leaf } from 'lucide-react';
import { ElementType } from 'react';
import { useTranslation } from '@/hooks/use-translation';

type Feature = {
  icon: ElementType;
  title: string;
  description: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function FeaturesSection() {
  const { t } = useTranslation();
  const iconRegistry: Record<string, ElementType> = {
    fastDelivery: Truck,
    freshGuarantee: Shield,
    easyOrdering: Clock,
    ecoFriendly: Leaf,
  };
  const featureItems = t('sections_features_items', { returnObjects: true }) as unknown as Array<{
    id: string;
    title: string;
    description: string;
  }>;
  const features: Feature[] = featureItems.map((item) => ({
    icon: iconRegistry[item.id] ?? Truck,
    title: item.title,
    description: item.description,
  }));

  return (
    <section className='bg-muted/30 py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='mb-16 text-center'>
          <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
            {t('sections_features_label')}
          </span>
          <h2 className='font-display text-4xl font-bold md:text-5xl'>
            {t('sections_features_title')}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className='group text-center'>
              <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-cta shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated'>
                <feature.icon className='h-10 w-10 text-primary-foreground' />
              </div>

              <h3 className='font-display mb-3 text-xl font-semibold'>
                {feature.title}
              </h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
