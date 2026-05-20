import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import HeaderActions from './header-actions.client';

let pathnameMock = '/uk/catalog';

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock,
}));

vi.mock('../ui/locale-switcher', () => ({
  default: () => <div data-testid='locale-switcher' />,
}));

const copy = {
  cartLabel: 'Cart',
  closeMenuLabel: 'Close menu',
  loginLabel: 'Log in',
  mobileNavigationLabel: 'Mobile navigation',
  openMenuLabel: 'Open menu',
  profileLabel: 'Profile',
};

const navigationLinks = [
  { href: '/uk/catalog', key: 'catalog', label: 'Catalog' },
  { href: '/uk/#contact', key: 'contact', label: 'Contact' },
];

describe('HeaderActions', () => {
  beforeEach(() => {
    pathnameMock = '/uk/catalog';
  });

  test('points profile action to the localized profile route', () => {
    renderWithProviders(
      <HeaderActions
        copy={copy}
        mobileNavId='mobile-navigation'
        navigationLinks={navigationLinks}
      />,
      { locale: 'uk' }
    );

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/uk/profile'
    );
  });

  test('mobile auth action points to sign in and closes menu after navigation', async () => {
    const { user } = renderWithProviders(
      <HeaderActions
        copy={copy}
        mobileNavId='mobile-navigation'
        navigationLinks={navigationLinks}
      />,
      { locale: 'uk' }
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    });
    const authLink = screen.getByRole('link', { name: /log in/i });
    expect(authLink).toHaveAttribute('href', '/uk/sign-in');

    await user.click(screen.getByRole('link', { name: 'Contact' }));

    await waitFor(() => {
      expect(mobileNavigation).not.toBeInTheDocument();
    });
  });
});
