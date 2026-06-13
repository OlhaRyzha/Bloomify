'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import QueryLoader from '@/components/ui/query-loader';
import Toaster from '@/components/ui/toaster';
import Auth0ProviderClient from '@/features/auth/components/auth0-provider.client';
import queryClient from '@/services/api/query/query-client';
import AuthSessionBootstrap from './auth-session-bootstrap';
import { isDevelopment } from '@/utils/guards/is-development';

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Auth0ProviderClient>
      <QueryClientProvider client={queryClient}>
        <AuthSessionBootstrap />
        {children}
        <QueryLoader />
        <Toaster />
        {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Auth0ProviderClient>
  );
}
