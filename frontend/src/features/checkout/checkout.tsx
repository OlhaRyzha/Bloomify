'use client';

import { useMemo, type ChangeEvent, type FocusEvent } from 'react';
import Link from 'next/link';
import { Form, Formik } from 'formik';
import {
  Apple,
  BadgeCheck,
  CreditCard,
  MapPin,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useHydrated } from '@/hooks/use-hydrated';
import { getLocalizedPath } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { formatCurrency } from '@/utils/i18n';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { selectCartItems } from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { getCartSummary } from '@/features/cart/cart.helpers';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { checkoutInitialValues } from './forms/checkout-form.config';
import {
  CHECKOUT_PAYMENT_METHODS,
  createCheckoutSchema,
  type CheckoutFormValues,
  type CheckoutPaymentMethod,
} from './forms/checkout-form.schemas';

type PaymentOption = {
  descriptionKey: string;
  icon: typeof Apple;
  id: CheckoutPaymentMethod;
  titleKey: string;
};

const paymentOptions: PaymentOption[] = [
  {
    id: CHECKOUT_PAYMENT_METHODS.APPLE_PAY,
    icon: Apple,
    titleKey: 'checkout_payment_apple_pay_title',
    descriptionKey: 'checkout_payment_apple_pay_description',
  },
  {
    id: CHECKOUT_PAYMENT_METHODS.GOOGLE_PAY,
    icon: Smartphone,
    titleKey: 'checkout_payment_google_pay_title',
    descriptionKey: 'checkout_payment_google_pay_description',
  },
  {
    id: CHECKOUT_PAYMENT_METHODS.CARD,
    icon: CreditCard,
    titleKey: 'checkout_payment_card_title',
    descriptionKey: 'checkout_payment_card_description',
  },
  {
    id: CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY,
    icon: WalletCards,
    titleKey: 'checkout_payment_cash_title',
    descriptionKey: 'checkout_payment_cash_description',
  },
];

type CheckoutFieldName = keyof CheckoutFormValues;

