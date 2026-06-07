import { useEffect } from 'react';

import type { CheckoutFormValues } from '../forms/checkout-form.schemas';
import type { CheckoutDraftState } from '../store/checkout-draft.store';

type CheckoutDraftPersistenceProps = {
  setDeliveryDraft: CheckoutDraftState['setDeliveryDraft'];
  values: CheckoutFormValues;
};

export default function CheckoutDraftPersistence({
  setDeliveryDraft,
  values,
}: CheckoutDraftPersistenceProps) {
  const {
    address,
    city,
    customerName,
    deliveryNote = '',
    email,
    phone,
  } = values;

  useEffect(() => {
    setDeliveryDraft({
      address,
      city,
      customerName,
      deliveryNote,
      email,
      phone,
    });
  }, [
    address,
    city,
    customerName,
    deliveryNote,
    email,
    phone,
    setDeliveryDraft,
  ]);

  return null;
}
