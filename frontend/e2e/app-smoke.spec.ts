import { expect, test } from '@playwright/test';

const catalogItems = [
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
];

test.beforeEach(async ({ page }) => {
  await page.route('**/products**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: catalogItems,
    });
  });
});

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
