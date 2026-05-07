import Link from 'next/link';
import { formatTemplate } from '@/utils/i18n';
import {
  FOOTER_CONTACT_ITEMS,
  NAVIGATION_LINKS,
  SERVICE_LINKS,
  footerSocialLinks,
} from '@/constants/navigation.constants';
import { MotionDiv } from '@/components/ui/motion-div';
import { getServerTranslator } from '@/i18n/server';
import FooterNewsletterForm from '@/components/layout/footer-newsletter-form.client';

export default async function Footer() {
  const { t } = await getServerTranslator();
  const newsletterInputId = 'footer-newsletter-email';
  const navLinks = NAVIGATION_LINKS.map((link) => ({
    ...link,
    label: t(`navigation_main_${link.key}`),
  }));
  const serviceLinks = SERVICE_LINKS.map((link) => ({
    ...link,
    label: t(`navigation_services_${link.key}`),
  }));
  const rightsMessage = formatTemplate(t('footer_rights'), {
    year: new Date().getFullYear(),
  });

  return (
    <footer
      id='contact'
      className='bg-primary text-primary-foreground'>
      <div className='border-b border-primary-foreground/10'>
        <div className='mx-auto max-w-6xl px-4 py-12'>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='flex flex-col items-center justify-between gap-8 lg:flex-row'>
            <div>
              <h3 className='text-2xl font-bold md:text-3xl'>
                {t('footer_newsletterTitle')}
              </h3>
              <p className='mt-2 text-primary-foreground/80'>
                {t('footer_newsletterDescription')}
              </p>
            </div>

            <FooterNewsletterForm
              inputId={newsletterInputId}
              label={t('footer_subscribeLabel')}
              placeholder={t('footer_emailPlaceholder')}
            />
          </MotionDiv>
        </div>
      </div>

      <div className='mx-auto max-w-6xl px-4 py-12'>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          <div>
            <Link
              href='/'
              className='text-3xl font-bold'>
              {t('common_brand')}
            </Link>
            <p className='mt-4 text-sm text-primary-foreground/80'>
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
              {t('footer_navTitle')}
            </h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {navLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
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
              {t('footer_servicesTitle')}
            </h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {serviceLinks.map((service) => (
                <li key={service.key}>
                  <Link
                    href={service.href}
                    className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className='text-lg font-semibold'>
              {t('footer_contactsTitle')}
            </h4>
            <ul className='mt-4 space-y-3 text-sm'>
              {FOOTER_CONTACT_ITEMS.map((item) => {
                const text = item.labelKey
                  ? t(item.labelKey)
                  : item.staticText ?? '';
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
                      <address className='not-italic text-primary-foreground/80'>
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
                        className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                        {text}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 md:flex-row'>
          <p className='text-sm text-primary-foreground/60'>
            {rightsMessage}
          </p>
          <div className='flex gap-6'>
            <Link
              href='/privacy'
              className='text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground'>
              {t('footer_privacy')}
            </Link>
            <Link
              href='/terms'
              className='text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground'>
              {t('footer_terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
