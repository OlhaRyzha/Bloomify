import { isArray } from './is-array';

export function isNonEmptyArray(value: unknown): value is (string | number)[] {
  return isArray(value) && value.length > 0;
}
