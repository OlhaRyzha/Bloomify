import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, ApiErrorType } from './api-error';
import { parseResponseWithSchema, safeFetchJson } from './safe-fetch';

describe('safe-fetch utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('parseResponseWithSchema returns parsed data', () => {
    expect(
      parseResponseWithSchema({ id: 'rose' }, z.object({ id: z.string() }))
    ).toEqual({ id: 'rose' });
  });

  test('parseResponseWithSchema throws validation ApiError', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response: unknown = { id: 123 };

    expect(() =>
      parseResponseWithSchema(response, z.object({ id: z.string() }))
    ).toThrow(
      expect.objectContaining({
        type: ApiErrorType.Validation,
      }) satisfies Partial<ApiError>
    );
  });

  test('safeFetchJson returns parsed json for successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ ok: true }))
    );

    await expect(safeFetchJson('/api/test')).resolves.toEqual({ ok: true });
  });

  test('safeFetchJson returns null for failed responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 500 }))
    );

    await expect(safeFetchJson('/api/test')).resolves.toBeNull();
  });
});
