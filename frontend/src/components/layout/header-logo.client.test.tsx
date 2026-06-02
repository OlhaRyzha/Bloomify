import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { CLOSE_MOBILE_MENU_EVENT } from './header-events';
import HeaderLogo from './header-logo.client';

describe('HeaderLogo', () => {
  test('links home and requests mobile menu close on navigation', async () => {
    const closeListener = vi.fn();
    window.addEventListener(CLOSE_MOBILE_MENU_EVENT, closeListener);

    const { user } = renderWithProviders(
      <HeaderLogo
        brand='Bloomify'
        href='/uk'
      />,
      { locale: 'uk' }
    );

    const logo = screen.getByRole('link', { name: 'Bloomify' });
    expect(logo).toHaveAttribute('href', '/uk');

    await user.click(logo);

    expect(closeListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(CLOSE_MOBILE_MENU_EVENT, closeListener);
  });
});
