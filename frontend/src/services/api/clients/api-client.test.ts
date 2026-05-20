import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, test } from 'vitest';

import { ALLOWED_EXTERNAL_HOSTS } from '@/constants/network.constants';
import { useAuthTokenStore } from '@/features/auth/store/auth-token.store';
import { apiUrl } from '@/test/api-url';
import { server } from '@/test/msw/server';

import { ApiClient } from './api-client';

describe('ApiClient auth headers', () => {
  beforeEach(() => {
    useAuthTokenStore.getState().clearAccessToken();
    ALLOWED_EXTERNAL_HOSTS.clear();
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
});
