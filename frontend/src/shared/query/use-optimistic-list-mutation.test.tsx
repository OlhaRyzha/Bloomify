import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { createTestQueryClient } from '@/test/render';

import {
  OPTIMISTIC_LIST_MUTATION_ACTIONS,
  useOptimisticListMutation,
} from './use-optimistic-list-mutation';

type TestItem = {
  id: string;
  name: string;
};

const queryKey = ['items'];

const createWrapper = () => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

describe('useOptimisticListMutation', () => {
  test('adds an item optimistically and keeps canonical response data', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const initialData: TestItem[] = [{ id: 'rose', name: 'Rose' }];
    const responseItem: TestItem = { id: 'lily', name: 'Lily from API' };
    queryClient.setQueryData(queryKey, initialData);

    const { result } = renderHook(
      () =>
        useOptimisticListMutation<
          TestItem,
          { item: TestItem },
          TestItem
        >({
          action: OPTIMISTIC_LIST_MUTATION_ACTIONS.CREATE,
          queryKey,
          mutationFn: async () => responseItem,
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        item: { id: 'lily', name: 'Lily optimistic' },
      });
    });

    expect(queryClient.getQueryData(queryKey)).toEqual([
      responseItem,
      initialData[0],
    ]);
  });

  test('updates an item optimistically and replaces it with response data', async () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData<TestItem[]>(queryKey, [
      { id: 'rose', name: 'Rose' },
      { id: 'lily', name: 'Lily' },
    ]);

    const { result } = renderHook(
      () =>
        useOptimisticListMutation<
          TestItem,
          { id: string; payload: Partial<TestItem> },
          TestItem
        >({
          action: OPTIMISTIC_LIST_MUTATION_ACTIONS.UPDATE,
          queryKey,
          mutationFn: async () => ({ id: 'lily', name: 'Lily from API' }),
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: 'lily',
        payload: { name: 'Lily optimistic' },
      });
    });

    expect(queryClient.getQueryData(queryKey)).toEqual([
      { id: 'rose', name: 'Rose' },
      { id: 'lily', name: 'Lily from API' },
    ]);
  });

  test('removes an item optimistically for delete mutations', async () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData<TestItem[]>(queryKey, [
      { id: 'rose', name: 'Rose' },
      { id: 'lily', name: 'Lily' },
    ]);

    const { result } = renderHook(
      () =>
        useOptimisticListMutation<TestItem, { id: string }, void>({
          action: OPTIMISTIC_LIST_MUTATION_ACTIONS.DELETE,
          queryKey,
          mutationFn: async () => undefined,
          options: {
            updateFromResponse: false,
          },
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: 'rose' });
    });

    expect(queryClient.getQueryData(queryKey)).toEqual([
      { id: 'lily', name: 'Lily' },
    ]);
  });

  test('rolls back optimistic data when mutation fails', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const initialData: TestItem[] = [{ id: 'rose', name: 'Rose' }];
    queryClient.setQueryData(queryKey, initialData);

    const { result } = renderHook(
      () =>
        useOptimisticListMutation<
          TestItem,
          { item: TestItem },
          TestItem
        >({
          action: OPTIMISTIC_LIST_MUTATION_ACTIONS.CREATE,
          queryKey,
          mutationFn: async () => {
            throw new Error('Request failed');
          },
          options: {
            toast: {
              showErrorToast: false,
            },
          },
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({ item: { id: 'lily', name: 'Lily' } })
      ).rejects.toThrow('Request failed');
    });

    expect(queryClient.getQueryData(queryKey)).toEqual(initialData);
  });

  test('invalidates list query only when explicitly enabled', async () => {
    const { queryClient, Wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData<TestItem[]>(queryKey, [
      { id: 'rose', name: 'Rose' },
    ]);

    const { result } = renderHook(
      () =>
        useOptimisticListMutation<
          TestItem,
          { id: string; payload: Partial<TestItem> },
          TestItem
        >({
          action: OPTIMISTIC_LIST_MUTATION_ACTIONS.UPDATE,
          queryKey,
          mutationFn: async () => ({ id: 'rose', name: 'Rose from API' }),
          options: {
            invalidate: true,
          },
        }),
      { wrapper: Wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: 'rose',
        payload: { name: 'Rose optimistic' },
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey });
  });
});
