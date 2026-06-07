'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flower2,
  Heart,
  Info,
  Mail,
  Menu,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import LocaleSwitcher from '../ui/locale-switcher';
import { useHydrated } from '@/hooks/use-hydrated';
import { selectCartCount } from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { useLocale } from '@/components/providers/locale-provider';
import { getLocalizedPath, stripLocaleFromPathname } from '@/i18n/routing';
import { useAuthSessionMarker } from '@/features/auth/hooks/use-auth-session-marker';
import { CLOSE_MOBILE_MENU_EVENT } from './header-events';

type HeaderNavLink = {
  href: string;
  key: string;
  label: string;
};

type HeaderActionsCopy = {
  cartLabel: string;
  closeMenuLabel: string;
  loginLabel: string;
  mobileNavigationLabel: string;
  openMenuLabel: string;
  profileLabel: string;
};

type HeaderActionsProps = {
  copy: HeaderActionsCopy;
  mobileNavId: string;
  navigationLinks: HeaderNavLink[];
};

const mobileNavIcons = {
  about: Info,
  catalog: Flower2,
  contact: Mail,
  favorites: Heart,
  subscription: Sparkles,
};

export default function HeaderActions({
  copy,
  mobileNavId,
  navigationLinks,
}: HeaderActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const isHydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);
  const { locale } = useLocale();
  const hasAuthSession = useAuthSessionMarker();
  const pathnameWithoutLocale = stripLocaleFromPathname(pathname);
  const accountPath = hasAuthSession ? '/profile' : '/sign-in';
  const accountLabel = hasAuthSession ? copy.profileLabel : copy.loginLabel;

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleCloseMenu = () => {
      setIsMenuOpen(false);
    };

    window.addEventListener(CLOSE_MOBILE_MENU_EVENT, handleCloseMenu);

    return () => {
      window.removeEventListener(CLOSE_MOBILE_MENU_EVENT, handleCloseMenu);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const firstLink = mobileNavRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    firstLink?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className='flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3'>
        <div className='hidden items-center gap-2 text-xs text-muted-foreground lg:flex'>
          <LocaleSwitcher />
        </div>

        <Button
          asChild
          variant='ghost'
          size='icon'
          className='hidden lg:inline-flex'>
          <Link
            href={getLocalizedPath(accountPath, locale)}
            aria-label={accountLabel}>
            <User
              className='h-5 w-5'
              aria-hidden
            />
          </Link>
        </Button>

        <Button
          asChild
          variant='ghost'
          size='icon'
          className='relative'>
          <Link
            href={getLocalizedPath('/cart', locale)}
            aria-label={copy.cartLabel}
            onClick={closeMenu}>
            <ShoppingBag
              className='h-5 w-5'
              aria-hidden
            />
            <span
              className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'
              aria-hidden='true'>
              {isHydrated ? cartCount : 0}
            </span>
          </Link>
        </Button>

        <Button
          ref={menuButtonRef}
          variant='ghost'
          size='icon'
          className='lg:hidden'
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-label={isMenuOpen ? copy.closeMenuLabel : copy.openMenuLabel}
          aria-controls={mobileNavId}
          aria-expanded={isMenuOpen}>
          {isMenuOpen ? (
            <X
              className='h-5 w-5'
              aria-hidden
            />
          ) : (
            <Menu
              className='h-5 w-5'
              aria-hidden
            />
          )}
        </Button>
      </div>

      {isMenuOpen && (
        <nav
          ref={mobileNavRef}
          id={mobileNavId}
          className='absolute inset-x-0 top-full z-40 h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-background/98 px-4 py-5 shadow-elevated backdrop-blur-md lg:hidden'
          aria-label={copy.mobileNavigationLabel}>
          <div className='mx-auto flex min-h-full w-full max-w-md flex-col'>
            <div className='rounded-3xl border border-border/80 bg-card/90 p-2 shadow-card'>
              {navigationLinks.map((link) => {
                const isCurrent =
                  pathnameWithoutLocale === stripLocaleFromPathname(link.href);
                const Icon =
                  mobileNavIcons[link.key as keyof typeof mobileNavIcons] ??
                  Sparkles;

                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    className='group flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[current=true]:bg-primary data-[current=true]:text-primary-foreground'
                    data-current={isCurrent}
                    onClick={closeMenu}>
                    <span
                      className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary transition-colors group-data-[current=true]:bg-primary-foreground/15 group-data-[current=true]:text-primary-foreground'
                      aria-hidden='true'>
                      <Icon className='h-4 w-4' />
                    </span>
                    <span className='min-w-0 flex-1'>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className='mt-4 rounded-3xl border border-border/80 bg-gradient-card p-4 shadow-soft'>
              <Button
                asChild
                className='h-12 w-full justify-center rounded-2xl'>
                <Link
                  href={getLocalizedPath(accountPath, locale)}
                  onClick={closeMenu}>
                  <User
                    className='mr-2 h-4 w-4'
                    aria-hidden
                  />
                  {accountLabel}
                </Link>
              </Button>

              <div className='mt-4 flex justify-center border-t border-border/70 pt-4'>
                <LocaleSwitcher />
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
