import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AppProviders from '@/components/providers/app-providers';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { defaultLocale } from '@/locales/translations';
import { ensureLocale } from '@/utils/i18n';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Bloomify',
  description: 'Online flower shop with monthly bouquet subscriptions.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = ensureLocale(cookieStore.get('bloomify_locale')?.value ?? defaultLocale);

  return (
    <html lang={locale}>
      <body>
        <AppProviders>
          <LocaleProvider initialLocale={locale}>
            <div className='flex min-h-screen flex-col bg-background'>
              <Header />
              <main className='flex-1'>{children}</main>
              <Footer />
            </div>
          </LocaleProvider>
        </AppProviders>
      </body>
    </html>
  );
}
