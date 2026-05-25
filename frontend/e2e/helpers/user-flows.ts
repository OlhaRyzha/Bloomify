import type { Page } from '@playwright/test';

type CartSeedItem = {
  id: string;
  quantity: number;
};

const waitForVisibleImages = async (page: Page) => {
  await page
    .waitForFunction(() => {
      const visibleImages = Array.from(document.images).filter((image) => {
        const rect = image.getBoundingClientRect();
        const style = window.getComputedStyle(image);

        return (
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      });

      return visibleImages.every(
        (image) => image.complete && image.naturalWidth > 0
      );
    }, null, { timeout: 5_000 })
    .catch(() => undefined);
};

export const goToAppPage = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(
    () => undefined
  );
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(
    () => undefined
  );
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  await waitForVisibleImages(page);
};

export const clearPersistedState = async (page: Page) => {
  await goToAppPage(page, '/uk/sign-in');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
};

export const seedCart = async (page: Page, items: CartSeedItem[]) => {
  await page.addInitScript((cartItems) => {
    window.localStorage.setItem(
      'bloomify-cart',
      JSON.stringify({
        state: { items: cartItems },
        version: 0,
      })
    );
  }, items);
};

export const seedFavorites = async (page: Page, ids: string[]) => {
  await page.addInitScript((favoriteIds) => {
    window.localStorage.setItem(
      'bloomify-favorites',
      JSON.stringify({
        state: { ids: favoriteIds },
        version: 0,
      })
    );
  }, ids);
};
