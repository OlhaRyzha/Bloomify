'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart } from 'lucide-react';
import bouquetRoses from '@/assets/bouquet-roses.jpg';
import bouquetPeony from '@/assets/bouquet-peony.jpg';
import bouquetWild from '@/assets/bouquet-wild.jpg';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const products = [
  {
    id: '1',
    name: 'Романтичні троянди',
    description: 'Ніжний букет з рожевих та білих троянд',
    price: 1850,
    image: bouquetRoses,
    tag: 'Бестселер',
  },
  {
    id: '2',
    name: 'Лавандова елегантність',
    description: 'Білі півонії з гілочками лаванди',
    price: 2200,
    image: bouquetPeony,
    tag: 'Новинка',
  },
  {
    id: '3',
    name: 'Сонячний настрій',
    description: 'Соняшники та польові квіти',
    price: 1650,
    image: bouquetWild,
    tag: 'Популярне',
  },
];

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
              <Card className='group overflow-hidden border-0 bg-gradient-card shadow-card transition-all duration-500 hover:shadow-elevated'>
                <div className='relative aspect-square overflow-hidden'>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className='object-cover transition-transform duration-700 group-hover:scale-105'
                  />

                  <span className='absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
                    {product.tag}
                  </span>

                  <button
                    type='button'
                    className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-blush group-hover:opacity-100'
                    aria-label='Add to wishlist'>
                    <Heart className='h-5 w-5 text-foreground' />
                  </button>
                </div>

                <CardContent className='p-6'>
                  <h3 className='font-display mb-2 text-xl font-semibold'>
                    {product.name}
                  </h3>
                  <p className='mb-4 text-sm text-muted-foreground'>
                    {product.description}
                  </p>

                  <div className='flex items-center justify-between'>
                    <span className='font-display text-2xl font-bold text-primary'>
                      {product.price} ₴
                    </span>

                    <Button size='sm'>
                      <ShoppingBag className='mr-1 h-4 w-4' />
                      До кошика
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
