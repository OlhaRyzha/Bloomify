import { beforeEach, describe, expect, test } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from './auth-routing';
import { clearAuthSessionCookie, setAuthSessionCookie } from './auth-session-cookie';

describe('auth session cookie', () => {
  beforeEach(() => {
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  test('sets a non-sensitive session marker cookie', () => {
    setAuthSessionCookie();

    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
    expect(document.cookie).not.toContain('access');
    expect(document.cookie).not.toContain('refresh');
    expect(document.cookie).not.toContain('token');
  });

  test('clears the session marker cookie', () => {
    setAuthSessionCookie();

    clearAuthSessionCookie();

    expect(document.cookie).not.toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });
});
