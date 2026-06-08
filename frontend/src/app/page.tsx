import HeroSection from '@/features/home/sections/hero-section';
import CatalogSection from '@/features/home/sections/catalog-section';
import SubscriptionSection from '@/features/home/sections/subscription-section';
import FeaturesSection from '@/features/home/sections/features-section';

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
