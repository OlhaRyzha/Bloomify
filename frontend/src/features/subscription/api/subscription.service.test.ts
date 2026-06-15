import { http, HttpResponse } from 'msw';
import { describe, expect, test, vi } from 'vitest';

import { ApiError, ApiErrorType } from '@/services/api/errors/api-error';
import { server } from '@/test/msw/server';
import { apiUrl } from '@/test/api-url';

import SubscriptionService from './subscription.service';
import {
  createMySubscription,
  createSubscribeResponse,
  createSubscriptionPaymentStatus,
  createSubscriptionPlan,
} from './subscription.factory';

describe('SubscriptionService', () => {
  describe('getPlans', () => {
    test('returns plans array with locale param forwarded', async () => {
      const plans = [
        createSubscriptionPlan({ id: 1, name: 'Базовий' }),
        createSubscriptionPlan({ id: 2, name: 'Преміум', price: 1799 }),
      ];

      server.use(
        http.get(apiUrl('subscriptions/plans'), ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('lang')).toBe('uk');
          return HttpResponse.json(plans);
        })
      );

      await expect(SubscriptionService.getPlans('uk')).resolves.toEqual(plans);
    });

    test('sends no lang param when locale is omitted', async () => {
      const plans = [createSubscriptionPlan()];

      server.use(
        http.get(apiUrl('subscriptions/plans'), ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.has('lang')).toBe(false);
          return HttpResponse.json(plans);
        })
      );

      await expect(SubscriptionService.getPlans()).resolves.toEqual(plans);
    });

    test('normalizes invalid response into ApiError', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      server.use(
        http.get(apiUrl('subscriptions/plans'), () =>
          HttpResponse.json([{ id: 'not-a-number' }])
        )
      );

      await expect(SubscriptionService.getPlans('en')).rejects.toEqual(
        expect.objectContaining({
          type: ApiErrorType.Validation,
        }) satisfies Partial<ApiError>
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getMySubscription', () => {
    test('returns active subscription', async () => {
      const subscription = createMySubscription({ status: 'active' });

      server.use(
        http.get(apiUrl('subscriptions/me'), () =>
          HttpResponse.json(subscription)
        )
      );

      await expect(SubscriptionService.getMySubscription('uk')).resolves.toEqual(
        subscription
      );
    });

    test('returns null when no subscription exists (404)', async () => {
      server.use(
        http.get(apiUrl('subscriptions/me'), () =>
          HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
        )
      );

      await expect(
        SubscriptionService.getMySubscription('uk')
      ).resolves.toBeNull();
    });

    test('rethrows non-404 errors', async () => {
      server.use(
        http.get(apiUrl('subscriptions/me'), () =>
          HttpResponse.json({ detail: 'Server error.' }, { status: 500 })
        )
      );

      await expect(
        SubscriptionService.getMySubscription('uk')
      ).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('subscribe', () => {
    test('posts plan_id and locale, returns checkout response', async () => {
      const response = createSubscribeResponse();

      server.use(
        http.post(apiUrl('subscriptions/subscribe'), async ({ request }) => {
          await expect(request.json()).resolves.toEqual({
            plan_id: 2,
            locale: 'uk',
          });
          return HttpResponse.json(response, { status: 201 });
        })
      );

      await expect(SubscriptionService.subscribe(2, 'uk')).resolves.toEqual(
        response
      );
    });
  });

  describe('unsubscribe', () => {
    test('calls unsubscribe endpoint', async () => {
      let called = false;

      server.use(
        http.post(apiUrl('subscriptions/unsubscribe'), () => {
          called = true;
          return HttpResponse.json({}, { status: 200 });
        })
      );

      await SubscriptionService.unsubscribe();

      expect(called).toBe(true);
    });
  });

  describe('getPaymentStatus', () => {
    test('sends paymentToken param and returns payment status', async () => {
      const status = createSubscriptionPaymentStatus({ paymentStatus: 'paid' });

      server.use(
        http.get(apiUrl('subscriptions/payments/10/status'), ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('paymentToken')).toBe('tok-abc');
          return HttpResponse.json(status);
        })
      );

      await expect(
        SubscriptionService.getPaymentStatus(10, 'tok-abc')
      ).resolves.toEqual(status);
    });
  });
});
