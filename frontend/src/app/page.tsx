import HeroSection from '@/components/sections/hero-section';
import CatalogSection from '@/components/sections/catalog-section';
import SubscriptionSection from '@/components/sections/subscription-section';
import FeaturesSection from '@/components/sections/features-section';

export default function Home() {
  return (
    <>
      <HeroSection />
      <CatalogSection />
      <SubscriptionSection />
      <FeaturesSection />
    </>
  );
}
