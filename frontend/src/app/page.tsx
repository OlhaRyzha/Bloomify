import type { Metadata } from 'next';
import HeroSection from '@/features/home/sections/hero-section';
import CatalogSection from '@/features/home/sections/catalog-section';
import SubscriptionSection from '@/features/home/sections/subscription-section';
import FeaturesSection from '@/features/home/sections/features-section';
import SeoTextBlock from '@/components/seo/seo-text-block';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_home_title'),
    description: t('metadata_home_description'),
  };
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <CatalogSection />
      <SubscriptionSection />
      <FeaturesSection />
      <SeoTextBlock
        titleKey='seo_home_title'
        paragraphKeys={['seo_home_p1', 'seo_home_p2', 'seo_home_p3']}
      />
    </>
  );
}
