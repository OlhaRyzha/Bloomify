'use client';

import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/services/api/errors/api-error';

import AuthService from '../lib/server/api/auth.service';
import type { CurrentUser } from '../lib/server/api/auth.schemas';
import { useAuthSessionMarker } from './use-auth-session-marker';

export const currentUserQueryKey = ['auth', 'current-user'] as const;

/**
 * Current authenticated user (id/email/name) for personalising the UI.
 * Only fetched when the session-marker cookie is present, so guests never
 * trigger a request. Cache timing comes from the global QueryClient defaults.
 */
export const useCurrentUser = () => {
  const hasSession = useAuthSessionMarker();

  return useQuery<CurrentUser, ApiError>({
    queryKey: currentUserQueryKey,
    queryFn: AuthService.getCurrentUser,
    enabled: hasSession,
  });
};
