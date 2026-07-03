import Link from 'next/link';
import { formatTemplate } from '@/utils/i18n';
import {
  FOOTER_CONTACT_ITEMS,
  NAVIGATION_LINKS,
  POPULAR_LINKS,
  SERVICE_LINKS,
  footerSocialLinks,
} from '@/constants/navigation.constants';
import { getNavigationCategories } from '@/features/categories/lib/get-navigation-categories.server';
import { getServerTranslator } from '@/i18n/server';
import FooterNewsletterForm from '@/components/layout/forms/footer-newsletter-form.client';
import { getLocalizedPath } from '@/i18n/routing';
import { Container } from './page-layout';

export default async function Footer() {
  const { locale, t } = await getServerTranslator();
  const categories = await getNavigationCategories(locale);
  const newsletterInputId = 'footer-newsletter-email';
  const navLinks = [
    ...NAVIGATION_LINKS.map((link) => ({
      key: link.key as string,
      href: getLocalizedPath(link.href, locale),
      label: t(link.labelKey),
    })),
    ...categories.map((category) => ({
      key: `category-${category.slug}`,
      href: getLocalizedPath(`/categories/${category.slug}`, locale),
      label: category.name,
    })),
  ];
  const serviceLinks = SERVICE_LINKS.map((link) => ({
    ...link,
    href: getLocalizedPath(link.href, locale),
    label: t(`navigation_services_${link.key}`),
  }));
  const popularLinks = POPULAR_LINKS.map((link) => ({
    ...link,
    href: getLocalizedPath(link.href, locale),
    label: t(`footer_popular_${link.key}`),
  }));
  const rightsMessage = formatTemplate(t('footer_rights'), {
    year: new Date().getFullYear(),
  });

  return (
    <footer
      id='contact'
      className='scroll-mt-24 bg-primary text-primary-foreground'>
      <div className='border-b border-primary-foreground/10'>
        <Container className='py-12'>
          <div className='flex min-w-0 flex-col items-stretch justify-between gap-8 lg:flex-row lg:items-center'>
            <div className='min-w-0'>
              <h3 className='text-2xl font-bold md:text-3xl'>
                {t('footer_newsletter_title')}
              </h3>
              <p className='mt-2 text-primary-foreground/90'>
                {t('footer_newsletter_description')}
              </p>
            </div>

            <FooterNewsletterForm
              inputId={newsletterInputId}
              label={t('footer_subscribe_label')}
              loadingLabel={t('footer_subscribe_loading_label')}
              placeholder={t('footer_email_placeholder')}
              successMessage={t('footer_subscribe_success')}
              errorMessage={t('footer_subscribe_error')}
            />
          </div>
        </Container>
      </div>

      <Container className='py-12'>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          <div>
            <Link
              href={getLocalizedPath('/', locale)}
              className='text-3xl font-bold'>
              {t('brand_name')}
            </Link>
            <p className='mt-4 text-sm text-primary-foreground/90'>
              {t('footer_tagline')}
            </p>

            <div className='mt-6 flex gap-3'>
              {footerSocialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target='_blank'
                  rel='noreferrer'
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20'
                  aria-label={item.label}>
                  <item.icon
                    className='h-5 w-5'
                    aria-hidden
                  />
                </a>
              ))}
            </div>
          </div>

          <nav aria-labelledby='footer-nav-title'>
            <h4
              id='footer-nav-title'
              className='text-lg font-semibold'>
              {t('footer_nav_title')}
            </h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {navLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className='text-primary-foreground/90 transition-colors hover:text-primary-foreground'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby='footer-services-title'>
            <h4
              id='footer-services-title'
              className='text-lg font-semibold'>
              {t('footer_services_title')}
            </h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {serviceLinks.map((service) => (
                <li key={service.key}>
                  <Link
                    href={service.href}
                    className='text-primary-foreground/90 transition-colors hover:text-primary-foreground'>
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className='text-lg font-semibold'>
              {t('footer_contacts_title')}
            </h4>
            <ul className='mt-4 space-y-3 text-sm'>
              {FOOTER_CONTACT_ITEMS.map((item) => {
                const text = item.labelKey
                  ? t(item.labelKey)
                  : (item.staticText ?? '');
                const href =
                  item.id === 'address'
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
                    : item.href;

                return (
                  <li
                    key={item.id}
                    className='flex items-start gap-3'>
                    <item.icon
                      className='mt-0.5 h-4 w-4 text-gold'
                      aria-hidden
                    />
                    {item.id === 'address' ? (
                      <address className='not-italic text-primary-foreground/90'>
                        <a
                          href={href}
                          target='_blank'
                          rel='noreferrer'
                          className='transition-colors hover:text-primary-foreground'>
                          {text}
                        </a>
                      </address>
                    ) : (
                      <a
                        href={href}
                        className='text-primary-foreground/90 transition-colors hover:text-primary-foreground'>
                        {text}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <nav
          aria-labelledby='footer-popular-title'
          className='mt-12 border-t border-primary-foreground/10 pt-8'>
          <h4
            id='footer-popular-title'
            className='text-sm font-semibold uppercase tracking-wide text-primary-foreground/80'>
            {t('footer_popular_title')}
          </h4>
          <ul className='mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
            {popularLinks.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className='text-primary-foreground/90 transition-colors hover:text-primary-foreground'>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 md:flex-row'>
          <p className='text-sm text-primary-foreground/85'>{rightsMessage}</p>
          <div className='flex gap-6'>
            <Link
              href={getLocalizedPath('/privacy', locale)}
              className='text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground'>
              {t('footer_privacy')}
            </Link>
            <Link
              href={getLocalizedPath('/terms', locale)}
              className='text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground'>
              {t('footer_terms')}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
