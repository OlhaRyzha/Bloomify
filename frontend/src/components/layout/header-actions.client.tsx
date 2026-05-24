'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import LocaleSwitcher from '../ui/locale-switcher';
import { useHydrated } from '@/hooks/use-hydrated';
import { selectCartCount } from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { useLocale } from '@/components/providers/locale-provider';
import { getLocalizedPath, stripLocaleFromPathname } from '@/i18n/routing';
import { useAuthSessionMarker } from '@/features/auth/use-auth-session-marker';

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
    if (!isMenuOpen) return;

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
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
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
            aria-label={copy.cartLabel}>
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
          className='md:hidden'
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
          className='border-t border-border py-4 md:hidden'
          aria-label={copy.mobileNavigationLabel}>
          <div className='flex flex-col gap-4'>
            {navigationLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={
                  pathnameWithoutLocale === stripLocaleFromPathname(link.href)
                    ? 'page'
                    : undefined
                }
                className='text-base font-medium text-foreground transition-colors hover:text-primary'
                onClick={closeMenu}>
                {link.label}
              </Link>
            ))}

            <Button
              asChild
              className='mt-2 w-full'>
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
          </div>
          <div className='mt-4 flex items-center justify-center'>
            <LocaleSwitcher />
          </div>
        </nav>
      )}
    </>
  );
}
