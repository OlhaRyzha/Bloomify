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
  const syncedPaymentOrderRef = useRef<number | null>(null);

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
    if (!isHydrated) {
      return;
    }

    const { orderId, orderToken } = getPendingLiqPayOrder();

    if (!orderId || !orderToken || syncedPaymentOrderRef.current === orderId) {
      return;
    }

    let isActive = true;

    syncedPaymentOrderRef.current = orderId;

    const syncPaymentStatus = async (attempt = 0): Promise<void> => {
      await Promise.resolve();

      if (!isActive) {
        return;
      }

      setPaymentReturnSyncState('syncing');

      try {
        const response = await CheckoutService.syncPaymentStatus(
          orderId,
          orderToken
        );

        if (!isActive) {
          return;
        }

        if (isPaidPaymentStatus(response.paymentStatus)) {
          clearPendingLiqPayOrder();

          if (summary.itemCount > 0) {
            trackPurchaseCompleted({
              itemCount: summary.itemCount,
              orderId: response.orderId,
              paymentMethod: response.paymentMethod,
              value: summary.total,
              locale,
            });
          }

          completeOrder({
            orderId: response.orderId,
            message: t('checkout_submit_paid_status', {
              orderId: response.orderId,
            }),
            paymentStatusLabel: t('status_paid'),
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
        if (!isActive) {
          return;
        }

        resetCompletedOrderState();
        setPaymentReturnSyncState('idle');
        syncedPaymentOrderRef.current = null;
      }
    };

    void syncPaymentStatus();

    return () => {
      isActive = false;
    };
  }, [
    clearCart,
    completeOrder,
    isHydrated,
    locale,
    queryClient,
    resetCompletedOrderState,
    summary.itemCount,
    summary.total,
    t,
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
