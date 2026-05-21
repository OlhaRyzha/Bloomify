import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://localhost:8000';

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
  await page.route(`${apiBaseUrl}/products**`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: catalogItems,
    });
  });
});

const clearPersistedState = async (page: Page) => {
  await page.goto('/uk');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
};

const addWhiteHarmonyToCart = async (page: Page) => {
  await page.goto('/uk/catalog');
  await page.getByRole('button', { name: 'До кошика' }).first().click();
};

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
  await addWhiteHarmonyToCart(page);

  await page.goto('/uk/cart');

  await expect(page.getByRole('heading', { name: 'Кошик' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Біла гармонія' })
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
  await addWhiteHarmonyToCart(page);

  await page.route(`${apiBaseUrl}/orders/checkout**`, async (route) => {
    const requestBody = route.request().postDataJSON();

    expect(requestBody).toMatchObject({
      customerName: 'Olha Ryzha',
      email: 'olha@example.com',
      phone: '+380671234567',
      city: 'Київ',
      address: 'Хрещатик 1',
      paymentMethod: 'cash_on_delivery',
      items: [{ id: 'white-harmony', quantity: 1 }],
    });

    await route.fulfill({
      contentType: 'application/json',
      json: {
        orderId: 42,
        status: 'pending',
        paymentStatus: 'pending',
        paymentProvider: 'cash_on_delivery',
        paymentMethod: 'cash_on_delivery',
        liqpay: null,
      },
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
  await page.goto('/uk/catalog');

  await page
    .getByRole('button', { name: /add біла гармонія to favorites/i })
    .click();
  await page.goto('/uk/favorites');

  await expect(page.getByText('Біла гармонія')).toBeVisible();

  await page
    .getByRole('button', { name: /remove біла гармонія from favorites/i })
    .click();

  await expect(
    page.getByRole('heading', {
      name: 'У вас ще немає вибраних букетів',
    })
  ).toBeVisible();
});
