import {
  apiErrorMessages,
  technicalMessages,
} from '@/constants/message.constants';
import axios, { isAxiosError } from 'axios';
import { ZodError } from 'zod';

export enum ApiErrorType {
  Validation = 'validation_error',
  BadRequest = 'bad_request',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  Timeout = 'timeout',
  Server = 'server_error',
  Network = 'network_error',
  Unknown = 'unknown_error',
  Conflict = 'conflict',
  Client = 'client_error',
}

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public userMessage: string,
    public details?: unknown
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }

  static fromAxios(error: unknown): ApiError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      const map: Record<number, [ApiErrorType, string]> = {
        400: [
          ApiErrorType.BadRequest,
          data?.error ?? apiErrorMessages.badRequest,
        ],
        401: [
          ApiErrorType.Unauthorized,
          data?.error ?? apiErrorMessages.unauthorized,
        ],
        403: [
          ApiErrorType.Forbidden,
          data?.error ?? apiErrorMessages.forbidden,
        ],
        404: [ApiErrorType.NotFound, data?.error ?? apiErrorMessages.notFound],
        408: [ApiErrorType.Timeout, data?.error ?? apiErrorMessages.timeout],
        409: [ApiErrorType.Conflict, data?.error ?? apiErrorMessages.conflict],
        413: [
          ApiErrorType.Client,
          data?.error ?? apiErrorMessages.payloadTooLarge,
        ],
        415: [
          ApiErrorType.Client,
          data?.error ?? apiErrorMessages.unsupportedMediaType,
        ],
        422: [
          ApiErrorType.Validation,
          data?.error ?? apiErrorMessages.validationError,
        ],
        429: [
          ApiErrorType.Client,
          data?.error ?? apiErrorMessages.tooManyRequests,
        ],
        500: [ApiErrorType.Server, data?.error ?? apiErrorMessages.serverError],
        502: [ApiErrorType.Server, data?.error ?? apiErrorMessages.badGateway],
        503: [
          ApiErrorType.Server,
          data?.error ?? apiErrorMessages.serviceUnavailable,
        ],
        504: [
          ApiErrorType.Server,
          data?.error ?? apiErrorMessages.gatewayTimeout,
        ],
      };

      if (status && map[status]) {
        const [type, msg] = map[status];
        return new ApiError(type, msg, data);
      }

      if (status && status >= 400 && status < 500) {
        return new ApiError(
          ApiErrorType.Client,
          data?.error ?? `${apiErrorMessages.clientError} (${status})`,
          data
        );
      }

      if (status && status >= 500) {
        return new ApiError(
          ApiErrorType.Server,
          data?.error ?? `${apiErrorMessages.serverErrorStatus} (${status})`,
          data
        );
      }

      if (error.code === 'ECONNABORTED') {
        return new ApiError(
          ApiErrorType.Timeout,
          apiErrorMessages.timeout,
          data
        );
      }

      return new ApiError(ApiErrorType.Network, error.message, data);
    }

    return new ApiError(ApiErrorType.Unknown, technicalMessages.unknownError);
  }

  static fromZod(zodErr: ZodError): ApiError {
    return new ApiError(
      ApiErrorType.Validation,
      technicalMessages.zodError,
      zodErr.issues
    );
  }

  static fromUnknown(err: unknown): ApiError {
    if (axios.isAxiosError(err)) return ApiError.fromAxios(err);
    if (err instanceof ZodError) return ApiError.fromZod(err);
    if (err instanceof Error)
      return new ApiError(ApiErrorType.Unknown, err.message);
    return new ApiError(ApiErrorType.Unknown, technicalMessages.unknownError);
  }
}
