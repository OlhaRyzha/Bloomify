import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { ApiError } from '@/services/api/errors/api-error';
import { useToast } from '@/hooks/use-toast';
import type { IdType } from '@/types/ids';

export const OPTIMISTIC_LIST_MUTATION_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type OptimisticListMutationAction =
  (typeof OPTIMISTIC_LIST_MUTATION_ACTIONS)[keyof typeof OPTIMISTIC_LIST_MUTATION_ACTIONS];

export type OptimisticListMutationVariables<TItem> = {
  id?: IdType;
  payload?: Partial<TItem>;
  item?: TItem;
};

export type OptimisticListMutationContext<TItem> = {
  previousData?: TItem[];
};

type MutationCacheParams<TItem, TVariables, TResponse> = {
  action: OptimisticListMutationAction;
  currentData: TItem[];
  getItemId: (item: TItem) => IdType | undefined;
  response?: TResponse;
  variables: TVariables;
};

type OptimisticListUpdate<TItem, TVariables, TResponse> = (
  params: MutationCacheParams<TItem, TVariables, TResponse>
) => TItem[];

type ToastMessageParams<TVariables, TResponse> = {
  action: OptimisticListMutationAction;
  error?: ApiError;
  response?: TResponse;
  variables: TVariables;
};

type ToastMessage<TVariables, TResponse> =
  | string
  | ((params: ToastMessageParams<TVariables, TResponse>) => string | undefined);

type MutationToastOptions<TVariables, TResponse> = {
  errorMessage?: ToastMessage<TVariables, TResponse>;
  errorTitle?: ToastMessage<TVariables, TResponse>;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: ToastMessage<TVariables, TResponse>;
  successTitle?: ToastMessage<TVariables, TResponse>;
};

type InvalidateOption<TItem, TVariables, TResponse> =
  | boolean
  | ((params: MutationCacheParams<TItem, TVariables, TResponse>) => boolean);

type OptimisticListMutationOptions<TItem, TVariables, TResponse> = {
  getItemId?: (item: TItem) => IdType | undefined;
  invalidate?: InvalidateOption<TItem, TVariables, TResponse>;
  optimisticUpdate?: false | OptimisticListUpdate<TItem, TVariables, TResponse>;
  rollbackOnError?: boolean;
  toast?: MutationToastOptions<TVariables, TResponse>;
  updateFromResponse?:
    | false
    | OptimisticListUpdate<TItem, TVariables, TResponse>;
  onError?: (
    error: ApiError,
    variables: TVariables,
    context?: OptimisticListMutationContext<TItem>
  ) => void;
  onSettled?: (
    data: TResponse | undefined,
    error: ApiError | null,
    variables: TVariables,
    context?: OptimisticListMutationContext<TItem>
  ) => void;
  onSuccess?: (
    data: TResponse,
    variables: TVariables,
    context?: OptimisticListMutationContext<TItem>
  ) => void;
};

type UseOptimisticListMutationProps<
  TItem extends object,
  TVariables extends OptimisticListMutationVariables<TItem>,
  TResponse,
> = {
  action: OptimisticListMutationAction;
  mutationFn: (variables: TVariables) => Promise<TResponse>;
  options?: OptimisticListMutationOptions<TItem, TVariables, TResponse>;
  queryKey: QueryKey;
};

const getDefaultItemId = <TItem extends object>(item: TItem) =>
  (item as { id?: IdType }).id;

const resolveToastText = <TVariables, TResponse>(
  message: ToastMessage<TVariables, TResponse> | undefined,
  params: ToastMessageParams<TVariables, TResponse>
) => {
  if (typeof message === 'function') {
    return message(params);
  }

  return message;
};

const defaultOptimisticUpdate = <
  TItem extends object,
  TVariables extends OptimisticListMutationVariables<TItem>,
  TResponse,
