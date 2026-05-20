import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createProductItem } from '@/features/catalog/api/products.factory';
import { useCartStore } from '@/features/cart/store/cart.store';
import { apiUrl } from '@/test/api-url';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import CheckoutFeature from './checkout';
import {
  createCheckoutResponse,
  createLiqPayCheckoutPayload,
} from './api/checkout.factory';
import {
  checkoutDeliveryDraftInitialValues,
  useCheckoutDraftStore,
} from './store/checkout-draft.store';

const resetCartStore = () => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
};

const resetCheckoutDraftStore = () => {
  useCheckoutDraftStore.setState({
    delivery: checkoutDeliveryDraftInitialValues,
  });
};

const mockProducts = () => {
  server.use(
    http.get(apiUrl('products'), () =>
      HttpResponse.json([
        createProductItem({
          id: 'rose-bouquet',
          name: 'Rose bouquet',
          price: 1750,
        }),
      ])
    )
  );
};

const mockDelayedProducts = () => {
  server.use(
    http.get(apiUrl('products'), async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));

      return HttpResponse.json([
        createProductItem({
          id: 'rose-bouquet',
          name: 'Rose bouquet',
          price: 1750,
        }),
      ]);
    })
  );
};

const mockCheckout = ({
  liqpay = {
    ...createLiqPayCheckoutPayload(),
  },
  paymentMethod = 'card',
}: {
  liqpay?: null | {
    checkoutUrl: string;
    data: string;
    signature: string;
  };
  paymentMethod?: 'card' | 'cash_on_delivery';
} = {}) => {
  server.use(
    http.post(apiUrl('orders/checkout'), () =>
      HttpResponse.json(
        createCheckoutResponse({
          orderId: 1,
          liqpay,
          paymentProvider: liqpay ? 'liqpay' : 'cash_on_delivery',
          paymentMethod,
        }),
        { status: 201 }
      )
    )
  );
};

describe('CheckoutFeature', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetCartStore();
    resetCheckoutDraftStore();
    document.body
      .querySelectorAll('form[action="https://www.liqpay.ua/api/3/checkout"]')
      .forEach((form) => form.remove());
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
  });

  test('shows empty checkout state when the cart has no items', async () => {
    mockProducts();

    renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(
      await screen.findByRole('heading', { name: /your checkout is empty/i })
    ).toBeInTheDocument();
  });

  test('renders order summary and hosted payment method choices', async () => {
    mockProducts();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 2 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(await screen.findByText('Rose bouquet')).toBeInTheDocument();
    expect(screen.getByText(/2 x 1,750/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /apple pay/i })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /payment on delivery/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/payments are processed securely by liqpay/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /^card/i }));

    expect(screen.getByRole('radio', { name: /^card/i })).toBeChecked();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cvc/i)).not.toBeInTheDocument();
  });

  test('shows checkout skeleton while products are loading', async () => {
    mockDelayedProducts();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(
      screen.getByRole('status', { name: /loading checkout/i })
    ).toBeInTheDocument();

    expect(await screen.findByText('Rose bouquet')).toBeInTheDocument();
  });

  test('restores delivery draft values', async () => {
    mockProducts();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });
    useCheckoutDraftStore.setState({
      delivery: {
        customerName: 'Saved Name',
        email: 'saved@example.com',
        phone: '+380671111111',
        city: 'Lviv',
        address: 'Rynok Square 1',
        deliveryNote: 'Saved note',
      },
    });

    renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    expect(await screen.findByDisplayValue('Saved Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('saved@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rynok Square 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Saved note')).toBeInTheDocument();
  });

  test('redirects card payments to hosted LiqPay checkout', async () => {
    mockProducts();
    mockCheckout();
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    await screen.findByText('Rose bouquet');
    await user.type(screen.getByLabelText(/full name/i), 'Tom Smith');
    await user.type(screen.getByLabelText(/phone/i), '+380671234567');
    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.clear(screen.getByLabelText(/city/i));
    await user.type(screen.getByLabelText(/city/i), 'Kyiv');
    await user.type(
      screen.getByLabelText(/delivery address/i),
      'Khreshchatyk 1'
    );
    await user.click(screen.getByRole('radio', { name: /^card/i }));
    await user.click(screen.getByRole('button', { name: /pay for order/i }));

    expect(
      await screen.findByText('Redirecting to LiqPay test payment.')
    ).toBeInTheDocument();

    const liqPayForm = Array.from(document.forms).find(
      (form) => form.action === 'https://www.liqpay.ua/api/3/checkout'
    );

    expect(liqPayForm).toBeDefined();
    expect(liqPayForm?.querySelector<HTMLInputElement>('input[name="data"]'))
      .toHaveValue('encoded-data');
    expect(
      liqPayForm?.querySelector<HTMLInputElement>('input[name="signature"]')
    ).toHaveValue('encoded-signature');
    expect(HTMLFormElement.prototype.submit).toHaveBeenCalled();
  }, 10000);

  test('creates cash-on-delivery order without LiqPay handoff', async () => {
    mockProducts();
    mockCheckout({
      liqpay: null,
      paymentMethod: 'cash_on_delivery',
    });
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    await screen.findByText('Rose bouquet');
    await user.type(screen.getByLabelText(/full name/i), 'Tom Smith');
    await user.type(screen.getByLabelText(/phone/i), '+380671234567');
    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.clear(screen.getByLabelText(/city/i));
    await user.type(screen.getByLabelText(/city/i), 'Kyiv');
    await user.type(
      screen.getByLabelText(/delivery address/i),
      'Khreshchatyk 1'
    );
    await user.click(
      screen.getByRole('radio', { name: /payment on delivery/i })
    );
    await user.click(screen.getByRole('button', { name: /pay for order/i }));

    expect(
      await screen.findByText(
        'Order created. We will confirm payment on delivery after processing it.'
      )
    ).toBeInTheDocument();
    expect(HTMLFormElement.prototype.submit).not.toHaveBeenCalled();
  });

  test('shows API errors and preserves delivery input', async () => {
    mockProducts();
    server.use(
      http.post(apiUrl('orders/checkout'), () =>
        HttpResponse.json({ error: 'Checkout failed' }, { status: 500 })
      )
    );
    useCartStore.setState({ items: [{ id: 'rose-bouquet', quantity: 1 }] });

    const { user } = renderWithProviders(<CheckoutFeature />, { locale: 'en' });

    const nameInput = await screen.findByLabelText(/full name/i);

    await user.type(nameInput, 'Tom Smith');
    await user.type(screen.getByLabelText(/phone/i), '+380671234567');
    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.clear(screen.getByLabelText(/city/i));
    await user.type(screen.getByLabelText(/city/i), 'Kyiv');
    await user.type(
      screen.getByLabelText(/delivery address/i),
      'Khreshchatyk 1'
    );
    await user.click(screen.getByRole('button', { name: /pay for order/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Checkout failed');
    });
    expect(nameInput).toHaveValue('Tom Smith');
  });
});
