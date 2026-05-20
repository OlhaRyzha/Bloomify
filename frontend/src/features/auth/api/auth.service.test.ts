import { http, HttpResponse } from 'msw';
import { describe, expect, test, vi } from 'vitest';

import { ApiError, ApiErrorType } from '@/utils/api/api-error';
import { server } from '@/test/msw/server';
import { apiUrl } from '@/test/api-url';

import AuthService from './auth.service';
import { createSignInPayload, createSignUpPayload } from '../auth.factory';

describe('AuthService', () => {
  test('signs in and accepts access_token response shape', async () => {
    server.use(
      http.post(apiUrl('auth/token/'), async ({ request }) => {
        await expect(request.json()).resolves.toEqual(createSignInPayload());

        return HttpResponse.json({ access_token: 'access-from-api' });
      })
    );

    await expect(
      AuthService.signIn(createSignInPayload())
    ).resolves.toEqual({ accessToken: 'access-from-api' });
  });

  test('signs up and accepts access response shape', async () => {
    server.use(
      http.post(apiUrl('auth/register/'), async ({ request }) => {
        await expect(request.json()).resolves.toEqual(createSignUpPayload());

        return HttpResponse.json({ access: 'access-from-register' });
      })
    );

    await expect(
      AuthService.signUp(createSignUpPayload())
    ).resolves.toEqual({ accessToken: 'access-from-register' });
  });

  test('refreshes session through refresh endpoint', async () => {
    server.use(
      http.post(apiUrl('auth/refresh/'), () =>
        HttpResponse.json({ access_token: 'fresh-access-token' })
      )
    );

    await expect(AuthService.refreshSession()).resolves.toEqual({
      accessToken: 'fresh-access-token',
    });
  });

  test('signs out through logout endpoint', async () => {
    server.use(
      http.post(apiUrl('auth/logout/'), () =>
        HttpResponse.json({ success: true })
      )
    );

    await expect(AuthService.signOut()).resolves.toBeUndefined();
  });

  test('normalizes missing token response into ApiError', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    server.use(
      http.post(apiUrl('auth/token/'), () =>
        HttpResponse.json({ detail: 'No token here' })
      )
    );

    await expect(
      AuthService.signIn(createSignInPayload())
    ).rejects.toEqual(
      expect.objectContaining({
        type: ApiErrorType.Validation,
      }) satisfies Partial<ApiError>
    );

    consoleErrorSpy.mockRestore();
  });
});
