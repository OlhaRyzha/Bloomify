import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/header';
import HeroSection from '@/components/sections/hero-section';
import CatalogSection from '@/components/sections/catalog-section';
import SubscriptionSection from '@/components/sections/subscription-section';
import FeaturesSection from '@/components/sections/features-section';
import Footer from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Bloomify',
  description: 'Online flower shop with monthly bouquet subscriptions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <div className='flex min-h-screen flex-col bg-background'>
          <Header />
          <main className='flex-1'>
            <HeroSection />
            <CatalogSection />
            <SubscriptionSection />
            <FeaturesSection />
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
