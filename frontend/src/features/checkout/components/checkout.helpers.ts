import type { LiqPayCheckoutPayload } from '../api/checkout.service';
import {
  PENDING_LIQPAY_ORDER_KEY,
  PENDING_LIQPAY_ORDER_TOKEN_KEY,
} from './checkout.constants';
import { isWindowUndefined } from '@/utils/guards/is-window-undefined';

export const getOrderIdFromCheckoutSearch = () => {
  if (isWindowUndefined()) {
    return null;
  }

  const orderId = Number(
    new URLSearchParams(window.location.search).get('orderId')
  );

  return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
};

export const getOrderTokenFromCheckoutSearch = () => {
  if (isWindowUndefined()) {
    return '';
  }

  return new URLSearchParams(window.location.search).get('orderToken') ?? '';
};

export const clearPendingLiqPayOrder = () => {
  window.localStorage.removeItem(PENDING_LIQPAY_ORDER_KEY);
  window.localStorage.removeItem(PENDING_LIQPAY_ORDER_TOKEN_KEY);
};

export const savePendingLiqPayOrder = ({
  orderId,
  paymentStatusToken,
}: {
  orderId: number;
  paymentStatusToken: string;
}) => {
  window.localStorage.setItem(PENDING_LIQPAY_ORDER_KEY, String(orderId));
  window.localStorage.setItem(
    PENDING_LIQPAY_ORDER_TOKEN_KEY,
    paymentStatusToken
  );
};

export const getPendingLiqPayOrder = () => {
  const rawOrderId = window.localStorage.getItem(PENDING_LIQPAY_ORDER_KEY);
  const storedOrderId = Number(rawOrderId);
  const storedOrderToken =
    window.localStorage.getItem(PENDING_LIQPAY_ORDER_TOKEN_KEY) ?? '';

  const searchOrderId = getOrderIdFromCheckoutSearch();
  const searchOrderToken = getOrderTokenFromCheckoutSearch();

  const orderId =
    searchOrderId ??
    (Number.isInteger(storedOrderId) && storedOrderId > 0
      ? storedOrderId
      : null);

  const orderToken = searchOrderToken || storedOrderToken;

  return {
    orderId,
    orderToken,
  };
};

export const buildTelegramOrderTrackingUrl = (
  botUrl: string,
  orderId: number
) => {
  const normalizedBotUrl = botUrl.trim();

  if (!normalizedBotUrl) {
    return null;
  }

  const urlCandidate = normalizedBotUrl.startsWith('@')
    ? `https://t.me/${normalizedBotUrl.slice(1)}`
    : normalizedBotUrl.startsWith('http://') ||
        normalizedBotUrl.startsWith('https://')
      ? normalizedBotUrl
      : `https://t.me/${normalizedBotUrl}`;

  try {
    const url = new URL(urlCandidate);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    if (['t.me', 'telegram.me'].includes(url.hostname)) {
      const botUsername = url.pathname.replace(/^\/@?/, '').replace(/\/$/, '');

      if (!botUsername) {
        return null;
      }

      url.pathname = `/${botUsername}`;
    }

    url.searchParams.set('start', `order_${orderId}`);

    return url.toString();
  } catch {
    return null;
  }
};

export const submitLiqPayCheckout = (payload: LiqPayCheckoutPayload) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payload.checkoutUrl;

  const dataInput = document.createElement('input');
  dataInput.type = 'hidden';
  dataInput.name = 'data';
  dataInput.value = payload.data;

  const signatureInput = document.createElement('input');
  signatureInput.type = 'hidden';
  signatureInput.name = 'signature';
  signatureInput.value = payload.signature;

  form.append(dataInput, signatureInput);
  document.body.append(form);
  form.submit();
};
