import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AppProviders from '@/components/providers/app-providers';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { defaultLocale } from '@/locales/translations';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Bloomify',
  description: 'Online flower shop with monthly bouquet subscriptions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      <body>
        <AppProviders>
          <LocaleProvider>
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
