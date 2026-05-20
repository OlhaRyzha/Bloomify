import { createProductItem } from './api/products.factory';
import { useCatalogStore } from './store/catalog.store';

export const resetCatalogStore = () => {
  useCatalogStore.setState({
    page: 1,
    perPage: 6,
    search: '',
    sort: 'default',
    tag: 'all',
  });
  window.history.pushState({}, '', '/catalog');
};

export const createCatalogGridItems = () => [
  createProductItem({
    id: 'rose-bouquet',
    name: 'Rose bouquet',
    description: 'Classic red roses',
    price: 2000,
    tag: 'classic',
  }),
  createProductItem({
    id: 'white-lily',
    name: 'White lily',
    description: 'Soft white flowers',
    price: 1500,
    tag: 'white',
  }),
  createProductItem({
    id: 'sunflower',
    name: 'Sunflower',
    description: 'Bright yellow bouquet',
    price: 1200,
    tag: 'summer',
  }),
];
