'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import QueryLoader from '@/components/ui/query-loader';
import Toaster from '@/components/ui/toaster';
import Auth0ProviderClient from '@/features/auth/auth0-provider.client';
import queryClient from '@/services/queryClient';
import AuthSessionBootstrap from './auth-session-bootstrap';

type AppProvidersProps = {
  children: ReactNode;
};

const isDevEnv = process.env.NODE_ENV === 'development';

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Auth0ProviderClient>
      <QueryClientProvider client={queryClient}>
        <AuthSessionBootstrap />
        {children}
        <QueryLoader />
        <Toaster />
        {isDevEnv && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Auth0ProviderClient>
  );
}
