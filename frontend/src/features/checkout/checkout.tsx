'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Form, Formik } from 'formik';
import { useShallow } from 'zustand/react/shallow';

import FeedbackState from '@/components/ui/feedback-state';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useHydrated } from '@/hooks/use-hydrated';
import { getLocalizedPath } from '@/i18n/routing';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import {
  selectCartItems,
  selectClearCart,
} from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { getCartSummary } from '@/features/cart/cart.helpers';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';
import { trackCheckoutStarted } from '@/services/analytics/analytics.events';

import { checkoutInitialValues } from './forms/checkout-form.config';
import CheckoutLoadingState from './components/checkout-loading-state';
import {
  createCheckoutSchema,
  type CheckoutFormValues,
} from './forms/checkout-form.schemas';
import { useCheckoutDraftStore } from './store/checkout-draft.store';
import {
  selectCheckoutDeliveryDraft,
  selectSetCheckoutDeliveryDraft,
} from './store/checkout-draft.selectors';
import CheckoutDraftPersistence from './components/checkout-draft-persistence';
import CheckoutContactSection from './components/checkout-contact-section';
import CheckoutPaymentSection from './components/checkout-payment-section';
import CheckoutSummaryPanel from './components/checkout-summary-panel';
import CheckoutSuccessState from './components/checkout-success-state';
import { useCheckoutPaymentSync } from './hooks/use-checkout-payment-sync';
import { useCheckoutSubmit } from './hooks/use-checkout-submit';

export default function CheckoutFeature() {
  const isHydrated = useHydrated();

  const cartItems = useCartStore(useShallow(selectCartItems));
  const clearCart = useCartStore(selectClearCart);

  const deliveryDraft = useCheckoutDraftStore(selectCheckoutDeliveryDraft);
  const setDeliveryDraft = useCheckoutDraftStore(
    selectSetCheckoutDeliveryDraft
  );

  const {
    data: catalogItems = [],
    isError,
    isLoading,
    refetch,
  } = useGetProducts();

  const { t } = useTranslation();
  const { locale } = useLocale();

  const trackedBeginCheckoutRef = useRef(false);

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

  const {
    completedOrderId,
    completedOrderMessage,
    completedPaymentStatusLabel,
    completeOrder,
    paymentReturnSyncState,
    resetCompletedOrderState,
  } = useCheckoutPaymentSync({
    clearCart,
    isHydrated,
    locale,
    summary,
    t,
  });

  const handleSubmit = useCheckoutSubmit({
    cartItems,
    clearCart,
    completeOrder,
    locale,
    resetCompletedOrderState,
    summary,
    t,
  });

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
    return (
      <CheckoutSuccessState
        completedOrderId={completedOrderId}
        completedOrderMessage={completedOrderMessage}
        completedPaymentStatusLabel={completedPaymentStatusLabel}
        locale={locale}
        t={t}
      />
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
      onSubmit={handleSubmit}>
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
            <CheckoutContactSection
              errors={errors}
              touched={touched}
              values={values}
              t={t}
              onBlur={handleBlur}
              onChange={handleChange}
            />

            <CheckoutPaymentSection
              paymentMethod={values.paymentMethod}
              t={t}
              onPaymentMethodChange={(paymentMethod) => {
                void setFieldValue('paymentMethod', paymentMethod);
              }}
            />
          </div>

          <aside className='space-y-6'>
            <CheckoutSummaryPanel
              cartItems={summary.cartItems}
              deliveryCost={summary.deliveryCost}
              isLoading={isLoading}
              isSubmitting={isSubmitting}
              locale={locale}
              paymentMethod={values.paymentMethod}
              status={status}
              subtotal={summary.subtotal}
              total={summary.total}
              t={t}
            />
          </aside>
        </Form>
      )}
    </Formik>
  );
}
