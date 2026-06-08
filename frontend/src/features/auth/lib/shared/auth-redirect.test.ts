import { describe, expect, test } from 'vitest';

import {
  getPostAuthRedirectPath,
  getSignInPathWithNext,
  isSafeAuthRedirectPath,
} from './auth-redirect';

describe('auth redirects', () => {
  test.each(['/profile', '/uk/profile', '/checkout?step=payment'])(
    'accepts safe relative redirect %s',
    (path) => {
      expect(isSafeAuthRedirectPath(path)).toBe(true);
    }
  );

  test.each([null, undefined, '', 'https://example.com', '//example.com'])(
    'rejects unsafe redirect %s',
    (path) => {
      expect(isSafeAuthRedirectPath(path)).toBe(false);
    }
  );

  test('localizes safe post-auth redirect paths', () => {
    expect(getPostAuthRedirectPath('/profile/orders', 'uk')).toBe(
      '/uk/profile/orders'
    );
  });

  test('falls back to localized profile for unsafe paths', () => {
    expect(getPostAuthRedirectPath('https://example.com', 'uk')).toBe(
      '/uk/profile'
    );
  });

  test('builds sign-in path with encoded safe next path', () => {
    expect(getSignInPathWithNext('/uk/profile?tab=orders', 'uk')).toBe(
      '/uk/sign-in?next=%2Fuk%2Fprofile%3Ftab%3Dorders'
    );
  });
});
