import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { ApiError } from '@/utils/api/api-error';
import { useToast } from '@/hooks/use-toast';
import type { IdType } from '@/types/ids';

export const MUTATION_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type MutationAction =
  (typeof MUTATION_ACTIONS)[keyof typeof MUTATION_ACTIONS];

export type MutationVariables<TItem> = {
  id?: IdType;
  payload?: Partial<TItem>;
  item?: TItem;
};

export type OptimisticUpdateContext<TItem> = {
  previousData?: TItem[];
};

type OptimisticUpdateFn<TItem, TVariables> = (
  items: TItem[],
  variables: TVariables,
  action: MutationAction,
  getItemId: (item: TItem) => IdType | undefined
) => TItem[];

type MutateItemOptions<TItem, TVariables> = {
  optimisticUpdate?: OptimisticUpdateFn<TItem, TVariables>;
  getItemId?: (item: TItem) => IdType | undefined;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (
    data: TItem | void,
    variables: TVariables,
    context?: OptimisticUpdateContext<TItem>
  ) => void;
  onError?: (
    error: ApiError,
    variables: TVariables,
    context?: OptimisticUpdateContext<TItem>
  ) => void;
  onSettled?: (
    data: TItem | void | undefined,
    error: ApiError | null,
    variables: TVariables,
    context?: OptimisticUpdateContext<TItem>
  ) => void;
};

interface UseMutateItemWithOptimisticUpdateProps<
  TItem extends object,
  TVariables extends MutationVariables<TItem>,
> {
  queryKey: QueryKey;
  action: MutationAction;
  mutateFn: (variables: TVariables) => Promise<TItem | void>;
  entity?: string;
  options?: MutateItemOptions<TItem, TVariables>;
}

const defaultOptimisticUpdate = <
  TItem,
  TVariables extends MutationVariables<TItem>,
>(
  items: TItem[],
  variables: TVariables,
  action: MutationAction,
  getItemId: (item: TItem) => IdType | undefined
): TItem[] => {
  if (action === MUTATION_ACTIONS.CREATE) {
    const item = variables.item ?? (variables.payload as TItem | undefined);
    return item ? [item, ...items] : items;
  }

  if (action === MUTATION_ACTIONS.UPDATE) {
    const id = variables.id;
    const patch =
      variables.payload ?? (variables.item as Partial<TItem> | undefined);
    if (id === undefined || id === null || !patch) return items;
    return items.map((item) =>
      getItemId(item) === id ? { ...item, ...patch } : item
    );
  }

  if (action === MUTATION_ACTIONS.DELETE) {
    const id = variables.id;
    if (id === undefined || id === null) return items;
    return items.filter((item) => getItemId(item) !== id);
  }

  return items;
};

const buildSuccessMessage = (
  action: MutationAction,
  entity?: string,
  custom?: string
) => {
  if (custom) return custom;
  const label = entity ? `${entity} ` : '';

  if (action === MUTATION_ACTIONS.CREATE) return `${label}created`;
  if (action === MUTATION_ACTIONS.UPDATE) return `${label}updated`;
  return `${label}deleted`;
};

export function useMutateItemWithOptimisticUpdate<
  TItem extends object,
  TVariables extends MutationVariables<TItem>,
>({
  queryKey,
  action,
  mutateFn,
  options,
  entity = '',
}: UseMutateItemWithOptimisticUpdateProps<TItem, TVariables>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const optimisticUpdate = options?.optimisticUpdate ?? defaultOptimisticUpdate;
  const getItemId =
    options?.getItemId ?? ((item: TItem) => (item as { id?: IdType }).id);

  return useMutation<
    TItem | void,
    ApiError,
    TVariables,
    OptimisticUpdateContext<TItem>
  >({
    mutationKey: [...queryKey, action],
    mutationFn: async (variables) => {
      try {
        return await mutateFn(variables);
      } catch (error) {
        throw ApiError.fromUnknown(error);
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);
      const updatedData = optimisticUpdate(
        previousData ?? [],
        variables,
        action,
        getItemId
      );

      queryClient.setQueryData(queryKey, updatedData);
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (options?.showErrorToast ?? true) {
        toast({
          title: 'Error',
          description: options?.errorMessage ?? error.userMessage,
          variant: 'destructive',
        });
      }

      options?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (options?.showSuccessToast ?? true) {
        toast({
          title: 'Success',
          description: buildSuccessMessage(
            action,
            entity,
            options?.successMessage
          ),
          variant: 'success',
        });
      }

      options?.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSettled?.(data, error ?? null, variables, context);
    },
  });
}
