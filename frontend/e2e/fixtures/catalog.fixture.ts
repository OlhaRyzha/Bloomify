export const e2eCatalogItems = [
  {
    id: 'white-harmony',
    name: 'Біла гармонія',
    description: 'Класична композиція з білих лілій та троянд',
    price: 1650,
    imageUrl: '/images/white-harmony.jpg',
    tag: 'Класика',
  },
  {
    id: 'blue-harmony',
    name: 'Блакитна гармонія',
    description: 'Витончений букет із білих лілій та гортензії',
    price: 1750,
    imageUrl: '/images/blue-harmony.jpg',
    tag: 'Класика',
  },
] as const;

export const e2ePrimaryCatalogItem = e2eCatalogItems[0];
