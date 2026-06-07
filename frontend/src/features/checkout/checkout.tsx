'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Formik } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';

import FeedbackState from '@/components/ui/feedback-state';
import { useLocale } from '@/components/providers/locale-provider';
import { useTranslation } from '@/hooks/use-translation';
import { useHydrated } from '@/hooks/use-hydrated';
import { getLocalizedPath } from '@/i18n/routing';
import { useGetProducts } from '@/features/catalog/api/use-products';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { ApiError } from '@/utils/api/api-error';
import {
  selectCartItems,
  selectClearCart,
} from '@/features/cart/store/cart.selectors';
import { useCartStore } from '@/features/cart/store/cart.store';
import { getCartSummary } from '@/features/cart/cart.helpers';
import { isNonEmptyArray } from '@/utils/guards/is-non-empty-array';

import { checkoutInitialValues } from './forms/checkout-form.config';
import CheckoutLoadingState from './components/checkout-loading-state';
import {
  createCheckoutSchema,
  type CheckoutFormValues,
} from './forms/checkout-form.schemas';
import CheckoutService from './api/checkout.service';
import { useCheckoutDraftStore } from './store/checkout-draft.store';
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

import CheckoutDraftPersistence from './components/checkout-draft-persistence';
import CheckoutContactSection from './components/checkout-contact-section';
import CheckoutPaymentSection from './components/checkout-payment-section';
import CheckoutSummaryPanel from './components/checkout-summary-panel';
import CheckoutSuccessState from './components/checkout-success-state';
import {
  clearPendingLiqPayOrder,
  getPendingLiqPayOrder,
  savePendingLiqPayOrder,
  submitLiqPayCheckout,
} from './components/checkout.helpers';
import {
  PAYMENT_STATUS_SYNC_RETRY_DELAY_MS,
  PAYMENT_STATUS_SYNC_RETRY_LIMIT,
} from './components/checkout.constants';
import { ordersQueryKeys } from '../orders/api/query-keys';

type PaymentReturnSyncState = 'idle' | 'syncing';

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

  const queryClient = useQueryClient();
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

    const { orderId, orderToken } = getPendingLiqPayOrder();

    if (!orderId || !orderToken || syncedPaymentOrderRef.current === orderId) {
      return;
    }

    syncedPaymentOrderRef.current = orderId;
    setPaymentReturnSyncState('syncing');

    const syncPaymentStatus = async (attempt = 0) => {
      try {
        const response = await CheckoutService.syncPaymentStatus(
          orderId,
          orderToken
        );

        if (response.paymentStatus === 'paid') {
          clearPendingLiqPayOrder();

          await queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.all,
          });

          if (summary.itemCount > 0) {
            trackPurchaseCompleted({
              itemCount: summary.itemCount,
              orderId: response.orderId,
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

          return;
        }

        if (response.paymentStatus === 'failed') {
          clearPendingLiqPayOrder();
          setCompletedOrderId(null);
          setCompletedOrderMessage(null);
          setCompletedPaymentStatusLabel(null);
          setPaymentReturnSyncState('idle');

          return;
        }

        if (attempt < PAYMENT_STATUS_SYNC_RETRY_LIMIT) {
          window.setTimeout(() => {
            void syncPaymentStatus(attempt + 1);
          }, PAYMENT_STATUS_SYNC_RETRY_DELAY_MS);

          return;
        }

        setPaymentReturnSyncState('idle');
      } catch {
        setCompletedOrderMessage(null);
        setCompletedPaymentStatusLabel(null);
        setPaymentReturnSyncState('idle');
        syncedPaymentOrderRef.current = null;
      }
    };

    void syncPaymentStatus();
  }, [
    clearCart,
    isHydrated,
    locale,
    queryClient,
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

          await queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.all,
          });

          if (response.liqpay) {
            const message = t('checkout_submit_liqpay_redirect');

            savePendingLiqPayOrder({
              orderId: response.orderId,
              paymentStatusToken: response.paymentStatusToken,
            });

            actions.setStatus(message);
            submitLiqPayCheckout(response.liqpay);

            return;
          }

          trackPurchaseCompleted({
            itemCount: summary.itemCount,
            orderId: response.orderId,
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
