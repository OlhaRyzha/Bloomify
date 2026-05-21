import { expect, test } from '@playwright/test';

import { mockCashOnDeliveryCheckout, mockCatalogProducts } from './helpers/api';
import { e2ePrimaryCatalogItem } from './fixtures/catalog.fixture';
import {
  addCatalogItemToFavorites,
  addFirstCatalogItemToCart,
  clearPersistedState,
} from './helpers/user-flows';

test.beforeEach(async ({ page }) => {
  await mockCatalogProducts(page);
});

const primaryItemName = e2ePrimaryCatalogItem.name;

test('home page supports localized anchor navigation', async ({ page }) => {
  await page.goto('/uk');

  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Bloomify' })
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Основна навігація' })
    .getByRole('link', { name: 'Контакти' })
    .click();

  await expect(page).toHaveURL(/\/uk#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
});

test('catalog page renders products from the API boundary', async ({ page }) => {
  await page.goto('/uk/catalog');

  await expect(
    page.getByRole('heading', { name: 'Каталог букетів' })
  ).toBeVisible();
  await expect(page.getByText('Біла гармонія')).toBeVisible();
  await expect(page.getByText('Блакитна гармонія')).toBeVisible();
});

test('profile redirects anonymous users to sign in', async ({ page }) => {
  await page.goto('/uk/profile');

  await expect(page).toHaveURL(/\/uk\/sign-in\?next=%2Fuk%2Fprofile$/);
  await expect(page.getByText('Увійти', { exact: true }).first()).toBeVisible();
});

test('cart flow persists selected bouquet and opens checkout', async ({
  page,
}) => {
  await clearPersistedState(page);
  await addFirstCatalogItemToCart(page);

  await page.goto('/uk/cart');

  await expect(page.getByRole('heading', { name: 'Кошик' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: primaryItemName })
  ).toBeVisible();
  await expect(page.getByText('Разом')).toBeVisible();

  await page.getByRole('link', { name: 'Оформити замовлення' }).click();

  await expect(page).toHaveURL(/\/uk\/checkout$/);
  await expect(
    page.getByRole('heading', { name: 'Дані доставки' })
  ).toBeVisible();
});

test('checkout cash-on-delivery submits order without LiqPay handoff', async ({
  page,
}) => {
  await clearPersistedState(page);
  await addFirstCatalogItemToCart(page);

  await mockCashOnDeliveryCheckout(page, (payload) => {
    expect(payload).toMatchObject({
      customerName: 'Olha Ryzha',
      email: 'olha@example.com',
      phone: '+380671234567',
      city: 'Київ',
      address: 'Хрещатик 1',
      paymentMethod: 'cash_on_delivery',
      items: [{ id: 'white-harmony', quantity: 1 }],
    });
  });

  await page.goto('/uk/checkout');
  await page.getByLabel("Ім'я та прізвище").fill('Olha Ryzha');
  await page.getByLabel('Телефон').fill('+380671234567');
  await page.getByLabel('Email').fill('olha@example.com');
  await page.getByLabel('Місто').fill('Київ');
  await page.getByLabel('Адреса доставки').fill('Хрещатик 1');
  await page.getByLabel('Оплата при отриманні').check();
  await page.getByRole('button', { name: 'Оплатити замовлення' }).click();

  await expect(
    page.getByRole('status').filter({
      hasText: 'Замовлення створено',
    })
  ).toBeVisible();
});

test('favorites flow persists bouquet and supports removing it', async ({
  page,
}) => {
  await clearPersistedState(page);
  await addCatalogItemToFavorites(page, primaryItemName);
  await page.goto('/uk/favorites');

  await expect(page.getByText(primaryItemName)).toBeVisible();

  await page
    .getByRole('button', {
      name: new RegExp(`remove ${primaryItemName} from favorites`, 'i'),
    })
    .click();

  await expect(
    page.getByRole('heading', {
      name: 'У вас ще немає вибраних букетів',
    })
  ).toBeVisible();
});
