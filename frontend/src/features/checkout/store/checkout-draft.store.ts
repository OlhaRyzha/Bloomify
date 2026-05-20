import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CheckoutDeliveryDraft = {
  customerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryNote: string;
};

export type CheckoutDraftState = {
  delivery: CheckoutDeliveryDraft;
  setDeliveryDraft: (draft: CheckoutDeliveryDraft) => void;
  clearDeliveryDraft: () => void;
};

export const checkoutDeliveryDraftInitialValues: CheckoutDeliveryDraft = {
  customerName: '',
  email: '',
  phone: '',
  city: 'Kyiv',
  address: '',
  deliveryNote: '',
};

export const useCheckoutDraftStore = create<CheckoutDraftState>()(
  persist(
    (set) => ({
      delivery: checkoutDeliveryDraftInitialValues,
      setDeliveryDraft: (draft) => {
        set({ delivery: draft });
      },
      clearDeliveryDraft: () => {
        set({ delivery: checkoutDeliveryDraftInitialValues });
      },
    }),
    {
      name: 'bloomify-checkout-delivery-draft',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ delivery: state.delivery }),
      version: 1,
    }
  )
);
