import type { ChangeEvent, FocusEvent } from 'react';
import type { FormikErrors, FormikTouched } from 'formik';
import { MapPin } from 'lucide-react';

import SurfacePanel from '@/components/ui/surface-panel';

import CheckoutField from './checkout-field';
import type { CheckoutFormValues } from '../forms/checkout-form.schemas';

type CheckoutContactSectionProps = {
  errors: FormikErrors<CheckoutFormValues>;
  touched: FormikTouched<CheckoutFormValues>;
  values: CheckoutFormValues;
  t: (key: string) => string;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function CheckoutContactSection({
  errors,
  onBlur,
  onChange,
  t,
  touched,
  values,
}: CheckoutContactSectionProps) {
  return (
    <SurfacePanel
      className='space-y-5'
      aria-labelledby='checkout-contact-title'>
      <div className='flex items-center gap-3'>
        <MapPin
          className='h-5 w-5 text-primary'
          aria-hidden
        />
        <h2
          id='checkout-contact-title'
          className='font-display text-2xl font-semibold'>
          {t('checkout_contact_title')}
        </h2>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <CheckoutField
          name='customerName'
          label={t('label_full_name')}
          placeholder={t('placeholder_full_name')}
          autoComplete='name'
          values={values}
          errors={errors}
          touched={touched}
          onChange={onChange}
          onBlur={onBlur}
        />
        <CheckoutField
          name='phone'
          label={t('checkout_field_phone')}
          placeholder={t('checkout_field_phone_placeholder')}
          autoComplete='tel'
          values={values}
          errors={errors}
          touched={touched}
          onChange={onChange}
          onBlur={onBlur}
        />
        <CheckoutField
          name='email'
          label={t('label_email')}
          placeholder={t('placeholder_email')}
          type='email'
          autoComplete='email'
          values={values}
          errors={errors}
          touched={touched}
          onChange={onChange}
          onBlur={onBlur}
        />
        <CheckoutField
          name='city'
          label={t('checkout_field_city')}
          placeholder={t('checkout_field_city_placeholder')}
          autoComplete='address-level2'
          values={values}
          errors={errors}
          touched={touched}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>

      <CheckoutField
        name='address'
        label={t('checkout_field_address')}
        placeholder={t('checkout_field_address_placeholder')}
        autoComplete='street-address'
        values={values}
        errors={errors}
        touched={touched}
        onChange={onChange}
        onBlur={onBlur}
      />

      <CheckoutField
        name='deliveryNote'
        label={t('checkout_field_note')}
        placeholder={t('checkout_field_note_placeholder')}
        values={values}
        errors={errors}
        touched={touched}
        onChange={onChange}
        onBlur={onBlur}
      />
    </SurfacePanel>
  );
}
