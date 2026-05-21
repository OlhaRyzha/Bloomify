import type { Page } from '@playwright/test';

export const clearPersistedState = async (page: Page) => {
  await page.goto('/uk');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
};

export const addFirstCatalogItemToCart = async (page: Page) => {
  await page.goto('/uk/catalog');
  await page.getByRole('button', { name: 'До кошика' }).first().click();
};

export const addCatalogItemToFavorites = async (page: Page, name: string) => {
  await page.goto('/uk/catalog');
  await page
    .getByRole('button', { name: new RegExp(`add ${name} to favorites`, 'i') })
    .click();
};
