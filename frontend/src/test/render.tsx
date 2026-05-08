import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, type ReactNode } from 'react';

import { LocaleProvider } from '@/components/providers/locale-provider';
import { defaultLocale, type Locale } from '@/locales/translations';

type RenderWithProvidersOptions = RenderOptions & {
  locale?: Locale;
  queryClient?: QueryClient;
};

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const renderWithProviders = (
  ui: ReactElement,
  {
    locale = defaultLocale,
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    </QueryClientProvider>
  );

  return {
    queryClient,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};
