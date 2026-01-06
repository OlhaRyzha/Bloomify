'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useGetProducts } from '@/hooks/tan-stack-query/products/use-products';
import CatalogCard from '@/features/catalog/catalog-card';
import { mapProductToCatalogItem } from '@/features/catalog/catalog-mappers';
import { Button } from '../ui/button';

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
  const { data } = useGetProducts();

  const products = useMemo(
    () => (data ?? []).slice(0, 3).map(mapProductToCatalogItem),
    [data]
  );

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
            Наша колекція
          </span>
          <h2 className='font-display mb-4 text-4xl font-bold md:text-5xl'>
            Популярні букети
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            Кожен букет створений з любов&apos;ю та увагою до деталей нашими
            досвідченими флористами
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}>
              <CatalogCard item={product} />
            </motion.div>
          ))}
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
            <Link href='/catalog'>Переглянути весь каталог</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
