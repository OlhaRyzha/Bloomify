'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Camera, Users, Send, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  return (
    <footer
      id='contact'
      className='bg-primary text-primary-foreground'>
      <div className='border-b border-primary-foreground/10'>
        <div className='mx-auto max-w-6xl px-4 py-12'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='flex flex-col items-center justify-between gap-8 lg:flex-row'>
            <div>
              <h3 className='text-2xl font-bold md:text-3xl'>
                Підпишіться на новини
              </h3>
              <p className='mt-2 text-primary-foreground/80'>
                Отримуйте ексклюзивні пропозиції та знижки першими
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className='flex w-full gap-3 lg:w-auto'>
              <Input
                type='email'
                placeholder='Ваш email'
                className='min-w-[250px] bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50'
              />
              <Button
                type='submit'
                size='icon'
                aria-label='Subscribe'>
                <Send className='h-4 w-4' />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      <div className='mx-auto max-w-6xl px-4 py-12'>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          <div>
            <Link
              href='/'
              className='text-3xl font-bold'>
              Bloomify
            </Link>
            <p className='mt-4 text-sm text-primary-foreground/80'>
              Ексклюзивні флористичні композиції для особливих моментів вашого
              життя.
            </p>

            <div className='mt-6 flex gap-3'>
              <a
                href='https://instagram.com'
                target='_blank'
                rel='noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20'
                aria-label='Instagram'>
                <Camera className='h-5 w-5' />
              </a>
              <a
                href='https://facebook.com'
                target='_blank'
                rel='noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20'
                aria-label='Facebook'>
                <Users className='h-5 w-5' />
              </a>
              <a
                href='https://t.me'
                target='_blank'
                rel='noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20'
                aria-label='Telegram'>
                <Send className='h-5 w-5' />
              </a>
            </div>
          </div>

          <div>
            <h4 className='text-lg font-semibold'>Навігація</h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {[
                { label: 'Каталог', href: '/catalog' },
                { label: 'Підписка', href: '/#subscription' },
                { label: 'Про нас', href: '/#about' },
                { label: 'Блог', href: '/blog' },
                { label: 'FAQ', href: '/faq' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-lg font-semibold'>Послуги</h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {[
                'Весільна флористика',
                'Корпоративні замовлення',
                'Оформлення свят',
                'Подарункові кошики',
                'Доставка квітів',
              ].map((service) => (
                <li key={service}>
                  <Link
                    href='/#services'
                    className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-lg font-semibold'>Контакти</h4>
            <ul className='mt-4 space-y-3 text-sm'>
              <li className='flex items-center gap-3'>
                <Phone className='h-4 w-4 text-primary-foreground/80' />
                <a
                  href='tel:+380991234567'
                  className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                  +38 (099) 123-45-67
                </a>
              </li>
              <li className='flex items-center gap-3'>
                <Mail className='h-4 w-4 text-primary-foreground/80' />
                <a
                  href='mailto:hello@bloomify.ua'
                  className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                  hello@bloomify.ua
                </a>
              </li>
              <li className='flex items-start gap-3'>
                <MapPin className='mt-0.5 h-4 w-4 text-primary-foreground/80' />
                <span className='text-primary-foreground/80'>
                  м. Київ, вул. Хрещатик, 1
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 md:flex-row'>
          <p className='text-sm text-primary-foreground/60'>
            © {new Date().getFullYear()} Bloomify. Всі права захищені.
          </p>
          <div className='flex gap-6'>
            <Link
              href='/privacy'
              className='text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground'>
              Політика конфіденційності
            </Link>
            <Link
              href='/terms'
              className='text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground'>
              Умови використання
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
