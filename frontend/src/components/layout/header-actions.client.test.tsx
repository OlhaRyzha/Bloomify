import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import HeaderActions from './header-actions.client';
import { CLOSE_MOBILE_MENU_EVENT } from './header-events';
import { AUTH_SESSION_COOKIE_NAME } from '@/features/auth/auth-routing';

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
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  test('points account action to the localized profile route with session marker', async () => {
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

    renderWithProviders(
      <HeaderActions
        copy={copy}
        mobileNavId='mobile-navigation'
        navigationLinks={navigationLinks}
      />,
      { locale: 'uk' }
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
        'href',
        '/uk/profile'
      );
    });
  });

  test('points anonymous profile action to localized sign in', () => {
    renderWithProviders(
      <HeaderActions
        copy={copy}
        mobileNavId='mobile-navigation'
        navigationLinks={navigationLinks}
      />,
      { locale: 'uk' }
    );

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/uk/sign-in'
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
    const authLink = within(mobileNavigation).getByRole('link', {
      name: /log in/i,
    });
    expect(authLink).toHaveAttribute('href', '/uk/sign-in');

    await user.click(screen.getByRole('link', { name: 'Contact' }));

    await waitFor(() => {
      expect(mobileNavigation).not.toBeInTheDocument();
    });
  });

  test('closes mobile menu after cart navigation', async () => {
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

    await user.click(screen.getByRole('link', { name: 'Cart' }));

    await waitFor(() => {
      expect(mobileNavigation).not.toBeInTheDocument();
    });
  });

  test('closes mobile menu when header logo requests menu close', async () => {
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

    window.dispatchEvent(new Event(CLOSE_MOBILE_MENU_EVENT));

    await waitFor(() => {
      expect(mobileNavigation).not.toBeInTheDocument();
    });
  });

  test('mobile auth action points to profile for authenticated users', async () => {
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

    const { user } = renderWithProviders(
      <HeaderActions
        copy={copy}
        mobileNavId='mobile-navigation'
        navigationLinks={navigationLinks}
      />,
      { locale: 'uk' }
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
        'href',
        '/uk/profile'
      );
    });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    });

    expect(
      within(mobileNavigation).getByRole('link', { name: /profile/i })
    ).toHaveAttribute('href', '/uk/profile');
  });

  test('moves focus into mobile navigation and returns it after Escape', async () => {
    const { user } = renderWithProviders(
      <HeaderActions
        copy={copy}
        mobileNavId='mobile-navigation'
        navigationLinks={navigationLinks}
      />,
      { locale: 'uk' }
    );

    const menuButton = screen.getByRole('button', { name: 'Open menu' });

    await user.click(menuButton);

    expect(screen.getByRole('link', { name: 'Catalog' })).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(
        screen.queryByRole('navigation', { name: 'Mobile navigation' })
      ).not.toBeInTheDocument();
    });
    expect(menuButton).toHaveFocus();
  });
});
