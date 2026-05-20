import { describe, expect, test } from 'vitest';

import { ApiError, ApiErrorType } from './api-error';
import { cleanParams } from './clean-params';
import { isNumber, isValueGreaterThanZero } from '../guards/is-number';
import { invariant } from '../invariant/invariant';
import { getHost } from '../url/get-host';

describe('api and guard helpers', () => {
  test('cleanParams removes empty values and serializes arrays', () => {
    expect(
      cleanParams({
        emptyArray: [],
        falseValue: false,
        ids: ['rose', '', null, 'lily'],
        nil: null,
        page: 2,
        search: 'rose',
        zero: 0,
      })
    ).toEqual({
      ids: 'rose,lily',
      page: '2',
      search: 'rose',
    });
  });

  test('getHost extracts host and throws ApiError for invalid URLs', () => {
    expect(getHost('https://example.com/path')).toBe('example.com');

    expect(() => getHost('not a url')).toThrow(
      expect.objectContaining({
        type: ApiErrorType.Validation,
      }) satisfies Partial<ApiError>
    );
  });

  test('invariant throws ApiError for string messages and custom errors as-is', () => {
    expect(() => invariant(false, 'Invalid state')).toThrow(
      expect.objectContaining({
        type: ApiErrorType.Validation,
        userMessage: 'Invalid state',
      }) satisfies Partial<ApiError>
    );

    const error = new Error('Custom');
    expect(() => invariant(false, error)).toThrow(error);
  });

  test('number guards accept finite positive numbers only where required', () => {
    expect(isNumber(1)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber('1')).toBe(false);
    expect(isValueGreaterThanZero(1)).toBe(true);
    expect(isValueGreaterThanZero(0)).toBe(false);
    expect(isValueGreaterThanZero(-1)).toBe(false);
  });
});
