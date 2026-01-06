import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AppProviders from '@/components/providers/app-providers';
import { ReactNode } from 'react';

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
    <AppProviders>
      <html lang='en'>
        <body>
          <div className='flex min-h-screen flex-col bg-background'>
            <Header />
            <main className='flex-1'>{children}</main>
            <Footer />
          </div>
        </body>
      </html>
    </AppProviders>
  );
}
