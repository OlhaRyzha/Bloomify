import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from './auth-routing';
import AuthSessionService from './auth-session.service';
import AuthService from '../server/api/auth.service';
import { createSignInPayload, createSignUpPayload } from './auth.factory';
import { useAuthTokenStore } from '../../store/auth-token.store';

vi.mock('../server/api/auth.service', () => ({
  default: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    refreshSession: vi.fn(),
    signInWithAuth0: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('AuthSessionService', () => {
  beforeEach(() => {
    vi.mocked(AuthService.signIn).mockReset();
    vi.mocked(AuthService.signUp).mockReset();
    vi.mocked(AuthService.refreshSession).mockReset();
    vi.mocked(AuthService.signInWithAuth0).mockReset();
    vi.mocked(AuthService.signOut).mockReset();

    useAuthTokenStore.getState().clearAccessToken();
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  test('starts client session after sign in', async () => {
    vi.mocked(AuthService.signIn).mockResolvedValue({
      accessToken: 'access-token',
    });

    await expect(
      AuthSessionService.signIn(createSignInPayload())
    ).resolves.toEqual({
      accessToken: 'access-token',
    });

    expect(AuthService.signIn).toHaveBeenCalledWith(createSignInPayload());
    expect(useAuthTokenStore.getState().accessToken).toBe('access-token');
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });

  test('starts client session after sign up', async () => {
    vi.mocked(AuthService.signUp).mockResolvedValue({
      accessToken: 'registered-token',
    });

    await expect(
      AuthSessionService.signUp(createSignUpPayload())
    ).resolves.toEqual({
      accessToken: 'registered-token',
    });

    expect(AuthService.signUp).toHaveBeenCalledWith(createSignUpPayload());
    expect(useAuthTokenStore.getState().accessToken).toBe('registered-token');
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });

  test('updates client session after refresh', async () => {
    vi.mocked(AuthService.refreshSession).mockResolvedValue({
      accessToken: 'fresh-token',
    });

    await expect(AuthSessionService.refresh()).resolves.toEqual({
      accessToken: 'fresh-token',
    });

    expect(AuthService.refreshSession).toHaveBeenCalledTimes(1);
    expect(useAuthTokenStore.getState().accessToken).toBe('fresh-token');
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });

  test('starts client session after Auth0 sign in', async () => {
    vi.mocked(AuthService.signInWithAuth0).mockResolvedValue({
      accessToken: 'bloomify-access-token',
    });

    await expect(
      AuthSessionService.signInWithAuth0('auth0-access-token', 'auth0-id-token')
    ).resolves.toEqual({
      accessToken: 'bloomify-access-token',
    });

    expect(AuthService.signInWithAuth0).toHaveBeenCalledWith({
      accessToken: 'auth0-access-token',
      idToken: 'auth0-id-token',
    });

    expect(useAuthTokenStore.getState().accessToken).toBe(
      'bloomify-access-token'
    );
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });

  test('clears client session after sign out', async () => {
    useAuthTokenStore.getState().setAccessToken('access-token');
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

    vi.mocked(AuthService.signOut).mockResolvedValue(undefined);

    await expect(AuthSessionService.signOut()).resolves.toBeUndefined();

    expect(AuthService.signOut).toHaveBeenCalledTimes(1);
    expect(useAuthTokenStore.getState().accessToken).toBeNull();
    expect(document.cookie).not.toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });

  test('clears client session even when sign out request fails', async () => {
    useAuthTokenStore.getState().setAccessToken('access-token');
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

    vi.mocked(AuthService.signOut).mockRejectedValue(new Error('network'));

    await expect(AuthSessionService.signOut()).rejects.toThrow('network');

    expect(AuthService.signOut).toHaveBeenCalledTimes(1);
    expect(useAuthTokenStore.getState().accessToken).toBeNull();
    expect(document.cookie).not.toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });
});
