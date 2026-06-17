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
import {
  getAbsoluteLocalizedUrl,
  getLanguageAlternates,
  getSiteUrl,
  OG_LOCALES,
} from '@/config/site';
import { serializeJsonLd } from '@/utils/json-ld';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerTranslator();
  const siteUrl = getSiteUrl();
  const brandName = t('brand_name');
  const description = t('metadata_default_description');

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: brandName,
      template: `%s | ${brandName}`,
    },
    description,
    alternates: {
      canonical: getAbsoluteLocalizedUrl('/', locale),
      languages: getLanguageAlternates('/'),
    },
    openGraph: {
      type: 'website',
      siteName: brandName,
      title: brandName,
      description,
      url: getAbsoluteLocalizedUrl('/', locale),
      locale: OG_LOCALES[locale],
      images: [
        {
          url: '/og-image.jpg',
          width: 1024,
          height: 1037,
          alt: brandName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandName,
      description,
      images: ['/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    verification: {
      google: '3lrZHvH82lrWFe5cTudo9ESD4pGRhQB5L6Xz_XmmBEQ',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headerStore = await headers();
  const locale = ensureLocale(headerStore.get(LOCALE_HEADER) ?? defaultLocale);
  const { t } = await getServerTranslator();
  const siteUrl = getSiteUrl();
  const brandName = t('brand_name');

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: brandName,
        url: siteUrl,
        logo: `${siteUrl}/favicon.png`,
        description: t('metadata_default_description'),
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: brandName,
        url: siteUrl,
        inLanguage: locale,
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${getAbsoluteLocalizedUrl('/catalog', locale)}?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html
      lang={locale}
      suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
        />
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
