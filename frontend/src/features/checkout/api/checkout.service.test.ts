import { http, HttpResponse } from 'msw';
import { describe, expect, test, vi } from 'vitest';

import { server } from '@/test/msw/server';
import { apiUrl } from '@/test/api-url';
import { ApiError, ApiErrorType } from '@/utils/api/api-error';

import CheckoutService from './checkout.service';
import {
  createCheckoutPayload,
  createCheckoutPaymentStatusResponse,
  createCheckoutResponse,
} from './checkout.factory';

const checkoutPayload = createCheckoutPayload();

describe('CheckoutService', () => {
  test('posts checkout payload and parses response', async () => {
    server.use(
      http.post(apiUrl('orders/checkout'), async ({ request }) => {
        await expect(request.json()).resolves.toEqual(checkoutPayload);

        return HttpResponse.json(
          createCheckoutResponse(),
          { status: 201 }
        );
      })
    );

    await expect(CheckoutService.createCheckout(checkoutPayload)).resolves.toEqual(
      createCheckoutResponse()
    );
  });

  test('normalizes invalid checkout response into ApiError', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    server.use(
      http.post(apiUrl('orders/checkout'), () =>
        HttpResponse.json({ orderId: 'not-a-number' }, { status: 201 })
      )
    );

    await expect(
      CheckoutService.createCheckout(checkoutPayload)
    ).rejects.toEqual(
      expect.objectContaining({
        type: ApiErrorType.Validation,
      }) satisfies Partial<ApiError>
    );

    consoleErrorSpy.mockRestore();
  });

  test('syncs checkout payment status', async () => {
    server.use(
      http.post(apiUrl('orders/10/payment-status'), () =>
        HttpResponse.json(createCheckoutPaymentStatusResponse())
      )
    );

    await expect(CheckoutService.syncPaymentStatus(10)).resolves.toEqual(
      createCheckoutPaymentStatusResponse()
    );
  });
});
