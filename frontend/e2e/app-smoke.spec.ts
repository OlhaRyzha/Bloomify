import { expect, test } from '@playwright/test';

import { mockCashOnDeliveryCheckout, mockCatalogProducts } from './helpers/api';
import { e2ePrimaryCatalogItem } from './fixtures/catalog.fixture';
import { goToAppPage, seedCart, seedFavorites } from './helpers/user-flows';

test.beforeEach(async ({ page }) => {
  await mockCatalogProducts(page);
});

const primaryItemName = e2ePrimaryCatalogItem.name;

test('home page supports localized anchor navigation', async ({ page }) => {
  await goToAppPage(page, '/uk');

  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Bloomify' })
  ).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Основна навігація' })
    .getByRole('link', { name: 'Контакти' })
    .click();

  await expect(page.locator('#contact')).toBeInViewport();
});

test('mobile navigation opens, keeps focus usable, and supports anchors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await goToAppPage(page, '/uk');

  const menuButton = page.getByRole('button', { name: 'Відкрити меню' });
  await menuButton.click();

  const mobileNavigation = page.getByRole('navigation', {
    name: 'Мобільна навігація',
  });

  await expect(mobileNavigation).toBeVisible();

  await expect(
    mobileNavigation.getByRole('link', { name: 'Каталог' })
  ).toBeFocused();

  const mobileNavigationBox = await mobileNavigation.boundingBox();

  expect(mobileNavigationBox).toMatchObject({
    height: 764,
    width: 390,
    x: 0,
    y: 80,
  });

  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    )
    .toBe(true);

  await mobileNavigation.getByRole('link', { name: 'Контакти' }).click();

  await expect(mobileNavigation).toBeHidden();
  await expect(page.locator('#contact')).toBeInViewport();
});

test('catalog page renders products from the API boundary', async ({
  page,
}) => {
  await goToAppPage(page, '/uk/catalog');

  await expect(
    page.getByRole('heading', { name: 'Каталог букетів' })
  ).toBeVisible();

  await expect(page.getByText('Біла гармонія')).toBeVisible();
  await expect(page.getByText('Блакитна гармонія')).toBeVisible();
});

test('catalog product details page opens selected bouquet and supports cart action', async ({
  page,
}) => {
  await goToAppPage(page, '/uk/catalog');

  await expect(
    page.getByRole('link', { name: primaryItemName }).first()
  ).toHaveAttribute('href', '/uk/catalog/white-harmony');

  await goToAppPage(page, '/uk/catalog/white-harmony');

  await expect(page).toHaveURL(/\/uk\/catalog\/white-harmony$/);

  await expect(
    page.getByRole('heading', { name: primaryItemName })
  ).toBeVisible();

  await expect(page.getByText('1650 ₴')).toBeVisible();

  await expect(
    page.getByRole('region', { name: 'Дії з товаром' })
  ).toBeVisible();

  await expect(page.getByRole('button', { name: 'До кошика' })).toBeVisible();
});

test('profile redirects anonymous users to sign in', async ({ page }) => {
  await goToAppPage(page, '/uk/profile');

  await expect(page).toHaveURL(/\/uk\/sign-in\?next=%2Fuk%2Fprofile$/);
  await expect(page.getByText('Увійти', { exact: true }).first()).toBeVisible();
});

test('cart flow persists selected bouquet and opens checkout', async ({
  page,
}) => {
  await seedCart(page, [{ id: e2ePrimaryCatalogItem.id, quantity: 1 }]);

  await goToAppPage(page, '/uk/cart');

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
  await seedCart(page, [{ id: e2ePrimaryCatalogItem.id, quantity: 1 }]);

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

  await goToAppPage(page, '/uk/checkout');

  await page.getByLabel("Ім'я та прізвище").fill('Olha Ryzha');
  await page.getByLabel('Телефон').fill('+380671234567');
  await page.getByLabel('Email').fill('olha@example.com');
  await page.getByLabel('Місто').fill('Київ');
  await page.getByLabel('Адреса доставки').fill('Хрещатик 1');

  await page.getByLabel('Оплата при отриманні').check();

  await page.getByRole('button', { name: 'Оформити замовлення' }).click();

  await expect(page.getByText(/замовлення створено/i)).toBeVisible();
});

test('favorites flow persists bouquet and supports removing it', async ({
  page,
}) => {
  await seedFavorites(page, [e2ePrimaryCatalogItem.id]);

  await goToAppPage(page, '/uk/favorites');

  await expect(page.getByText(primaryItemName)).toBeVisible();

  await page
    .getByRole('button', {
      name: new RegExp(`прибрати.*${primaryItemName}.*вибраного`, 'i'),
    })
    .click();

  await expect(
    page.getByRole('heading', {
      name: 'У вас ще немає вибраних букетів',
    })
  ).toBeVisible();
});

test('keyboard navigation keeps focus visible on catalog and auth controls', async ({
  page,
}) => {
  await goToAppPage(page, '/uk/catalog');

  const favoriteButton = page.getByRole('button', {
    name: new RegExp(`додати.*${primaryItemName}.*вибраного`, 'i'),
  });

  await favoriteButton.focus();
  await expect(favoriteButton).toBeFocused();

  await page.keyboard.press('Space');

  await expect(
    page.getByRole('button', {
      name: new RegExp(`прибрати.*${primaryItemName}.*вибраного`, 'i'),
    })
  ).toHaveAttribute('aria-pressed', 'true');

  await goToAppPage(page, '/uk/sign-in');
  await page.bringToFront();

  const emailField = page.getByLabel('Email');
  const passwordField = page.getByLabel('Пароль');

  await emailField.click();
  await expect(emailField).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(passwordField).toBeFocused();
});
