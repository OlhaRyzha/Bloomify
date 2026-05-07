import type { FormikErrors, FormikTouched } from 'formik';
import { isString } from '../guards/is-string';

export function getFormFieldError<
  TValues extends object,
  TName extends keyof TValues,
>({
  errors,
  name,
  touched,
}: {
  errors: FormikErrors<TValues>;
  name: TName;
  touched: FormikTouched<TValues>;
}): string {
  const fieldError = errors[name];

  if (!touched[name] || !isString(fieldError)) {
    return '';
  }

  return fieldError;
}
