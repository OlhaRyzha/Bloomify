import {
  defaultLocale,
  supportedLocales,
  type Locale,
} from '@/locales/translations';
import { ensureLocale } from '@/utils/i18n';

export const LOCALE_HEADER = 'x-bloomify-locale';

const pathHasFileExtension = (pathname: string) => /\.[^/]+$/.test(pathname);

export const isPublicAssetPath = (pathname: string) =>
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api') ||
  pathname === '/favicon.ico' ||
  pathHasFileExtension(pathname);

export const getLocaleFromPathname = (pathname: string): Locale | null => {
  const segment = pathname.split('/')[1];

  if (supportedLocales.includes(segment as Locale)) {
    return segment as Locale;
  }

  return null;
};

export const stripLocaleFromPathname = (pathname: string) => {
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    return pathname || '/';
  }

  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  return pathWithoutLocale.startsWith('/') ? pathWithoutLocale : '/';
};

export const getLocalizedPath = (
  href: string,
  localeInput?: string
): string => {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return href;
  }

  const locale = ensureLocale(localeInput ?? defaultLocale);
  const [pathnameWithLocale, hash = ''] = href.split('#');
  const [pathname, query = ''] = pathnameWithLocale.split('?');
  const normalizedPathname = stripLocaleFromPathname(pathname || '/');
  const localizedPathname =
    normalizedPathname === '/'
      ? `/${locale}`
      : `/${locale}${normalizedPathname}`;
  const queryString = query ? `?${query}` : '';
  const hashString = hash ? `#${hash}` : '';

  return `${localizedPathname}${queryString}${hashString}`;
};
