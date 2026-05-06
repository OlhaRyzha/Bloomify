import type { Locale } from '@/locales/translations';

export const mutationOperations = {
  create: 'create',
  update: 'update',
  delete: 'delete',
} as const;

export type MutationOperation = keyof typeof mutationOperations;

export const createMutationKey = <
  TEntity extends string,
  TAction extends string,
>(
  entity: TEntity,
  action: TAction
) => [entity, action] as const;

export const createMutationKeys = <TEntity extends string>(
  entity: TEntity
) => ({
  create: createMutationKey(entity, mutationOperations.create),
  update: createMutationKey(entity, mutationOperations.update),
  delete: createMutationKey(entity, mutationOperations.delete),
});

export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (locale: Locale) => [...productsQueryKeys.lists(), locale] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string, locale: Locale) =>
    [...productsQueryKeys.details(), id, locale] as const,
};

export const productsMutationKeys = createMutationKeys('products');
