import type { ZodTypeAny } from 'zod';

export const validateWithZod = (
  schema: ZodTypeAny,
  values: Record<string, unknown>
) => {
  const result = schema.safeParse(values);
  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<Record<string, string>>((errors, issue) => {
    const pathKey = issue.path[0];
    if (typeof pathKey !== 'string' || errors[pathKey]) {
      return errors;
    }

    errors[pathKey] = issue.message;
    return errors;
  }, {});
};
