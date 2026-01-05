import { isObject } from './is-object';
import { isArray } from './is-array';
import { IdType } from '@/types/ids';

export function hasId<T extends { id?: IdType }>(data: unknown): data is T {
  return isObject(data) && !isArray(data) && 'id' in data;
}
