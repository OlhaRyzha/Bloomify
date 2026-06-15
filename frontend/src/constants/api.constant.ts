export const API_ROUTES = {
  PRODUCTS: 'products',
  PRODUCT_FILTERS: 'products/filters',
  ORDERS: 'orders',
  CHECKOUT: 'orders/checkout',
  CHECKOUT_PAYMENT_STATUS: (orderId: number) =>
    `orders/${orderId}/payment-status`,
  FAVORITES: 'favorites',
  CART: 'cart',
  AUTH_SIGN_IN: 'auth/token/',
  AUTH_SIGN_UP: 'auth/register/',
  AUTH_REFRESH_TOKEN: 'auth/refresh/',
  AUTH_SIGN_OUT: 'auth/logout/',
  AUTH_ME: 'auth/me/',
  AUTH_AUTH0: 'auth/oauth/auth0/',
  ROLES: 'roles',
  SUBSCRIPTION_PLANS: 'subscriptions/plans',
  MY_SUBSCRIPTION: 'subscriptions/me',
  SUBSCRIBE: 'subscriptions/subscribe',
  UNSUBSCRIBE: 'subscriptions/unsubscribe',
  SUBSCRIPTION_PAYMENT_STATUS: (paymentId: number) =>
    `subscriptions/payments/${paymentId}/status`,
};
