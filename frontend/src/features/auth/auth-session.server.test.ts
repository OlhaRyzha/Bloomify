import { describe, expect, test } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from './auth-routing';
import { hasAuthSessionCookie } from './auth-session.server';

const createCookieReader = (cookieNames: string[]) => ({
  has: (name: string) => cookieNames.includes(name),
});

describe('server auth session', () => {
  test('detects session marker cookie', () => {
    expect(
      hasAuthSessionCookie(createCookieReader([AUTH_SESSION_COOKIE_NAME]))
    ).toBe(true);
  });

  test('rejects requests without known auth cookies', () => {
    expect(hasAuthSessionCookie(createCookieReader(['other']))).toBe(false);
  });
});
