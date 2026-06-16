import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import HashScrollHandler from '@/components/layout/hash-scroll-handler.client';
import AnalyticsReporter from '@/components/providers/analytics-reporter';
import AppProviders from '@/components/providers/app-providers';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { defaultLocale } from '@/locales/translations';
import { ensureLocale } from '@/utils/i18n';
import type { ReactNode } from 'react';
import { LOCALE_HEADER } from '@/i18n/routing';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: {
      default: t('brand_name'),
      template: `%s | ${t('brand_name')}`,
    },
    description: t('metadata_default_description'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headerStore = await headers();
  const locale = ensureLocale(headerStore.get(LOCALE_HEADER) ?? defaultLocale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>
          <LocaleProvider
            key={locale}
            initialLocale={locale}>
            <div className='flex min-h-screen flex-col bg-background'>
              <HashScrollHandler />
              <Header />
              <main className='min-h-svh flex-1'>{children}</main>
              <Footer />
              <AnalyticsReporter />
            </div>
          </LocaleProvider>
        </AppProviders>
      </body>
    </html>
  );
}
