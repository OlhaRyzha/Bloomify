export const FREE_DELIVERY_THRESHOLD = 4000;
export const STANDARD_DELIVERY_FEE = 150;
export const FREE_DELIVERY_MESSAGE = `Безкоштовна доставка від ${new Intl.NumberFormat(
  'uk-UA'
).format(FREE_DELIVERY_THRESHOLD)} ₴`;
