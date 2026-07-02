import { Container } from '@/components/layout/page-layout';
import { getServerTranslator } from '@/i18n/server';

type SeoTextBlockProps = {
  titleKey: string;
  paragraphKeys: string[];
};

/**
 * Server-rendered SEO text block. Visible, crawlable content targeting
 * non-brand queries from frontend/docs/seo-semantic-core.md.
 */
export default async function SeoTextBlock({
  titleKey,
  paragraphKeys,
}: SeoTextBlockProps) {
  const { t } = await getServerTranslator();

  return (
    <section
      aria-labelledby={`seo-block-${titleKey}`}
      className='border-t border-border/60 bg-muted/40'>
      <Container className='py-12'>
        <h2
          id={`seo-block-${titleKey}`}
          className='font-display text-2xl font-bold md:text-3xl'>
          {t(titleKey)}
        </h2>
        <div className='mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base'>
          {paragraphKeys.map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </div>
      </Container>
    </section>
  );
}
