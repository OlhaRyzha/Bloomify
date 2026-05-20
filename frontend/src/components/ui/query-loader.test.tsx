import { useQuery } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { renderWithProviders } from '@/test/render';

import QueryLoader from './query-loader';

const PendingQuery = ({
  showGlobalLoader = true,
}: {
  showGlobalLoader?: boolean;
}) => {
  useQuery({
    queryFn: () => new Promise(() => undefined),
    queryKey: ['pending-query', showGlobalLoader],
    meta: { showGlobalLoader },
  });

  return null;
};

describe('QueryLoader', () => {
  test('shows global loader after the delay for visible pending queries', async () => {
    renderWithProviders(
      <>
        <QueryLoader />
        <PendingQuery />
      </>
    );

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  test('respects showGlobalLoader false metadata', async () => {
    renderWithProviders(
      <>
        <QueryLoader />
        <PendingQuery showGlobalLoader={false} />
      </>
    );

    await new Promise((resolve) => window.setTimeout(resolve, 200));

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });
});