type CheckoutFieldProps = {
  autoComplete?: string;
  label: string;
  name: CheckoutFieldName;
  placeholder: string;
  type?: string;
  values: CheckoutFormValues;
  errors: Record<string, string | undefined>;
  touched: Record<string, boolean | undefined>;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function CheckoutField({
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
    <div className='space-y-3'>
      <label
        htmlFor={name}
        className='text-sm font-medium text-foreground'>
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
          className='text-xs font-medium text-destructive'>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default function CheckoutFeature() {
  const isHydrated = useHydrated();
  const cartItems = useCartStore(useShallow(selectCartItems));
  const { data: catalogItems = [], isLoading } = useGetProducts();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const checkoutSchema = useMemo(
    () =>
      createCheckoutSchema({
        address: t('checkout_validation_address_required'),
        cardCvc: t('checkout_validation_card_cvc_required'),
        cardExpiry: t('checkout_validation_card_expiry_required'),
        cardNumber: t('checkout_validation_card_number_required'),
        city: t('checkout_validation_city_required'),
        email: t('checkout_validation_email_required'),
        invalidEmail: t('checkout_validation_email_invalid'),
        minName: t('checkout_validation_name_min'),
        name: t('checkout_validation_name_required'),
        phone: t('checkout_validation_phone_required'),
      }),
    [t]
  );

  const summary = useMemo(() => {
    if (!isHydrated) {
      return getCartSummary([], []);
    }

    return getCartSummary(cartItems, catalogItems);
  }, [cartItems, catalogItems, isHydrated]);

  if (!isHydrated) {
    return null;
  }

  if (!isLoading && !isNonEmptyArray(summary.cartItems)) {
    return (
      <section
        className='rounded-2xl bg-gradient-card p-10 text-center shadow-card'
        aria-labelledby='checkout-empty-title'>
        <h2
          id='checkout-empty-title'
          className='font-display mb-3 text-2xl font-bold'>
          {t('checkout_empty_title')}
        </h2>
        <p className='mb-6 text-sm text-muted-foreground'>
          {t('checkout_empty_description')}
        </p>
        <Button
          asChild
          size='lg'>
          <Link href={getLocalizedPath('/catalog', locale)}>
            {t('checkout_empty_cta')}
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <Formik<CheckoutFormValues>
      initialValues={checkoutInitialValues}
      validate={(values) => validateWithZod(checkoutSchema, values)}
      onSubmit={(_, actions) => {
        actions.setStatus(t('checkout_submit_status'));
        actions.setSubmitting(false);
      }}>
      {({
        errors,
        handleBlur,
        handleChange,
        isSubmitting,
        setFieldValue,
        status,
        touched,
        values,
      }) => (
        <Form className='grid gap-8 lg:grid-cols-[1.4fr_0.9fr]'>
          <div className='space-y-6'>
            <section
              className='space-y-5 rounded-3xl bg-gradient-card p-6 shadow-card'
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
                  label={t('checkout_field_name')}
                  placeholder={t('checkout_field_name_placeholder')}
                  autoComplete='name'
                  values={values}
                  errors={errors}
                  touched={touched}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <CheckoutField
                  name='phone'
                  label={t('checkout_field_phone')}
                  placeholder={t('checkout_field_phone_placeholder')}
                  autoComplete='tel'
                  values={values}
                  errors={errors}
                  touched={touched}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <CheckoutField
                  name='email'
                  label={t('checkout_field_email')}
                  placeholder={t('checkout_field_email_placeholder')}
                  type='email'
                  autoComplete='email'
                  values={values}
                  errors={errors}
                  touched={touched}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <CheckoutField
                  name='city'
                  label={t('checkout_field_city')}
                  placeholder={t('checkout_field_city_placeholder')}
                  autoComplete='address-level2'
                  values={values}
                  errors={errors}
                  touched={touched}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <CheckoutField
                name='deliveryNote'
                label={t('checkout_field_note')}
                placeholder={t('checkout_field_note_placeholder')}
                values={values}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </section>

            <section
              className='space-y-5 rounded-3xl bg-gradient-card p-6 shadow-card'
              aria-labelledby='checkout-payment-title'>
              <div className='flex items-center gap-3'>
                <ShieldCheck
                  className='h-5 w-5 text-primary'
                  aria-hidden
                />
                <h2
                  id='checkout-payment-title'
                  className='font-display text-2xl font-semibold'>
                  {t('checkout_payment_title')}
                </h2>
              </div>

              <fieldset className='grid gap-3'>
                <legend className='sr-only'>{t('checkout_payment_title')}</legend>
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = values.paymentMethod === option.id;

                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-4 rounded-2xl border bg-background/70 p-4 transition',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      )}>
                      <input
                        type='radio'
                        name='paymentMethod'
                        value={option.id}
                        checked={isSelected}
                        onChange={() =>
                          setFieldValue('paymentMethod', option.id)
                        }
                        className='mt-1 h-4 w-4 accent-primary'
                      />
                      <Icon
                        className='mt-0.5 h-5 w-5 text-primary'
                        aria-hidden
                      />
                      <span className='flex-1'>
                        <span className='flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground'>
                          {t(option.titleKey)}
                        </span>
                        <span className='mt-1 block text-sm text-muted-foreground'>
                          {t(option.descriptionKey)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              {values.paymentMethod === CHECKOUT_PAYMENT_METHODS.CARD && (
                <div className='grid gap-6 rounded-2xl border border-border bg-background/70 p-4 md:grid-cols-2'>
                  <div className='md:col-span-2'>
                    <CheckoutField
                      name='cardNumber'
                      label={t('checkout_field_card_number')}
                      placeholder='4242 4242 4242 4242'
                      autoComplete='cc-number'
                      values={values}
                      errors={errors}
                      touched={touched}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  <CheckoutField
                    name='cardExpiry'
                    label={t('checkout_field_card_expiry')}
                    placeholder='12/30'
                    autoComplete='cc-exp'
                    values={values}
                    errors={errors}
                    touched={touched}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <CheckoutField
                    name='cardCvc'
                    label={t('checkout_field_card_cvc')}
                    placeholder='123'
                    autoComplete='cc-csc'
                    values={values}
                    errors={errors}
                    touched={touched}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              )}
            </section>
          </div>

          <aside className='space-y-6'>
            <section
              className='rounded-3xl bg-gradient-card p-6 shadow-card'
              aria-labelledby='checkout-summary-title'>
              <h2
                id='checkout-summary-title'
                className='font-display text-2xl font-semibold'>
                {t('checkout_summary_title')}
              </h2>

              <ul className='mt-5 space-y-4'>
                {summary.cartItems.map((item) => (
                  <li
                    key={item.id}
                    className='flex items-start justify-between gap-4 text-sm'>
                    <div>
                      <p className='font-semibold text-foreground'>
                        {item.name}
                      </p>
                      <p className='text-muted-foreground'>
                        {item.quantity} x {formatCurrency(item.price, locale)}
                      </p>
                    </div>
                    <p className='font-semibold text-foreground'>
                      {formatCurrency(item.price * item.quantity, locale)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className='mt-6 space-y-3 border-t border-border pt-5 text-sm'>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>{t('cart_bouquet_cost')}</span>
                  <span>{formatCurrency(summary.subtotal, locale)}</span>
                </div>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>{t('cart_delivery')}</span>
                  <span>
                    {summary.deliveryCost === 0
                      ? t('common_free')
                      : formatCurrency(summary.deliveryCost, locale)}
                  </span>
                </div>
                <div className='flex items-center justify-between pt-2 text-base font-semibold text-foreground'>
                  <span>{t('cart_total')}</span>
                  <span className='font-display text-2xl text-primary'>
                    {formatCurrency(summary.total, locale)}
                  </span>
                </div>
              </div>

              {status && (
                <p
                  role='status'
                  className='mt-4 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground'>
                  {status}
                </p>
              )}

              <Button
                type='submit'
                size='lg'
                className='mt-6 w-full'
                disabled={isSubmitting || isLoading}>
                {t('checkout_pay_button')}
              </Button>

              <p className='mt-4 flex items-start gap-2 text-xs text-muted-foreground'>
                <BadgeCheck
                  className='mt-0.5 h-4 w-4 flex-shrink-0 text-primary'
                  aria-hidden
                />
                {t('checkout_security_note')}
              </p>
            </section>
          </aside>
        </Form>
      )}
    </Formik>
  );
}
