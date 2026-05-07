import {
  Truck,
  Shield,
  Clock,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { getServerTranslator } from '@/i18n/server';

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
    <section className='bg-muted/30 py-24'>
      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-16 text-center'>
          <span className='mb-4 block text-sm font-medium uppercase tracking-widest text-primary'>
            {t('sections_features_label')}
          </span>
          <h2 className='font-display text-4xl font-bold md:text-5xl'>
            {t('sections_features_title')}
          </h2>
        </header>

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
      </div>
    </section>
  );
}
