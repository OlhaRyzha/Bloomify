'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';
import LocaleSwitcher from '../ui/locale-switcher';
import { NAVIGATION_LINKS } from '@/constants/navigation.constants';
import { useHydrated } from '@/hooks/use-hydrated';
import { useCartStore } from '@/features/cart/cart.store';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHydrated = useHydrated();
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
  const { t } = useTranslation();

  const navigationLinks = NAVIGATION_LINKS.map((link) => ({
    ...link,
    label: t(`navigation_main_${link.key}`),
  }));

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
      <div className='mx-auto max-w-6xl px-4'>
        <div className='flex h-20 items-center justify-between'>
            <Link
              href='/'
              className='flex items-center gap-2'>
              <span className='bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-3xl font-bold text-transparent'>
                {t('common_brand')}
              </span>
            </Link>

          <nav className='hidden items-center gap-8 md:flex'>
            {navigationLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className='flex items-center gap-3'>
            <div className='hidden items-center gap-2 text-xs text-muted-foreground md:flex'>
              <LocaleSwitcher />
            </div>

            <Button
              asChild
              variant='ghost'
              size='icon'
              className='hidden md:inline-flex'>
              <Link
                href='/profile'
                aria-label='Profile'>
                <User className='h-5 w-5' />
              </Link>
            </Button>

            <Button
              asChild
              variant='ghost'
              size='icon'
              className='relative'
              aria-label='Cart'>
              <Link href='/cart'>
                <ShoppingBag className='h-5 w-5' />
                <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
                  {isHydrated ? cartCount : 0}
                </span>
              </Link>
            </Button>

            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
              {isMenuOpen ? (
                <X className='h-5 w-5' />
              ) : (
                <Menu className='h-5 w-5' />
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isMenuOpen && (
            <motion.nav
              key='mobile-nav'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='border-t border-border py-4 md:hidden'>
              <div className='flex flex-col gap-4'>
                {navigationLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className='text-base font-medium text-foreground transition-colors hover:text-primary'
                    onClick={() => setIsMenuOpen(false)}>
                    {link.label}
                  </Link>
                ))}

                <Button
                  asChild
                  className='mt-2 w-full'>
                  <Link
                    href={pathname === '/login' ? '/profile' : '/login'}
                    onClick={() => setIsMenuOpen(false)}>
                    <User className='mr-2 h-4 w-4' />
                    {t('auth_form_login_submitLabel')}
                  </Link>
                </Button>
              </div>
              <div className='mt-4 flex items-center justify-center'>
                <LocaleSwitcher />
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
