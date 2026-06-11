import { afterEach, describe, expect, test, vi } from 'vitest';

const mockHeaders = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

const loadServerApiUrl = async (baseUrl: string) => {
  vi.resetModules();
  vi.doMock('@/components/config/env', () => ({
    BASE_URL: baseUrl,
  }));

  return import('./server-api-url');
};

describe('getServerApiBaseUrl', () => {
  afterEach(() => {
    vi.doUnmock('@/components/config/env');
    mockHeaders.mockReset();
  });

  test('builds same-origin API URL from forwarded headers', async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        'x-forwarded-host': 'bloomify-pi.vercel.app',
        'x-forwarded-proto': 'https',
      })
    );

    const { getServerApiBaseUrl } = await loadServerApiUrl('/api');

    await expect(getServerApiBaseUrl()).resolves.toBe(
      'https://bloomify-pi.vercel.app/api'
    );
  });

  test('does not override absolute API URLs', async () => {
    const { getServerApiBaseUrl } = await loadServerApiUrl(
      'https://api.example.com'
    );

    await expect(getServerApiBaseUrl()).resolves.toBeUndefined();
    expect(mockHeaders).not.toHaveBeenCalled();
  });
});
