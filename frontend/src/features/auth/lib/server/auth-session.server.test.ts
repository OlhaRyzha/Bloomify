import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from '../shared/auth-routing';
import { hasAuthSessionCookie } from './auth-session.server';

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

describe('server auth session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('detects session marker cookie', async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) => {
        if (name === AUTH_SESSION_COOKIE_NAME) {
          return { value: '1' };
        }

        return undefined;
      },
    });

    await expect(hasAuthSessionCookie()).resolves.toBe(true);
  });

  test('rejects requests without known auth cookies', async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    await expect(hasAuthSessionCookie()).resolves.toBe(false);
  });

  test('rejects empty session marker cookie', async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) => {
        if (name === AUTH_SESSION_COOKIE_NAME) {
          return { value: '' };
        }

        return undefined;
      },
    });

    await expect(hasAuthSessionCookie()).resolves.toBe(false);
  });
});
