'use client';

import { useSyncExternalStore } from 'react';

import { AUTH_SESSION_COOKIE_NAME } from '../lib/shared/auth-routing';

const hasSessionMarkerCookie = () =>
  document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${AUTH_SESSION_COOKIE_NAME}=`));

export const useAuthSessionMarker = () => {
  return useSyncExternalStore(
    () => () => undefined,
    hasSessionMarkerCookie,
    () => false
  );
};
