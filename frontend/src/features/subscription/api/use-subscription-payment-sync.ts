'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { subscriptionQueryKeys } from './query-keys';
import SubscriptionService from './subscription.service';

const RETRY_LIMIT = 8;
const RETRY_DELAY_MS = 1500;

export type SubscriptionSyncState = 'idle' | 'syncing' | 'paid' | 'failed';

export function useSubscriptionPaymentSync() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [syncState, setSyncState] = useState<SubscriptionSyncState>('idle');
  const syncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('paymentId');
    const paymentToken = params.get('paymentToken');

    if (!paymentId || !paymentToken) {
      return;
    }

    const syncKey = `${paymentId}:${paymentToken}`;
    if (syncKeyRef.current === syncKey) {
      return;
    }
    syncKeyRef.current = syncKey;

    const clearUrlParams = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('paymentId');
      url.searchParams.delete('paymentToken');
      url.searchParams.delete('subscriptionId');
      router.replace(url.pathname + (url.search || ''));
    };

    const poll = async (attempt = 0): Promise<void> => {
      if (syncKeyRef.current !== syncKey) return;

      setSyncState('syncing');

      try {
        const result = await SubscriptionService.getPaymentStatus(
          Number(paymentId),
          paymentToken
        );

        if (syncKeyRef.current !== syncKey) return;

        if (result.paymentStatus === 'paid') {
          await queryClient.invalidateQueries({
            queryKey: subscriptionQueryKeys.all,
          });
          setSyncState('paid');
          clearUrlParams();
          return;
        }

        if (result.paymentStatus === 'failed') {
          setSyncState('failed');
          clearUrlParams();
          return;
        }

        if (attempt < RETRY_LIMIT) {
          window.setTimeout(() => void poll(attempt + 1), RETRY_DELAY_MS);
          return;
        }

        setSyncState('idle');
        clearUrlParams();
      } catch {
        if (syncKeyRef.current !== syncKey) return;
        setSyncState('idle');
        clearUrlParams();
      }
    };

    void poll();
  }, [queryClient, router]);

  return { syncState };
}
