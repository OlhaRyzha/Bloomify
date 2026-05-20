import type { CheckoutDraftState } from './checkout-draft.store';

export const selectCheckoutDeliveryDraft = (state: CheckoutDraftState) =>
  state.delivery;

export const selectSetCheckoutDeliveryDraft = (state: CheckoutDraftState) =>
  state.setDeliveryDraft;

export const selectClearCheckoutDeliveryDraft = (state: CheckoutDraftState) =>
  state.clearDeliveryDraft;
