import { z } from 'zod';

import { isString } from '../guards/is-string';

export const trimmedString = () => z.string().trim();

export const optionalTrimmedString = () =>
  z.preprocess(
    (value) => (isString(value) && value.trim() === '' ? undefined : value),
    trimmedString().optional()
  );
