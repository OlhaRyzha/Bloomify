import { QueryClient } from '@tanstack/react-query';

export const STALE_TIME = 5 * 60 * 1000;
export const GS_TIME = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GS_TIME,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
export default queryClient;
