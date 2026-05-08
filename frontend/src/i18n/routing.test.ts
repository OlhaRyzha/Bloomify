import { describe, expect, test } from 'vitest';

import {
  getLocaleFromPathname,
  getLocalizedPath,
  isPublicAssetPath,
  LOCALE_HEADER,
  stripLocaleFromPathname,
} from './routing';

describe('i18n routing', () => {
  test('exposes the locale request header name', () => {
    expect(LOCALE_HEADER).toBe('x-bloomify-locale');
  });

  test.each([
    ['/uk', 'uk'],
    ['/en/catalog', 'en'],
    ['/pl/cart?step=delivery', 'pl'],
    ['/catalog', null],
    ['/', null],
  ])('reads locale from %s', (pathname, expectedLocale) => {
    expect(getLocaleFromPathname(pathname)).toBe(expectedLocale);
  });

  test.each([
    ['/_next/static/chunk.js'],
    ['/api/products'],
    ['/favicon.ico'],
    ['/images/hero.jpg'],
    ['/robots.txt'],
  ])('detects public asset path %s', (pathname) => {
    expect(isPublicAssetPath(pathname)).toBe(true);
  });

  test.each(['/uk/catalog', '/en/cart', '/pl/favorites'])(
    'does not treat localized app route %s as a public asset',
    (pathname) => {
      expect(isPublicAssetPath(pathname)).toBe(false);
    }
  );

  test.each([
    ['/uk', '/'],
    ['/uk/catalog', '/catalog'],
    ['/en/catalog/42', '/catalog/42'],
    ['/pl/cart?step=delivery', '/cart?step=delivery'],
    ['/catalog', '/catalog'],
    ['/', '/'],
  ])('strips locale from %s', (pathname, expectedPathname) => {
    expect(stripLocaleFromPathname(pathname)).toBe(expectedPathname);
  });

  test.each([
    ['/catalog', 'en', '/en/catalog'],
    ['/uk/catalog', 'pl', '/pl/catalog'],
    ['/', 'en', '/en'],
    ['/cart?step=delivery', 'pl', '/pl/cart?step=delivery'],
    ['/#subscription', 'uk', '/uk#subscription'],
    ['/catalog?tag=roses#top', 'en', '/en/catalog?tag=roses#top'],
    ['https://example.com/catalog', 'uk', 'https://example.com/catalog'],
    ['//example.com/catalog', 'uk', '//example.com/catalog'],
  ])('localizes %s for %s', (href, locale, expectedHref) => {
    expect(getLocalizedPath(href, locale)).toBe(expectedHref);
  });

  test('falls back to default locale for unsupported locale input', () => {
    expect(getLocalizedPath('/catalog', 'de')).toBe('/uk/catalog');
  });
});
