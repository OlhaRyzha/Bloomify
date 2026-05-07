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
