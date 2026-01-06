'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import QueryLoader from '@/components/ui/query-loader';
import queryClient from '@/services/queryClient';

type AppProvidersProps = {
  children: ReactNode;
};

const isDevEnv = process.env.NODE_ENV === 'development';

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <QueryLoader />
      {isDevEnv && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
