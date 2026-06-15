import { useCallback } from 'react';
import { type FormikHelpers } from 'formik';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api/errors/api-error';
import {
  trackCheckoutSubmitted,
  trackPaymentFailed,
  trackPurchaseCompleted,
} from '@/services/analytics/analytics.events';

import CheckoutService from '../api/checkout.service';
import { type CheckoutFormValues } from '../forms/checkout-form.schemas';
import {
  savePendingLiqPayOrder,
  submitLiqPayCheckout,
} from '../components/checkout.helpers';
import { ordersQueryKeys } from '../../orders/api/query-keys';

type TranslationFunction = (
  key: string,
  values?: Record<string, string | number>
) => string;

type CheckoutCartItem = {
  id: string;
  quantity: number;
};

type CheckoutSummaryForSubmit = {
  itemCount: number;
  total: number;
};

type CompleteOrderParams = {
  orderId: number;
  message: string;
  paymentStatusLabel: string;
};

type UseCheckoutSubmitParams = {
  cartItems: CheckoutCartItem[];
  clearCart: () => void;
  completeOrder: (params: CompleteOrderParams) => void;
  locale: string;
  promoCode?: string | null;
  resetCompletedOrderState: () => void;
  summary: CheckoutSummaryForSubmit;
  t: TranslationFunction;
};

export function useCheckoutSubmit({
  cartItems,
  clearCart,
  completeOrder,
  locale,
  promoCode,
  resetCompletedOrderState,
  summary,
  t,
}: UseCheckoutSubmitParams) {
  const queryClient = useQueryClient();

  return useCallback(
    async (
      values: CheckoutFormValues,
      actions: FormikHelpers<CheckoutFormValues>
    ) => {
      actions.setStatus(undefined);
      resetCompletedOrderState();

      trackCheckoutSubmitted({
        itemCount: summary.itemCount,
        paymentMethod: values.paymentMethod,
        value: summary.total,
        locale,
      });

      try {
        const { liqpay, orderId, paymentStatusToken } =
          await CheckoutService.createCheckout({
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
            ...(promoCode ? { promoCode } : {}),
          });

        await queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.all,
        });

        if (liqpay) {
          const message = t('checkout_submit_liqpay_redirect');

          savePendingLiqPayOrder({
            orderId,
            paymentStatusToken,
          });

          actions.setStatus(message);
          submitLiqPayCheckout(liqpay);

          return;
        }

        trackPurchaseCompleted({
          itemCount: summary.itemCount,
          orderId,
          paymentMethod: values.paymentMethod,
          value: summary.total,
          locale,
        });

        const message = t('checkout_submit_cash_status');

        completeOrder({
          orderId,
          message,
          paymentStatusLabel: t(
            'status_payment_on_delivery'
          ),
        });

        actions.setStatus(message);
        clearCart();
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
    },
    [
      cartItems,
      clearCart,
      completeOrder,
      locale,
      promoCode,
      queryClient,
      resetCompletedOrderState,
      summary.itemCount,
      summary.total,
      t,
    ]
  );
}
