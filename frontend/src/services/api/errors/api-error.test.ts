import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { apiErrorMessages, validationMessages } from '@/constants/message.constants';

import { ApiError, ApiErrorType } from './api-error';

const createAxiosError = ({
  code,
  data,
  message = 'Request failed',
  status,
}: {
  code?: string;
  data?: unknown;
  message?: string;
  status?: number;
}) => {
  const response: AxiosResponse<unknown> | undefined =
    status === undefined
      ? undefined
      : ({
          config: {},
          data,
          headers: {},
          status,
          statusText: 'Error',
        } as AxiosResponse<unknown>);

  return new AxiosError(message, code, undefined, undefined, response);
};

describe('ApiError', () => {
  test.each([
    [400, ApiErrorType.BadRequest],
    [401, ApiErrorType.Unauthorized],
    [403, ApiErrorType.Forbidden],
    [404, ApiErrorType.NotFound],
    [408, ApiErrorType.Timeout],
    [409, ApiErrorType.Conflict],
    [422, ApiErrorType.Validation],
    [429, ApiErrorType.Client],
    [500, ApiErrorType.Server],
    [502, ApiErrorType.Server],
    [503, ApiErrorType.Server],
    [504, ApiErrorType.Server],
  ])('maps status %s to %s', (status, expectedType) => {
    expect(
      ApiError.fromAxios(
        createAxiosError({
          data: { error: `Status ${status}` },
          status,
        })
      )
    ).toEqual(
      expect.objectContaining({
        type: expectedType,
        userMessage: `Status ${status}`,
      })
    );
  });

  test('maps unknown 4xx and 5xx statuses to generic client/server errors', () => {
    expect(ApiError.fromAxios(createAxiosError({ status: 418 }))).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Client,
        userMessage: `${apiErrorMessages.clientError} (418)`,
      })
    );

    expect(ApiError.fromAxios(createAxiosError({ status: 599 }))).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Server,
        userMessage: `${apiErrorMessages.serverErrorStatus} (599)`,
      })
    );
  });

  test('maps timeout and network errors', () => {
    expect(
      ApiError.fromAxios(
        createAxiosError({ code: 'ECONNABORTED', status: undefined })
      )
    ).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Timeout,
        userMessage: apiErrorMessages.timeout,
      })
    );

    expect(
      ApiError.fromAxios(
        createAxiosError({
          message: 'Network Error',
          status: undefined,
        })
      )
    ).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Network,
        userMessage: 'Network Error',
      })
    );
  });

  test('normalizes zod, Error, and unknown values', () => {
    const zodResult = z.string().safeParse(123);
    if (zodResult.success) throw new Error('Expected zod validation to fail');

    expect(ApiError.fromUnknown(zodResult.error)).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Validation,
        userMessage: validationMessages.zodError,
      })
    );

    expect(ApiError.fromUnknown(new Error('Unexpected'))).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Unknown,
        userMessage: 'Unexpected',
      })
    );

    expect(ApiError.fromUnknown(null)).toEqual(
      expect.objectContaining({
        type: ApiErrorType.Unknown,
        userMessage: validationMessages.unknownError,
      })
    );
  });
});
