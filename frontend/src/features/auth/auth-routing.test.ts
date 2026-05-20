import { describe, expect, test } from 'vitest';

import {
  AUTH_COOKIE_NAMES,
  AUTH_SESSION_COOKIE_NAME,
  isProtectedAuthPath,
} from './auth-routing';

describe('auth routing', () => {
  test('recognizes auth cookies used by the app', () => {
    expect(AUTH_COOKIE_NAMES).toEqual([AUTH_SESSION_COOKIE_NAME]);
  });

  test.each(['/profile', '/profile/orders', '/profile/settings'])(
    'protects %s',
    (pathname) => {
      expect(isProtectedAuthPath(pathname)).toBe(true);
    }
  );

  test.each(['/login', '/register', '/catalog', '/profiles'])(
    'does not protect %s',
    (pathname) => {
      expect(isProtectedAuthPath(pathname)).toBe(false);
    }
  );
});
