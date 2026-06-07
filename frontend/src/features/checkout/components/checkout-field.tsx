import type { ChangeEvent, FocusEvent } from 'react';
import type { FormikErrors, FormikTouched } from 'formik';

import { Input } from '@/components/ui/input';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';

import type { CheckoutFormValues } from '../forms/checkout-form.schemas';

type CheckoutFieldName = keyof CheckoutFormValues;

type CheckoutFieldProps = {
  autoComplete?: string;
  label: string;
  name: CheckoutFieldName;
  placeholder: string;
  type?: string;
  values: CheckoutFormValues;
  errors: FormikErrors<CheckoutFormValues>;
  touched: FormikTouched<CheckoutFormValues>;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function CheckoutField({
  autoComplete,
  errors,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  touched,
  type = 'text',
  values,
}: CheckoutFieldProps) {
  const errorMessage = getFormFieldError({
    errors,
    name,
    touched,
  });
  const errorId = `${name}-error`;

  return (
    <div>
      <label
        htmlFor={name}
        className='mb-2 block text-sm font-medium text-foreground'>
        {label}
      </label>

      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={String(values[name] ?? '')}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? errorId : undefined}
        className='h-11 bg-background'
      />

      {errorMessage && (
        <p
          id={errorId}
          className='mt-2 text-xs font-medium text-destructive'>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
