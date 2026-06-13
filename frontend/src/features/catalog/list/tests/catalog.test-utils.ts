import { createProductItem } from '../../api/products.factory';
import { useCatalogStore } from '../../store/catalog.store';
import { DEFAULT_CATALOG_PARAMS } from '../catalog.config';
import {
  testProductItem3,
  testProductItem4,
  testProductItem5,
} from './catalog.fixture';

export const resetCatalogStore = () => {
  useCatalogStore.setState(DEFAULT_CATALOG_PARAMS);
  window.history.pushState({}, '', '/catalog');
};

export const createCatalogGridItems = () => [
  createProductItem(testProductItem3),
  createProductItem(testProductItem4),
  createProductItem(testProductItem5),
];

export const availableTags = Array.from(
  new Set(
    createCatalogGridItems()
      .map((item) => item.tag)
      .filter((tag): tag is string => Boolean(tag))
  )
);
