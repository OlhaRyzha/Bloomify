'use client';

import { motion } from 'framer-motion';
import { Truck, Shield, Clock, Leaf } from 'lucide-react';

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Truck,
    title: 'Швидка доставка',
    description:
      'Доставляємо по всій Україні за 1–3 дні. Термінова доставка по Києву — до 3 годин.',
  },
  {
    icon: Shield,
    title: 'Гарантія свіжості',
    description:
      'Квіти зберігаються мінімум 7 днів. Якщо ні — замінимо безкоштовно.',
  },
  {
    icon: Clock,
    title: 'Зручне замовлення',
    description:
      'Оформіть замовлення за 2 хвилини. Підтримка працює цілодобово.',
  },
  {
    icon: Leaf,
    title: 'Екологічність',
    description:
      'Співпрацюємо з локальними фермами. Використовуємо біорозкладну упаковку.',
  },
];

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
            Чому обирають нас
          </span>
          <h2 className='font-display text-4xl font-bold md:text-5xl'>
            Ваша довіра — наш пріоритет
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
