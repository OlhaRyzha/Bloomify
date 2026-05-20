import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';

import { API_ROUTES } from '@/constants/api.constant';
import { apiUrl } from '@/test/api-url';
import { createDeferred } from '@/test/deferred';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/msw/server';

import FooterNewsletterForm from './footer-newsletter-form.client';

const props = {
  errorMessage: 'Subscription failed',
  inputId: 'newsletter-email',
  label: 'Subscribe',
  loadingLabel: 'Subscribing',
  placeholder: 'Email address',
  successMessage: 'Subscribed successfully',
};

describe('FooterNewsletterForm', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/en');
  });

  test('submits email, shows success, and resets the field', async () => {
    const requests: unknown[] = [];
    server.use(
      http.post(apiUrl(API_ROUTES.SUBSCRIBE), async ({ request }) => {
        requests.push(await request.json());
        return HttpResponse.json({ ok: true });
      })
    );

    const { user } = renderWithProviders(<FooterNewsletterForm {...props} />, {
      locale: 'en',
    });

    const input = screen.getByPlaceholderText('Email address');
    await user.type(input, 'olha@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Subscribed successfully'
      );
    });
    expect(requests).toEqual([{ email: 'olha@example.com' }]);
    expect(input).toHaveValue('');
  });

  test('shows failed submit status and preserves the field value', async () => {
    server.use(
      http.post(apiUrl(API_ROUTES.SUBSCRIBE), () =>
        HttpResponse.json({ error: 'Email already subscribed' }, { status: 409 })
      )
    );

    const { user } = renderWithProviders(<FooterNewsletterForm {...props} />, {
      locale: 'en',
    });

    const input = screen.getByPlaceholderText('Email address');
    await user.type(input, 'olha@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Email already subscribed'
      );
    });
    expect(input).toHaveValue('olha@example.com');
  });

  test('disables submit while subscription request is pending', async () => {
    const deferred = createDeferred<Response>();
    server.use(
      http.post(apiUrl(API_ROUTES.SUBSCRIBE), async () => deferred.promise)
    );

    const { user } = renderWithProviders(<FooterNewsletterForm {...props} />, {
      locale: 'en',
    });

    await user.type(
      screen.getByPlaceholderText('Email address'),
      'olha@example.com'
    );
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Subscribe' })).toHaveTextContent(
        'Subscribing'
      );
    });

    deferred.resolve(HttpResponse.json({ ok: true }));
  });
});
