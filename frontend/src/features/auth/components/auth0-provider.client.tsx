'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import {
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
} from '@/components/config/env';
import { isWindowUndefined } from '@/utils/guards/is-window-undefined';

type Auth0ProviderClientProps = {
  children: ReactNode;
};

export default function Auth0ProviderClient({
  children,
}: Auth0ProviderClientProps) {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_AUDIENCE) {
    return children;
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        audience: AUTH0_AUDIENCE,
        redirect_uri: isWindowUndefined()
          ? undefined
          : `${window.location.origin}/callback`,
      }}
      cacheLocation='memory'
      useRefreshTokens={false}>
      {children}
    </Auth0Provider>
  );
}
