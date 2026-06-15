import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { LocaleProvider } from '@/components/providers/locale-provider';
import { createTestQueryClient } from '@/test/render';

import SubscriptionService from './subscription.service';
import { subscriptionQueryKeys } from './query-keys';
import {
  createMySubscription,
  createSubscribeResponse,
  createSubscriptionPlan,
} from './subscription.factory';
import { useSubscriptionPlans } from './use-subscription-plans';
import { useMySubscription } from './use-my-subscription';
import { useSubscribe } from './use-subscribe';
import { useUnsubscribe } from './use-unsubscribe';

vi.mock('./subscription.service', () => ({
  default: {
    getPlans: vi.fn(),
    getMySubscription: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getPaymentStatus: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'uk' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/features/checkout/components/checkout.helpers', () => ({
  submitLiqPayCheckout: vi.fn(),
}));

const createWrapper = (locale: 'en' | 'uk' | 'pl' = 'uk') => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    </QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

describe('useSubscriptionPlans', () => {
  beforeEach(() => {
    vi.mocked(SubscriptionService.getPlans).mockReset();
  });

  test('fetches plans and caches under locale-aware query key', async () => {
    const plans = [createSubscriptionPlan({ id: 1 }), createSubscriptionPlan({ id: 2, name: 'Premium', price: 1799 })];
    vi.mocked(SubscriptionService.getPlans).mockResolvedValue(plans);

    const { queryClient, Wrapper } = createWrapper('uk');
    const { result } = renderHook(() => useSubscriptionPlans(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(SubscriptionService.getPlans).toHaveBeenCalledWith('uk');
    expect(queryClient.getQueryData(subscriptionQueryKeys.plans('uk'))).toEqual(plans);
  });

  test('query keys are isolated per locale', async () => {
    vi.mocked(SubscriptionService.getPlans).mockResolvedValue([createSubscriptionPlan()]);

    const { queryClient: qcEn, Wrapper: WrapperEn } = createWrapper('en');
    const { queryClient: qcPl, Wrapper: WrapperPl } = createWrapper('pl');

    renderHook(() => useSubscriptionPlans(), { wrapper: WrapperEn });
    renderHook(() => useSubscriptionPlans(), { wrapper: WrapperPl });

    await waitFor(() =>
      expect(SubscriptionService.getPlans).toHaveBeenCalledTimes(2)
    );

    expect(qcEn.getQueryData(subscriptionQueryKeys.plans('pl'))).toBeUndefined();
    expect(qcPl.getQueryData(subscriptionQueryKeys.plans('en'))).toBeUndefined();
  });
});

describe('useMySubscription', () => {
  beforeEach(() => {
    vi.mocked(SubscriptionService.getMySubscription).mockReset();
  });

  test('fetches subscription for authenticated user', async () => {
    const subscription = createMySubscription({ status: 'active' });
    vi.mocked(SubscriptionService.getMySubscription).mockResolvedValue(subscription);

    const { Wrapper } = createWrapper('uk');
    const { result } = renderHook(() => useMySubscription(true), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(SubscriptionService.getMySubscription).toHaveBeenCalledWith('uk');
    expect(result.current.data).toEqual(subscription);
  });

  test('returns null when user has no active subscription', async () => {
    vi.mocked(SubscriptionService.getMySubscription).mockResolvedValue(null);

    const { Wrapper } = createWrapper('uk');
    const { result } = renderHook(() => useMySubscription(true), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  test('does not fetch when disabled', async () => {
    const { Wrapper } = createWrapper('uk');
    const { result } = renderHook(() => useMySubscription(false), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(SubscriptionService.getMySubscription).not.toHaveBeenCalled();
  });
});

describe('useSubscribe', () => {
  beforeEach(() => {
    vi.mocked(SubscriptionService.subscribe).mockReset();
  });

  test('calls subscribe with planId and invalidates subscription queries on success', async () => {
    const response = createSubscribeResponse({ subscriptionId: 1, paymentId: 10 });
    vi.mocked(SubscriptionService.subscribe).mockResolvedValue(response);

    const { queryClient, Wrapper } = createWrapper('uk');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSubscribe(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(2);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(SubscriptionService.subscribe).toHaveBeenCalledWith(2, 'uk');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: subscriptionQueryKeys.all,
    });
  });
});

describe('useUnsubscribe', () => {
  beforeEach(() => {
    vi.mocked(SubscriptionService.unsubscribe).mockReset();
  });

  test('calls unsubscribe and invalidates subscription queries on success', async () => {
    vi.mocked(SubscriptionService.unsubscribe).mockResolvedValue(undefined);

    const { queryClient, Wrapper } = createWrapper('uk');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnsubscribe(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(SubscriptionService.unsubscribe).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: subscriptionQueryKeys.all,
    });
  });
});
