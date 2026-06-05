'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { TELEGRAM_BOT_URL } from '@/components/config/env';
import {
  selectCartItems,
  selectClearCart,
} from '@/features/cart/store/cart.selectors';
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
import {
  trackCheckoutStarted,
  trackCheckoutSubmitted,
  trackPaymentFailed,
  trackPurchaseCompleted,
} from '@/services/analytics/analytics.events';

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

const PENDING_LIQPAY_ORDER_KEY = 'bloomify.pendingLiqPayOrderId';
const PAYMENT_STATUS_SYNC_RETRY_LIMIT = 5;
const PAYMENT_STATUS_SYNC_RETRY_DELAY_MS = 1500;

type PaymentReturnSyncState = 'idle' | 'syncing';

const getOrderIdFromCheckoutSearch = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const orderId = Number(
    new URLSearchParams(window.location.search).get('orderId')
  );

  return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
};

export const buildTelegramOrderTrackingUrl = (
  botUrl: string,
  orderId: number
) => {
  const normalizedBotUrl = botUrl.trim();
  if (!normalizedBotUrl) return null;

  const urlCandidate = normalizedBotUrl.startsWith('@')
    ? `https://t.me/${normalizedBotUrl.slice(1)}`
    : normalizedBotUrl.startsWith('http://') ||
        normalizedBotUrl.startsWith('https://')
      ? normalizedBotUrl
      : `https://t.me/${normalizedBotUrl}`;

  try {
    const url = new URL(urlCandidate);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    if (['t.me', 'telegram.me'].includes(url.hostname)) {
      const botUsername = url.pathname.replace(/^\/@?/, '').replace(/\/$/, '');
      if (!botUsername) return null;

      url.pathname = `/${botUsername}`;
    }

    url.searchParams.set('start', `order_${orderId}`);

    return url.toString();
  } catch {
    return null;
  }
};

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
  const clearCart = useCartStore(selectClearCart);
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
  const trackedBeginCheckoutRef = useRef(false);
  const syncedPaymentOrderRef = useRef<number | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);
  const [completedOrderMessage, setCompletedOrderMessage] = useState<
    string | null
  >(null);
  const [completedPaymentStatusLabel, setCompletedPaymentStatusLabel] =
    useState<string | null>(null);
  const [paymentReturnSyncState, setPaymentReturnSyncState] =
    useState<PaymentReturnSyncState>('idle');
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

  useEffect(() => {
    if (!isHydrated || !isNonEmptyArray(summary.cartItems)) {
      return;
    }

    if (trackedBeginCheckoutRef.current) {
      return;
    }

    trackedBeginCheckoutRef.current = true;
    trackCheckoutStarted({
      itemCount: summary.itemCount,
      value: summary.total,
      locale,
    });
  }, [isHydrated, locale, summary.cartItems, summary.itemCount, summary.total]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const rawOrderId = window.localStorage.getItem(PENDING_LIQPAY_ORDER_KEY);
    const storedOrderId = Number(rawOrderId);
    const searchOrderId = getOrderIdFromCheckoutSearch();
    const orderId =
      searchOrderId ??
      (Number.isInteger(storedOrderId) && storedOrderId > 0
        ? storedOrderId
        : null);

    if (!orderId || syncedPaymentOrderRef.current === orderId) {
      return;
    }

    syncedPaymentOrderRef.current = orderId;
    setPaymentReturnSyncState('syncing');

    const syncPaymentStatus = async (attempt = 0) => {
      try {
        const response = await CheckoutService.syncPaymentStatus(orderId);

        if (response.paymentStatus === 'paid') {
          window.localStorage.removeItem(PENDING_LIQPAY_ORDER_KEY);
          if (summary.itemCount > 0) {
            trackPurchaseCompleted({
              itemCount: summary.itemCount,
              orderId: String(response.orderId),
              paymentMethod: response.paymentMethod,
              value: summary.total,
              locale,
            });
          }
          setCompletedOrderId(response.orderId);
          setCompletedOrderMessage(
            t('checkout_submit_paid_status', { orderId: response.orderId })
          );
          setCompletedPaymentStatusLabel(
            t('checkout_success_payment_status_paid')
          );
          setPaymentReturnSyncState('idle');
          clearCart();
        } else if (response.paymentStatus === 'failed') {
          window.localStorage.removeItem(PENDING_LIQPAY_ORDER_KEY);
          setCompletedOrderId(null);
          setCompletedOrderMessage(null);
          setCompletedPaymentStatusLabel(null);
          setPaymentReturnSyncState('idle');
        } else if (attempt < PAYMENT_STATUS_SYNC_RETRY_LIMIT) {
          window.setTimeout(() => {
            syncPaymentStatus(attempt + 1);
          }, PAYMENT_STATUS_SYNC_RETRY_DELAY_MS);
        } else {
          setPaymentReturnSyncState('idle');
        }
      } catch {
        setCompletedOrderMessage(null);
        setCompletedPaymentStatusLabel(null);
        setPaymentReturnSyncState('idle');
        syncedPaymentOrderRef.current = null;
      }
    };

    syncPaymentStatus();
  }, [
    clearCart,
    isHydrated,
    locale,
    summary.cartItems,
    summary.itemCount,
    summary.total,
    t,
  ]);

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

  if (completedOrderMessage) {
    const telegramOrderTrackingUrl =
      TELEGRAM_BOT_URL && completedOrderId
        ? buildTelegramOrderTrackingUrl(TELEGRAM_BOT_URL, completedOrderId)
        : null;

    return (
      <FeedbackState
        title={t('checkout_order_success_title')}
        description={completedOrderMessage}
        actionLabel={
          telegramOrderTrackingUrl
            ? t('checkout_success_telegram_cta')
            : t('checkout_success_cta')
        }
        actionHref={
          telegramOrderTrackingUrl || getLocalizedPath('/catalog', locale)
        }
        actionRel={telegramOrderTrackingUrl ? 'noopener noreferrer' : undefined}
        actionTarget={telegramOrderTrackingUrl ? '_blank' : undefined}
        secondaryActionLabel={
          telegramOrderTrackingUrl ? t('checkout_success_cta') : undefined
        }
        secondaryActionHref={
          telegramOrderTrackingUrl
            ? getLocalizedPath('/catalog', locale)
            : undefined
        }
        className='bg-gradient-card shadow-card'>
        {completedOrderId ? (
          <dl className='mx-auto grid max-w-sm gap-3 rounded-xl border border-border bg-background/70 p-4 text-left text-sm sm:grid-cols-2'>
            <div>
              <dt className='text-muted-foreground'>
                {t('checkout_success_order_label')}
              </dt>
              <dd className='mt-1 font-semibold text-foreground'>
                #{completedOrderId}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>
                {t('checkout_success_payment_status_label')}
              </dt>
              <dd className='mt-1 font-semibold text-primary'>
                {completedPaymentStatusLabel}
              </dd>
            </div>
          </dl>
        ) : null}
      </FeedbackState>
    );
  }

  if (paymentReturnSyncState === 'syncing') {
    return (
      <FeedbackState
        title={t('checkout_payment_sync_title')}
        description={t('checkout_payment_sync_description')}
        className='bg-gradient-card shadow-card'
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
        setCompletedOrderId(null);
        setCompletedPaymentStatusLabel(null);
        trackCheckoutSubmitted({
          itemCount: summary.itemCount,
          paymentMethod: values.paymentMethod,
          value: summary.total,
          locale,
        });

        try {
          const response = await CheckoutService.createCheckout({
            customerName: values.customerName,
            email: values.email,
            phone: values.phone,
            city: values.city,
            address: values.address,
            deliveryNote: values.deliveryNote,
            locale,
            paymentMethod: values.paymentMethod,
            items: cartItems.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
          });

          if (response.liqpay) {
            const message = t('checkout_submit_liqpay_redirect');

            window.localStorage.setItem(
              PENDING_LIQPAY_ORDER_KEY,
              String(response.orderId)
            );
            actions.setStatus(message);
            submitLiqPayCheckout(response.liqpay);
            return;
          }

          trackPurchaseCompleted({
            itemCount: summary.itemCount,
            orderId: String(response.orderId),
            paymentMethod: response.paymentMethod,
            value: summary.total,
            locale,
          });
          const message = t('checkout_submit_cash_status');

          setCompletedOrderId(response.orderId);
          setCompletedPaymentStatusLabel(
            t('checkout_success_payment_status_cash_on_delivery')
          );
          clearCart();
          setCompletedOrderMessage(message);
          actions.setStatus(message);
        } catch (error) {
          const apiError = ApiError.fromUnknown(error);
          trackPaymentFailed({
            paymentMethod: values.paymentMethod,
            reason: apiError.type,
            locale,
          });
          actions.setStatus(apiError.userMessage);
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
                {values.paymentMethod ===
                CHECKOUT_PAYMENT_METHODS.CASH_ON_DELIVERY
                  ? t('checkout_place_order_button')
                  : t('checkout_pay_button')}
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
