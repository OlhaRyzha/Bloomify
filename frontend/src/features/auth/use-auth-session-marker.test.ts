import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { AUTH_SESSION_COOKIE_NAME } from './auth-routing';
import { useAuthSessionMarker } from './use-auth-session-marker';

describe('useAuthSessionMarker', () => {
  beforeEach(() => {
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  test('returns true when marker cookie exists', async () => {
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

    const { result } = renderHook(() => useAuthSessionMarker());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  test('returns false without marker cookie', () => {
    const { result } = renderHook(() => useAuthSessionMarker());

    expect(result.current).toBe(false);
  });
});
