import { pipe, R } from '@mobily/ts-belt';
import type { Result } from '@mobily/ts-belt';
import z from 'zod';

import { ApiError } from './api-error';
import { toast } from '@/hooks/use-toast';
import { validationMessages } from '@/constants/message.constants';

function handleErrorToastAndThrow<T>(result: Result<T, ApiError>): T {
  return R.match(
    result,
    (value) => value,
    (err) => {
      toast({
        title: 'Error',
        description: err.userMessage,
        variant: 'destructive',
      });
      throw err;
    }
  );
}

export async function safeFetch<T>(
  apiCall: Promise<T>,
  schema: z.Schema<NonNullable<T>>
): Promise<T> {
  const initial: Result<NonNullable<T>, unknown> = await R.fromPromise(apiCall);

  const checked: Result<T, ApiError> = pipe(
    initial,
    R.mapError(ApiError.fromUnknown),
    R.flatMap((response) => {
      const parsed = schema.safeParse(response);
      if (parsed.success) return R.Ok(parsed.data);
      console.error(validationMessages.zodError, parsed.error, response);
      return R.Error(ApiError.fromZod(parsed.error));
    })
  );

  return handleErrorToastAndThrow(checked);
}

export async function fetchVoidResponse(
  apiCall: Promise<unknown>
): Promise<object> {
  const initial: Result<unknown, unknown> = await R.fromPromise(apiCall);

  const checked: Result<object, ApiError> = pipe(
    initial,
    R.mapError(ApiError.fromUnknown),
    R.flatMap(() => R.Ok<object>({}))
  );

  return handleErrorToastAndThrow(checked);
}

export async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error('[Binance] fetch error', url, error);
    return null;
  }
}
