import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { ApiError } from '@/utils/api/api-error';
import { useToast } from '@/hooks/use-toast';

type ListMutationContext<TContext extends object = Record<string, never>> = {
  previousQueries?: Array<[QueryKey, unknown]>;
  listQueryKeys?: QueryKey[];
} & TContext;

type ListUpdater<TItem, TVariables> = (
  items: TItem[],
  variables: TVariables
) => TItem[];

type ResponseListUpdater<TItem, TVariables, TResponse> = (
  items: TItem[],
  response: TResponse,
  variables: TVariables
) => TItem[];

type InvalidationParams<TResponse, TVariables> = {
  data: TResponse;
  variables: TVariables;
};

type InvalidationResolver<TResponse, TVariables> =
  | QueryKey[]
  | ((params: InvalidationParams<TResponse, TVariables>) => QueryKey[]);

type CacheConfig<TItem, TVariables, TResponse> = {
  optimisticUpdate?: ListUpdater<TItem, TVariables>;
  updateFromResponse?: ResponseListUpdater<TItem, TVariables, TResponse>;
  invalidateList?: boolean;
  invalidateQueries?: InvalidationResolver<TResponse, TVariables>;
};

type ToastConfig = {
  successMessage?: string | false;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
};

type ListMutationCallbacks<
  TVariables,
  TResponse,
  TContext extends object,
> = {
  onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
  onError?: (
    error: ApiError,
    variables: TVariables,
    context: ListMutationContext<TContext> | undefined
  ) => void;
  onSuccess?: (
    data: TResponse,
    variables: TVariables,
    context: ListMutationContext<TContext> | undefined
  ) => void;
  onSettled?: (
    data: TResponse | undefined,
    error: ApiError | null,
    variables: TVariables,
    context: ListMutationContext<TContext> | undefined
  ) => void;
};

type ListMutationOptionKeysToOmit =
  | 'mutationKey'
  | 'mutationFn'
  | 'onMutate'
  | 'onError'
  | 'onSuccess'
  | 'onSettled';

type ListMutationOptions<TVariables, TResponse, TContext extends object> = Omit<
  UseMutationOptions<
    TResponse,
    ApiError,
    TVariables,
    ListMutationContext<TContext>
  >,
  ListMutationOptionKeysToOmit
>;

type UseOptimisticListMutationOptions<
  TItem,
  TVariables,
  TResponse,
  TContext extends object,
> = {
  queryKey: QueryKey;
  mutationKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TResponse>;
  cache?: CacheConfig<TItem, TVariables, TResponse>;
  toast?: ToastConfig;
  callbacks?: ListMutationCallbacks<TVariables, TResponse, TContext>;
  mutationOptions?: ListMutationOptions<TVariables, TResponse, TContext>;
};

const isListData = <TItem,>(value: unknown): value is TItem[] =>
  Array.isArray(value);

const getInvalidatedQueryKeys = <TResponse, TVariables>(
  resolver: InvalidationResolver<TResponse, TVariables> | undefined,
  params: InvalidationParams<TResponse, TVariables>
): QueryKey[] => {
  if (!resolver) {
    return [];
  }

  if (typeof resolver === 'function') {
    return resolver(params);
  }

  return resolver;
};

export function useOptimisticListMutation<
  TItem,
  TVariables,
  TResponse = TItem | void,
  TContext extends object = Record<string, never>,
>({
  queryKey,
  mutationKey,
  mutationFn,
  cache,
  toast: toastOptions,
  callbacks,
  mutationOptions,
}: UseOptimisticListMutationOptions<TItem, TVariables, TResponse, TContext>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<
    TResponse,
    ApiError,
    TVariables,
    ListMutationContext<TContext>
  >({
    ...mutationOptions,
    mutationKey,
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw ApiError.fromUnknown(error);
      }
    },
    onMutate: async (variables) => {
      const previousQueries = queryClient
        .getQueriesData({ queryKey })
        .filter(([, data]) => isListData<TItem>(data));
      const listQueryKeys = previousQueries.map(([nextQueryKey]) => nextQueryKey);

      if (cache?.optimisticUpdate) {
        await Promise.all(
          listQueryKeys.map((listQueryKey) =>
            queryClient.cancelQueries({ queryKey: listQueryKey, exact: true })
          )
        );

        listQueryKeys.forEach((listQueryKey) => {
          queryClient.setQueryData<TItem[]>(listQueryKey, (items = []) =>
            cache.optimisticUpdate?.(items, variables) ?? items
          );
        });
      }

      const extraContext = await callbacks?.onMutate?.(variables);

      return {
        previousQueries,
        listQueryKeys,
        ...(extraContext ?? {}),
      } as ListMutationContext<TContext>;
    },
    onError: (error, variables, context) => {
      context?.previousQueries?.forEach(([previousQueryKey, previousData]) => {
        queryClient.setQueryData(previousQueryKey, previousData);
      });

      if (toastOptions?.showErrorToast ?? true) {
        toast({
          title: 'Error',
          description: toastOptions?.errorMessage ?? error.userMessage,
          variant: 'destructive',
        });
      }

      callbacks?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (cache?.updateFromResponse) {
        context?.listQueryKeys?.forEach((listQueryKey) => {
          queryClient.setQueryData<TItem[]>(listQueryKey, (items = []) =>
            cache.updateFromResponse?.(items, data, variables) ?? items
          );
        });
      }

      if (cache?.invalidateList) {
        context?.listQueryKeys?.forEach((listQueryKey) => {
          queryClient.invalidateQueries({ queryKey: listQueryKey, exact: true });
        });
      }

      getInvalidatedQueryKeys(cache?.invalidateQueries, {
        data,
        variables,
      }).forEach((nextQueryKey) => {
        queryClient.invalidateQueries({ queryKey: nextQueryKey });
      });

      if (
        toastOptions?.showSuccessToast !== false &&
        toastOptions?.successMessage
      ) {
        toast({
          title: 'Success',
          description: toastOptions.successMessage,
          variant: 'success',
        });
      }

      callbacks?.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      callbacks?.onSettled?.(data, error ?? null, variables, context);
    },
  });
}
