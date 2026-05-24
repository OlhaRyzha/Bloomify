'use client';

import {
  useEffect,
  useMemo,
  type ChangeEvent,
  type FocusEvent,
} from 'react';
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
import FeedbackState from '@/components/ui/feedback-state';
import { Input } from '@/components/ui/input';
import SurfacePanel from '@/components/ui/surface-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useHydrated } from '@/hooks/use-hydrated';
import { getLocalizedPath } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { formatCurrency } from '@/utils/i18n';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { ApiError } from '@/utils/api/api-error';
import { selectCartItems } from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { getCartSummary } from '@/features/cart/cart.helpers';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { checkoutInitialValues } from './forms/checkout-form.config';
import CheckoutLoadingState from './checkout-loading-state';
import {
  CHECKOUT_PAYMENT_METHODS,
  createCheckoutSchema,
  type CheckoutFormValues,
  type CheckoutPaymentMethod,
} from './forms/checkout-form.schemas';
import CheckoutService from './api/checkout.service';
import type { LiqPayCheckoutPayload } from './api/checkout.service';
import { useCheckoutDraftStore } from './store/checkout-draft.store';
import type { CheckoutDraftState } from './store/checkout-draft.store';
import {
  selectCheckoutDeliveryDraft,
  selectSetCheckoutDeliveryDraft,
} from './store/checkout-draft.selectors';

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

function submitLiqPayCheckout(payload: LiqPayCheckoutPayload) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payload.checkoutUrl;

  const dataInput = document.createElement('input');
  dataInput.type = 'hidden';
  dataInput.name = 'data';
  dataInput.value = payload.data;

  const signatureInput = document.createElement('input');
  signatureInput.type = 'hidden';
  signatureInput.name = 'signature';
  signatureInput.value = payload.signature;

  form.append(dataInput, signatureInput);
  document.body.append(form);
  form.submit();
}

function CheckoutDraftPersistence({
  setDeliveryDraft,
  values,
}: {
  setDeliveryDraft: CheckoutDraftState['setDeliveryDraft'];
  values: CheckoutFormValues;
}) {
  const {
    address,
    city,
    customerName,
    deliveryNote = '',
    email,
    phone,
  } = values;

  useEffect(() => {
    setDeliveryDraft({
      address,
      city,
      customerName,
      deliveryNote,
      email,
      phone,
    });
  }, [
    address,
    city,
    customerName,
    deliveryNote,
    email,
    phone,
    setDeliveryDraft,
  ]);

  return null;
}

export default function CheckoutFeature() {
  const isHydrated = useHydrated();
  const cartItems = useCartStore(useShallow(selectCartItems));
  const deliveryDraft = useCheckoutDraftStore(selectCheckoutDeliveryDraft);
  const setDeliveryDraft = useCheckoutDraftStore(selectSetCheckoutDeliveryDraft);
  const {
    data: catalogItems = [],
    isError,
    isLoading,
    refetch,
  } = useGetProducts();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const checkoutSchema = useMemo(
    () =>
      createCheckoutSchema({
        address: t('checkout_validation_address_required'),
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

  if (!isHydrated || isLoading) {
    return <CheckoutLoadingState />;
  }

  if (isError) {
    return (
      <FeedbackState
        tone='error'
        title={t('checkout_error_title')}
        description={t('checkout_error_description')}
        actionLabel={t('common_try_again')}
        onAction={async () => {
          await refetch();
        }}
      />
    );
  }

  if (!isNonEmptyArray(summary.cartItems)) {
    return (
      <FeedbackState
        title={t('checkout_empty_title')}
        description={t('checkout_empty_description')}
        actionLabel={t('checkout_empty_cta')}
        actionHref={getLocalizedPath('/catalog', locale)}
        className='bg-gradient-card shadow-card'
      />
    );
  }

  return (
    <Formik<CheckoutFormValues>
      initialValues={{
        ...checkoutInitialValues,
        ...deliveryDraft,
      }}
      validate={(values) => validateWithZod(checkoutSchema, values)}
      onSubmit={async (values, actions) => {
        actions.setStatus(undefined);

        try {
          const response = await CheckoutService.createCheckout({
            customerName: values.customerName,
            email: values.email,
            phone: values.phone,
            city: values.city,
            address: values.address,
            deliveryNote: values.deliveryNote,
            paymentMethod: values.paymentMethod,
            items: cartItems.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
          });

          if (response.liqpay) {
            actions.setStatus(t('checkout_submit_liqpay_redirect'));
            submitLiqPayCheckout(response.liqpay);
            return;
          }

          actions.setStatus(t('checkout_submit_cash_status'));
        } catch (error) {
          actions.setStatus(ApiError.fromUnknown(error).userMessage);
        } finally {
          actions.setSubmitting(false);
        }
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
          <CheckoutDraftPersistence
            values={values}
            setDeliveryDraft={setDeliveryDraft}
          />
          <div className='space-y-6'>
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
            </SurfacePanel>

            <SurfacePanel
              className='space-y-5'
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
            </SurfacePanel>
          </div>

          <aside className='space-y-6'>
            <SurfacePanel aria-labelledby='checkout-summary-title'>
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
            </SurfacePanel>
          </aside>
        </Form>
      )}
    </Formik>
  );
}
