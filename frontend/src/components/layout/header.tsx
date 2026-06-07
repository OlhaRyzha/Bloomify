import Link from 'next/link';

import { NAVIGATION_LINKS } from '@/constants/navigation.constants';
import { hasAuthSessionCookie } from '@/features/auth/auth-session.server';
import { getLocalizedPath } from '@/i18n/routing';
import { getServerTranslator } from '@/i18n/server';

import HeaderActions from './header-actions.client';
import HeaderLogo from './header-logo.client';
import { Container } from './page-layout';

export default async function Header() {
  const mobileNavId = 'mobile-navigation';
  const { locale, t } = await getServerTranslator();
  const isAuthorized = await hasAuthSessionCookie();

  const navigationLinks = NAVIGATION_LINKS.filter(
    (link) => link.visibility === 'all' || isAuthorized
  ).map((link) => ({
    ...link,
    href: getLocalizedPath(link.href, locale),
    label: t(`navigation_main_${link.key}`),
  }));

  return (
    <header className='fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md'>
      <Container>
        <div className='flex h-20 min-w-0 items-center justify-between gap-3'>
          <HeaderLogo
            href={getLocalizedPath('/', locale)}
            brand={t('common_brand')}
          />

          <nav
            className='hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-8'
            aria-label={t('header_primary_navigation_label')}>
            {navigationLinks.map(({ key, href, label }) => (
              <Link
                key={key}
                href={href}
                className='text-sm font-medium leading-tight text-muted-foreground transition-colors hover:text-primary'>
                {label}
              </Link>
            ))}
          </nav>

          <HeaderActions
            mobileNavId={mobileNavId}
            navigationLinks={navigationLinks}
            copy={{
              cartLabel: t('header_cart_label'),
              closeMenuLabel: t('header_close_menu_label'),
              loginLabel: t('auth_form_login_submit_label'),
              mobileNavigationLabel: t('header_mobile_navigation_label'),
              openMenuLabel: t('header_open_menu_label'),
              profileLabel: t('header_profile_label'),
            }}
          />
        </div>
      </Container>
    </header>
  );
}
