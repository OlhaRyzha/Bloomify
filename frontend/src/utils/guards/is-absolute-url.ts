import { ABSOLUTE_URL_REGEX } from '../patterns/regex';
import { isString } from './is-string';

export const isAbsoluteUrl = (url?: unknown): url is string =>
  isString(url) && ABSOLUTE_URL_REGEX.test(url);
