import { NextResponse, type NextRequest } from 'next/server';
import {
  defaultLocale,
  supportedLocales,
  type Locale,
} from '@/locales/translations';
import {
  getLocaleFromPathname,
  isPublicAssetPath,
  LOCALE_HEADER,
  stripLocaleFromPathname,
} from '@/i18n/routing';
import {
  AUTH_COOKIE_NAMES,
  isProtectedAuthPath,
} from '@/features/auth/auth-routing';

const getPreferredLocale = (request: NextRequest): Locale => {
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const acceptedLocales = acceptLanguage
    .split(',')
    .map((value) => value.trim().split(';')[0]?.split('-')[0])
    .filter(Boolean);

  return (
    acceptedLocales.find((locale): locale is Locale =>
      supportedLocales.includes(locale as Locale)
    ) ?? defaultLocale
  );
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  const localeFromPathname = getLocaleFromPathname(pathname);

  if (!localeFromPathname) {
    const locale = getPreferredLocale(request);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;

    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, localeFromPathname);
  const pathnameWithoutLocale = stripLocaleFromPathname(pathname);

  if (
    isProtectedAuthPath(pathnameWithoutLocale) &&
    !AUTH_COOKIE_NAMES.some((cookieName) => request.cookies.has(cookieName))
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${localeFromPathname}/sign-in`;
    redirectUrl.search = '';
    redirectUrl.searchParams.set('next', `${pathname}${search}`);

    return NextResponse.redirect(redirectUrl);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathnameWithoutLocale;
  rewriteUrl.search = search;

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
