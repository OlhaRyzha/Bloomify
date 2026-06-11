import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { trackPurchaseCompleted } from '@/services/analytics/analytics.events';

import CheckoutService from '../api/checkout.service';
import {
  clearPendingLiqPayOrder,
  getPendingLiqPayOrder,
} from '../components/checkout.helpers';
import {
  PAYMENT_STATUS_SYNC_RETRY_DELAY_MS,
  PAYMENT_STATUS_SYNC_RETRY_LIMIT,
} from '../components/checkout.constants';
import { ordersQueryKeys } from '../../orders/api/query-keys';

type PaymentReturnSyncState = 'idle' | 'syncing';

type TranslationFunction = (
  key: string,
  values?: Record<string, string | number>
) => string;

type CheckoutSummaryForPaymentSync = {
  itemCount: number;
  total: number;
};

type CompleteOrderParams = {
  orderId: number;
  message: string;
  paymentStatusLabel: string;
};

type UseCheckoutPaymentSyncParams = {
  clearCart: () => void;
  isHydrated: boolean;
  locale: string;
  summary: CheckoutSummaryForPaymentSync;
  t: TranslationFunction;
};

const PAID_PAYMENT_STATUSES = new Set(['paid', 'sandbox']);

const isPaidPaymentStatus = (paymentStatus: string) =>
  PAID_PAYMENT_STATUSES.has(paymentStatus.toLowerCase());

export function useCheckoutPaymentSync({
  clearCart,
  isHydrated,
  locale,
  summary,
  t,
}: UseCheckoutPaymentSyncParams) {
  const queryClient = useQueryClient();
  const activePaymentSyncKeyRef = useRef<string | null>(null);
  const latestSyncContextRef = useRef({ locale, summary, t });

  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);
  const [completedOrderMessage, setCompletedOrderMessage] = useState<
    string | null
  >(null);
  const [completedPaymentStatusLabel, setCompletedPaymentStatusLabel] =
    useState<string | null>(null);
  const [paymentReturnSyncState, setPaymentReturnSyncState] =
    useState<PaymentReturnSyncState>('idle');

  const resetCompletedOrderState = useCallback(() => {
    setCompletedOrderId(null);
    setCompletedOrderMessage(null);
    setCompletedPaymentStatusLabel(null);
  }, []);

  const completeOrder = useCallback(
    ({ orderId, message, paymentStatusLabel }: CompleteOrderParams) => {
      setCompletedOrderId(orderId);
      setCompletedOrderMessage(message);
      setCompletedPaymentStatusLabel(paymentStatusLabel);
    },
    []
  );

  useEffect(() => {
    latestSyncContextRef.current = { locale, summary, t };
  }, [locale, summary, t]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const { orderId, orderToken } = getPendingLiqPayOrder();
    const paymentSyncKey = orderId && orderToken ? `${orderId}:${orderToken}` : null;

    if (!orderId || !orderToken || !paymentSyncKey) {
      return;
    }

    if (activePaymentSyncKeyRef.current === paymentSyncKey) {
      return;
    }

    const syncPaymentStatus = async (attempt = 0): Promise<void> => {
      await Promise.resolve();

      if (activePaymentSyncKeyRef.current !== paymentSyncKey) {
        return;
      }

      setPaymentReturnSyncState('syncing');

      try {
        const response = await CheckoutService.syncPaymentStatus(
          orderId,
          orderToken
        );

        if (activePaymentSyncKeyRef.current !== paymentSyncKey) {
          return;
        }

        if (isPaidPaymentStatus(response.paymentStatus)) {
          clearPendingLiqPayOrder();
          activePaymentSyncKeyRef.current = null;

          const {
            locale: currentLocale,
            summary: currentSummary,
            t: currentT,
          } = latestSyncContextRef.current;

          if (currentSummary.itemCount > 0) {
            trackPurchaseCompleted({
              itemCount: currentSummary.itemCount,
              orderId: response.orderId,
              paymentMethod: response.paymentMethod,
              value: currentSummary.total,
              locale: currentLocale,
            });
          }

          completeOrder({
            orderId: response.orderId,
            message: currentT('checkout_submit_paid_status', {
              orderId: response.orderId,
            }),
            paymentStatusLabel: currentT('status_paid'),
          });

          setPaymentReturnSyncState('idle');
          clearCart();

          void queryClient.invalidateQueries({
            queryKey: ordersQueryKeys.all,
          });

          return;
        }

        if (response.paymentStatus === 'failed') {
          clearPendingLiqPayOrder();
          activePaymentSyncKeyRef.current = null;
          resetCompletedOrderState();
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
        if (activePaymentSyncKeyRef.current !== paymentSyncKey) {
          return;
        }

        resetCompletedOrderState();
        setPaymentReturnSyncState('idle');
        activePaymentSyncKeyRef.current = null;
      }
    };

    activePaymentSyncKeyRef.current = paymentSyncKey;
    void syncPaymentStatus();
  }, [
    clearCart,
    completeOrder,
    isHydrated,
    queryClient,
    resetCompletedOrderState,
  ]);

  return {
    completedOrderId,
    completedOrderMessage,
    completedPaymentStatusLabel,
    completeOrder,
    paymentReturnSyncState,
    resetCompletedOrderState,
  };
}
