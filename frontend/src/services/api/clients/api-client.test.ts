import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, test } from 'vitest';

import { API_ROUTES } from '@/constants/api.constant';
import { ALLOWED_EXTERNAL_HOSTS } from '@/constants/network.constants';
import { AUTH_SESSION_COOKIE_NAME } from '@/features/auth/auth-routing';
import { useAuthTokenStore } from '@/features/auth/store/auth-token.store';
import { apiUrl } from '@/test/api-url';
import { server } from '@/test/msw/server';
import { ApiErrorType } from '@/utils/api/api-error';

import { ApiClient } from './api-client';

describe('ApiClient auth headers', () => {
  beforeEach(() => {
    useAuthTokenStore.getState().clearAccessToken();
    ALLOWED_EXTERNAL_HOSTS.clear();
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  test('attaches bearer token to base API requests', async () => {
    useAuthTokenStore.getState().setAccessToken('access-token');

    server.use(
      http.get(apiUrl('profile'), ({ request }) => {
        expect(request.headers.get('authorization')).toBe(
          'Bearer access-token'
        );

        return HttpResponse.json({ ok: true });
      })
    );

    await expect(new ApiClient().get('profile')).resolves.toEqual({
      ok: true,
    });
  });

  test('does not attach auth headers to allowlisted external hosts', async () => {
    useAuthTokenStore.getState().setAccessToken('access-token');
    ALLOWED_EXTERNAL_HOSTS.add('assets.example.com');

    server.use(
      http.get('https://assets.example.com/image.json', ({ request }) => {
        expect(request.headers.get('authorization')).toBeNull();
        expect(request.headers.get('cookie')).toBeNull();

        return HttpResponse.json({ ok: true });
      })
    );

    await expect(
      new ApiClient().get('https://assets.example.com/image.json')
    ).resolves.toEqual({ ok: true });
  });

  test('refreshes access token once and retries a protected request after 401', async () => {
    useAuthTokenStore.getState().setAccessToken('expired-token');
    let profileRequests = 0;
    let refreshRequests = 0;

    server.use(
      http.get(apiUrl('profile'), ({ request }) => {
        profileRequests += 1;

        if (profileRequests === 1) {
          expect(request.headers.get('authorization')).toBe(
            'Bearer expired-token'
          );

          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        expect(request.headers.get('authorization')).toBe(
          'Bearer fresh-token'
        );

        return HttpResponse.json({ ok: true });
      }),
      http.post(apiUrl(API_ROUTES.AUTH_REFRESH_TOKEN), () => {
        refreshRequests += 1;
        return HttpResponse.json({ access_token: 'fresh-token' });
      })
    );

    await expect(new ApiClient().get('profile')).resolves.toEqual({
      ok: true,
    });
    expect(profileRequests).toBe(2);
    expect(refreshRequests).toBe(1);
    expect(useAuthTokenStore.getState().accessToken).toBe('fresh-token');
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });

  test('does not refresh auth session endpoints after 401', async () => {
    let refreshRequests = 0;

    server.use(
      http.post(apiUrl(API_ROUTES.AUTH_SIGN_IN), () =>
        HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      ),
      http.post(apiUrl(API_ROUTES.AUTH_REFRESH_TOKEN), () => {
        refreshRequests += 1;
        return HttpResponse.json({ access_token: 'fresh-token' });
      })
    );

    await expect(
      new ApiClient().post(API_ROUTES.AUTH_SIGN_IN, {
        email: 'olha@example.com',
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({
      type: ApiErrorType.Unauthorized,
    });
    expect(refreshRequests).toBe(0);
  });

  test('clears client auth session when refresh fails', async () => {
    useAuthTokenStore.getState().setAccessToken('expired-token');
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

    server.use(
      http.get(apiUrl('profile'), () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      ),
      http.post(apiUrl(API_ROUTES.AUTH_REFRESH_TOKEN), () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    await expect(new ApiClient().get('profile')).rejects.toMatchObject({
      type: ApiErrorType.Unauthorized,
    });
    expect(useAuthTokenStore.getState().accessToken).toBeNull();
    expect(document.cookie).not.toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
  });
});
