import { beforeEach, describe, expect, test } from 'vitest';

import {
  checkoutDeliveryDraftInitialValues,
  useCheckoutDraftStore,
  type CheckoutDeliveryDraft,
} from './checkout-draft.store';
import {
  selectCheckoutDeliveryDraft,
  selectClearCheckoutDeliveryDraft,
  selectSetCheckoutDeliveryDraft,
} from './checkout-draft.selectors';

const storageKey = 'bloomify-checkout-delivery-draft';

const deliveryDraft: CheckoutDeliveryDraft = {
  customerName: 'Olena Kolomiec',
  email: 'olha@example.com',
  phone: '+380671234567',
  city: 'Kyiv',
  address: 'Khreshchatyk 1',
  deliveryNote: 'Call before delivery',
};

describe('checkout draft store', () => {
  beforeEach(() => {
    localStorage.clear();
    useCheckoutDraftStore.setState({
      delivery: checkoutDeliveryDraftInitialValues,
    });
  });

  test('stores delivery draft values', () => {
    selectSetCheckoutDeliveryDraft(useCheckoutDraftStore.getState())(
      deliveryDraft
    );

    expect(
      selectCheckoutDeliveryDraft(useCheckoutDraftStore.getState())
    ).toEqual(deliveryDraft);
  });

  test('persists delivery fields only', () => {
    selectSetCheckoutDeliveryDraft(useCheckoutDraftStore.getState())(
      deliveryDraft
    );

    const persistedDraft = localStorage.getItem(storageKey);

    expect(persistedDraft).toContain('delivery');
    expect(persistedDraft).toContain('customerName');
    expect(persistedDraft).not.toContain('paymentMethod');
    expect(persistedDraft).not.toContain('items');
    expect(persistedDraft).not.toContain('cart');
  });

  test('clears delivery draft values', () => {
    selectSetCheckoutDeliveryDraft(useCheckoutDraftStore.getState())(
      deliveryDraft
    );

    selectClearCheckoutDeliveryDraft(useCheckoutDraftStore.getState())();

    expect(
      selectCheckoutDeliveryDraft(useCheckoutDraftStore.getState())
    ).toEqual(checkoutDeliveryDraftInitialValues);
  });
});
