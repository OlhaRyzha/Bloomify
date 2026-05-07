import { ApiError, ApiErrorType } from '../api/api-error';
import { isString } from '../guards/is-string';

export function invariant(
  condition: unknown,
  errorOrMessage: Error | string = 'Invariant failed'
): asserts condition {
  if (condition) return;

  if (isString(errorOrMessage)) {
    throw new ApiError(ApiErrorType.Validation, errorOrMessage);
  }
  throw errorOrMessage;
}
