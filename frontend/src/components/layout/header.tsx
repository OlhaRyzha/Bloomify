import Link from 'next/link';
import { NAVIGATION_LINKS } from '@/constants/navigation.constants';
import { getServerTranslator } from '@/i18n/server';
import HeaderActions from './header-actions.client';
import { getLocalizedPath } from '@/i18n/routing';
import { Container } from './page-layout';

export default async function Header() {
  const mobileNavId = 'mobile-navigation';
  const { locale, t } = await getServerTranslator();

  const navigationLinks = NAVIGATION_LINKS.map((link) => ({
    ...link,
    href: getLocalizedPath(link.href, locale),
    label: t(`navigation_main_${link.key}`),
  }));

  return (
    <header className='fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
      <Container>
        <div className='flex h-20 items-center justify-between'>
          <Link
            href={getLocalizedPath('/', locale)}
            className='flex items-center gap-2'>
            <span className='bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-3xl font-bold text-transparent'>
              {t('common_brand')}
            </span>
          </Link>

          <nav
            className='hidden items-center gap-8 md:flex'
            aria-label={t('header_primary_navigation_label')}>
            {navigationLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'>
                {link.label}
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
