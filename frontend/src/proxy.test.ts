import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from './features/auth/auth-routing';
import { proxy } from './proxy';

const createRequest = (url: string, cookie?: string) =>
  new NextRequest(url, {
    headers: cookie ? { cookie } : undefined,
  });

describe('proxy auth routing', () => {
  test('redirects unauthenticated profile requests to sign in and keeps next', () => {
    const response = proxy(createRequest('http://localhost:3000/uk/profile'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/uk/sign-in?next=%2Fuk%2Fprofile'
    );
  });

  test('rewrites authenticated localized profile requests', () => {
    const response = proxy(
      createRequest(
        'http://localhost:3000/uk/profile',
        `${AUTH_SESSION_COOKIE_NAME}=1`
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'http://localhost:3000/profile'
    );
  });
});
