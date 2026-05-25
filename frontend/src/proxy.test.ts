import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from './features/auth/auth-routing';
import { LOCALE_HEADER } from './i18n/routing';
import { proxy } from './proxy';
import { appUrl } from './test/app-url';

const createRequest = (
  url: string,
  cookie?: string,
  headers?: Record<string, string>
) =>
  new NextRequest(url, {
    headers: {
      ...headers,
      ...(cookie ? { cookie } : {}),
    },
  });

describe('proxy auth routing', () => {
  test('redirects unauthenticated profile requests to sign in and keeps next', () => {
    const response = proxy(createRequest(appUrl('/uk/profile')));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      appUrl('/uk/sign-in?next=%2Fuk%2Fprofile')
    );
  });

  test('redirects unauthenticated profile requests with query in next', () => {
    const response = proxy(createRequest(appUrl('/uk/profile?tab=orders')));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      appUrl('/uk/sign-in?next=%2Fuk%2Fprofile%3Ftab%3Dorders')
    );
  });

  test('rewrites authenticated localized profile requests', () => {
    const response = proxy(
      createRequest(
        appUrl('/uk/profile'),
        `${AUTH_SESSION_COOKIE_NAME}=1`
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      appUrl('/profile')
    );
  });

  test('allows internal rewritten requests with locale header to continue', () => {
    const response = proxy(
      createRequest(appUrl('/'), undefined, {
        [LOCALE_HEADER]: 'uk',
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
