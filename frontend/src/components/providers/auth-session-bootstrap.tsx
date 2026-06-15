'use client';

import { useEffect, useRef } from 'react';

import AuthSessionService from '@/features/auth/lib/shared/auth-session.service';
import { clearClientAuthSession } from '@/features/auth/lib/client/auth-session.client';
import { useAuthSessionMarker } from '@/features/auth/hooks/use-auth-session-marker';
import { useAuthTokenStore } from '@/features/auth/store/auth-token.store';

export default function AuthSessionBootstrap() {
  const hasSession = useAuthSessionMarker();
  const accessToken = useAuthTokenStore((state) => state.accessToken);
  const didRefresh = useRef(false);

  useEffect(() => {
    if (!hasSession || accessToken || didRefresh.current) return;

    didRefresh.current = true;

    AuthSessionService.refresh().catch(() => {
      clearClientAuthSession();
    });
  }, [hasSession, accessToken]);

  return null;
}
