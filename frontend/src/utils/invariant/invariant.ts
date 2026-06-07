import { ApiError, ApiErrorType } from '../../services/api/errors/api-error';
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
