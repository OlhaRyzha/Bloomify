import { supportedLocales, type Locale } from '@/locales/translations';

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * Canonical public site URL used for SEO (sitemap, robots, canonical, OG).
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL (explicit, recommended on Vercel)
 *   2. Vercel-provided production URL (auto on Vercel deploys)
 *   3. localhost fallback for local dev
 * Kept separate from the API `SITE_URL` constant so SEO never affects the
 * payment/api-client base-url resolution.
 */
export const getSiteUrl = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  const vercelProductionUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl) {
    return `https://${stripTrailingSlash(vercelProductionUrl)}`;
  }

  return 'http://localhost:3000';
};

export const OG_LOCALES: Record<Locale, string> = {
  uk: 'uk_UA',
  en: 'en_US',
  pl: 'pl_PL',
};

/** Locale-prefixed absolute URL, e.g. https://site/uk/catalog */
export const getAbsoluteLocalizedUrl = (
  path: string,
  locale: Locale
): string => {
  const normalizedPath =
    path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}/${locale}${normalizedPath}`;
};

/** hreflang map for a given path across every supported locale. */
export const getLanguageAlternates = (path: string): Record<string, string> =>
  Object.fromEntries(
    supportedLocales.map((locale) => [
      locale,
      getAbsoluteLocalizedUrl(path, locale),
    ])
  );

/** Resolve a possibly-relative URL (e.g. product image) to an absolute one. */
export const toAbsoluteUrl = (url: string): string => {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  return `${getSiteUrl()}${url.startsWith('/') ? url : `/${url}`}`;
};