>({
  action,
  currentData,
  getItemId,
  variables,
}: MutationCacheParams<TItem, TVariables, TResponse>): TItem[] => {
  if (action === OPTIMISTIC_LIST_MUTATION_ACTIONS.CREATE) {
    const item = variables.item ?? (variables.payload as TItem | undefined);
    return item ? [item, ...currentData] : currentData;
  }

  if (action === OPTIMISTIC_LIST_MUTATION_ACTIONS.UPDATE) {
    const id = variables.id;
    const patch =
      variables.payload ?? (variables.item as Partial<TItem> | undefined);

    if (id === undefined || id === null || !patch) {
      return currentData;
    }

    return currentData.map((item) =>
      getItemId(item) === id ? { ...item, ...patch } : item
    );
  }

  if (action === OPTIMISTIC_LIST_MUTATION_ACTIONS.DELETE) {
    const id = variables.id;

    if (id === undefined || id === null) {
      return currentData;
    }

    return currentData.filter((item) => getItemId(item) !== id);
  }

  return currentData;
};

const defaultUpdateFromResponse = <
  TItem extends object,
  TVariables extends OptimisticListMutationVariables<TItem>,
  TResponse,
>({
  action,
  currentData,
  getItemId,
  response,
}: MutationCacheParams<TItem, TVariables, TResponse>): TItem[] => {
  if (
    action === OPTIMISTIC_LIST_MUTATION_ACTIONS.DELETE ||
    !response ||
    typeof response !== 'object'
  ) {
    return currentData;
  }

  const responseItem = response as unknown as TItem;
  const responseItemId = getItemId(responseItem);

  if (responseItemId === undefined || responseItemId === null) {
    return currentData;
  }

  const hasItem = currentData.some(
    (item) => getItemId(item) === responseItemId
  );

  if (!hasItem && action === OPTIMISTIC_LIST_MUTATION_ACTIONS.CREATE) {
    return [responseItem, ...currentData];
  }

  return currentData.map((item) =>
    getItemId(item) === responseItemId ? responseItem : item
  );
};

export function useOptimisticListMutation<
  TItem extends object,
  TVariables extends OptimisticListMutationVariables<TItem>,
  TResponse = TItem | void,
>({
  action,
  mutationFn,
  options,
  queryKey,
}: UseOptimisticListMutationProps<TItem, TVariables, TResponse>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const getItemId = options?.getItemId ?? getDefaultItemId<TItem>;
  const optimisticUpdate =
    options?.optimisticUpdate === false
      ? null
      : (options?.optimisticUpdate ?? defaultOptimisticUpdate);
  const updateFromResponse =
    options?.updateFromResponse === false
      ? null
      : (options?.updateFromResponse ?? defaultUpdateFromResponse);

  return useMutation<
    TResponse,
    ApiError,
    TVariables,
    OptimisticListMutationContext<TItem>
  >({
    mutationKey: [...queryKey, action],
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw ApiError.fromUnknown(error);
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      if (!optimisticUpdate || !previousData) {
        return { previousData };
      }

      queryClient.setQueryData(
        queryKey,
        optimisticUpdate({
          action,
          currentData: previousData,
          getItemId,
          variables,
        })
      );

      return { previousData };
    },
    onError: (error, variables, context) => {
      if ((options?.rollbackOnError ?? true) && context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (options?.toast?.showErrorToast ?? true) {
        const params = { action, error, variables };
        const description =
          resolveToastText(options?.toast?.errorMessage, params) ??
          error.userMessage;
        const title =
          resolveToastText(options?.toast?.errorTitle, params) ?? 'Error';

        toast({
          title,
          description,
          variant: 'destructive',
        });
      }

      options?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (updateFromResponse && context?.previousData) {
        const currentData =
          queryClient.getQueryData<TItem[]>(queryKey) ?? context.previousData;

        queryClient.setQueryData(
          queryKey,
          updateFromResponse({
            action,
            currentData,
            getItemId,
            response: data,
            variables,
          })
        );
      }

      if (options?.toast?.showSuccessToast) {
        const params = { action, response: data, variables };
        const description = resolveToastText(
          options?.toast?.successMessage,
          params
        );
        const title =
          resolveToastText(options?.toast?.successTitle, params) ?? 'Success';

        toast({
          title,
          variant: 'success',
          ...(description ? { description } : {}),
        });
      }

      options?.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      const currentData = queryClient.getQueryData<TItem[]>(queryKey) ?? [];
      const shouldInvalidate =
        typeof options?.invalidate === 'function'
          ? options.invalidate({
              action,
              currentData,
              getItemId,
              response: data,
              variables,
            })
          : (options?.invalidate ?? false);

      if (shouldInvalidate) {
        queryClient.invalidateQueries({ queryKey });
      }

      options?.onSettled?.(data, error ?? null, variables, context);
    },
  });
}
