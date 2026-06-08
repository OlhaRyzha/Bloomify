import { Truck, Shield, Clock, Leaf, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';
import HomeSectionHeader from './home-section-header';

type Feature = {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const featureConfig: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'feature_fast_delivery', icon: Truck },
  { key: 'feature_fresh_guarantee', icon: Shield },
  { key: 'feature_easy_ordering', icon: Clock },
  { key: 'feature_eco_friendly', icon: Leaf },
];

export default async function FeaturesSection() {
  const { t } = await getServerTranslator();

  const features: Feature[] = featureConfig.map((item) => ({
    key: item.key,
    icon: item.icon,
    title: t(`${item.key}_title`),
    description: t(`${item.key}_description`),
  }));

  return (
    <section
      id='about'
      className='relative scroll-mt-24 bg-muted/30 py-24'>
      <span
        id='services'
        className='absolute -top-24'
        aria-hidden='true'
      />
      <Container>
        <HomeSectionHeader
          label={t('sections_features_label')}
          title={t('sections_features_title')}
        />

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {features.map((feature) => (
            <div
              key={feature.key}
              className='group text-center'>
              <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-cta shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated'>
                <feature.icon
                  className='h-10 w-10 text-primary-foreground'
                  aria-hidden
                />
              </div>

              <h3 className='font-display mb-3 text-xl font-semibold'>
                {feature.title}
              </h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
