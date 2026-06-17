'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import QueryLoader from '@/components/ui/query-loader';
import Toaster from '@/components/ui/toaster';
import queryClient from '@/services/api/query/query-client';
import AuthSessionBootstrap from './auth-session-bootstrap';
import { isDevelopment } from '@/utils/guards/is-development';

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap />
      {children}
      <QueryLoader />
      <Toaster />
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
