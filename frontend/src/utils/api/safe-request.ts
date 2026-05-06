import { pipe, R } from '@mobily/ts-belt';
import type { Result } from '@mobily/ts-belt';
import { toast } from '@/hooks/use-toast';
import { ApiError } from './api-error';

export type SafeRequestOptions = {
  showErrorToast?: boolean;
};

const notifyAboutError = (error: ApiError, options?: SafeRequestOptions) => {
  const shouldShowErrorToast = options?.showErrorToast ?? false;

  if (shouldShowErrorToast) {
    toast({
      title: 'Error',
      description: error.userMessage,
      variant: 'destructive',
    });
  }
};

const handleErrorAndThrow = <T>(
  result: Result<T, ApiError>,
  options?: SafeRequestOptions
): T =>
  R.match(
    result,
    (value) => value,
    (error) => {
      notifyAboutError(error, options);
      throw error;
    }
  );

export const safeRequest = async <TResponse>(
  request: Promise<TResponse>,
  options?: SafeRequestOptions
): Promise<TResponse> => {
  const initialResult = await R.fromPromise(request);

  const checkedResult: Result<TResponse, ApiError> = pipe(
    initialResult,
    R.mapError(ApiError.fromUnknown)
  );

  return handleErrorAndThrow(checkedResult, options);
};

export const safeVoidRequest = async <TResponse>(
  request: Promise<TResponse>,
  options?: SafeRequestOptions
): Promise<Record<string, never>> => {
  const initialResult = await R.fromPromise(request);

  const checkedResult: Result<Record<string, never>, ApiError> = pipe(
    initialResult,
    R.mapError(ApiError.fromUnknown),
    R.flatMap(() => R.Ok<Record<string, never>>({}))
  );

  return handleErrorAndThrow(checkedResult, options);
};
