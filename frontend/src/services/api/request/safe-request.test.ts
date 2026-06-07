import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ApiError, ApiErrorType } from '../errors/api-error';
import { safeRequest, safeVoidRequest } from './safe-request';

const toastMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

describe('safe-request', () => {
  beforeEach(() => {
    toastMock.mockReset();
  });

  test('returns successful request value', async () => {
    await expect(safeRequest(Promise.resolve({ ok: true }))).resolves.toEqual({
      ok: true,
    });
  });

  test('normalizes thrown errors and can show toast', async () => {
    await expect(
      safeRequest(Promise.reject(new Error('Boom')), {
        showErrorToast: true,
      })
    ).rejects.toEqual(
      expect.objectContaining({
        type: ApiErrorType.Unknown,
        userMessage: 'Boom',
      }) satisfies Partial<ApiError>
    );

    expect(toastMock).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Boom',
      variant: 'destructive',
    });
  });

  test('safeVoidRequest returns empty object on success', async () => {
    await expect(safeVoidRequest(Promise.resolve('ignored'))).resolves.toEqual(
      {}
    );
  });

  test('safeVoidRequest throws normalized errors without toast by default', async () => {
    await expect(
      safeVoidRequest(Promise.reject(new Error('Delete failed')))
    ).rejects.toEqual(
      expect.objectContaining({
        type: ApiErrorType.Unknown,
        userMessage: 'Delete failed',
      }) satisfies Partial<ApiError>
    );

    expect(toastMock).not.toHaveBeenCalled();
  });
});
