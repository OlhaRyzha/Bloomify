import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/config/site';

// Private / transactional routes carry a locale prefix (/uk/checkout, …),
// so each pattern uses a leading wildcard to cover every locale.
const DISALLOWED_PATHS = [
  '/*/checkout',
  '/*/cart',
  '/*/profile',
  '/*/orders',
  '/*/favorites',
  '/*/sign-in',
  '/*/sign-up',
  '/*/callback',
  '/internal',
  '/api',
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      // Search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
      // Google-Extended, …) all honour the wildcard rule — leaving it open
      // is what makes the catalog discoverable in both search and AI answers.
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
