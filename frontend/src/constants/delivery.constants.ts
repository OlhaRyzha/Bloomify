export const FREE_DELIVERY_THRESHOLD = 1500;
export const FREE_DELIVERY_MESSAGE = `Безкоштовна доставка від ${new Intl.NumberFormat(
  'uk-UA'
).format(FREE_DELIVERY_THRESHOLD)} ₴`;
