'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useGetProducts } from '@/hooks/tan-stack-query/products/use-products';
import CatalogGrid from '@/features/catalog/catalog-grid';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function CatalogSection() {
  const { data, isLoading } = useGetProducts();
  const { t } = useTranslation();

  return (
    <section
      id='catalog'
      className='bg-background py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='mb-16 text-center'>
          <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
            {t('sections_catalog_label')}
          </span>
          <h2 className='font-display mb-4 text-4xl font-bold md:text-5xl'>
            {t('sections_catalog_title')}
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            {t('sections_catalog_description')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          <motion.div
            variants={itemVariants}
            className='col-span-3'>
            <CatalogGrid
              items={(data ?? []).slice(0, 3)}
              loading={isLoading}
              pageSize={3}
              hideControls
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='mt-12 text-center'>
          <Button
            asChild
            size='lg'
            variant='secondary'>
            <Link href='/catalog'>{t('sections_catalog_button')}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
