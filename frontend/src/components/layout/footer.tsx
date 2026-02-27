'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { formatTemplate } from '@/utils/i18n';
import {
  NAVIGATION_LINKS,
  SERVICE_LINKS,
  footerContactItems,
  footerSocialLinks,
} from '@/constants/navigation.constants';

export default function Footer() {
  const { t } = useTranslation();
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
          <motion.div
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

            <form
              onSubmit={(e) => e.preventDefault()}
              className='flex w-full gap-3 lg:w-auto'>
              <Input
                type='email'
                placeholder={t('footer_emailPlaceholder')}
                className='min-w-[250px] bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50'
              />
              <Button
                className='h-10 px-6 py-2 bg-gold'
                type='submit'
                size='icon'
                aria-label={t('footer_subscribeLabel')}>
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
                  <item.icon className='h-5 w-5' />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className='text-lg font-semibold'>{t('footer_navTitle')}</h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {navLinks.map((item) => (
                <li key={item.href}>
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
            <h4 className='text-lg font-semibold'>{t('footer_servicesTitle')}</h4>
            <ul className='mt-4 space-y-2 text-sm'>
              {serviceLinks.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-lg font-semibold'>{t('footer_contactsTitle')}</h4>
            <ul className='mt-4 space-y-3 text-sm'>
              {footerContactItems.map((item) => (
                <li
                  key={item.id}
                  className='flex items-start gap-3'>
                  <item.icon
                    className='mt-0.5 h-4 w-4 text-gold'
                    aria-hidden
                  />
                  {item.content}
                </li>
              ))}
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
