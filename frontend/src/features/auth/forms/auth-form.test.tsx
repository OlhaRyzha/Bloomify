import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { validationMessages } from '@/constants/message.constants';
import { renderWithProviders } from '@/test/render';

import AuthForm from './auth-form';
import AuthService from '../api/auth.service';
import { useAuthTokenStore } from '../store/auth-token.store';
import { AUTH_SESSION_COOKIE_NAME } from '../auth-routing';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../api/auth.service', () => ({
  default: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    refreshSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('AuthForm', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.mocked(AuthService.signIn).mockReset();
    vi.mocked(AuthService.signUp).mockReset();
    useAuthTokenStore.getState().clearAccessToken();
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  test('shows register validation errors after an empty submit', async () => {
    const { user } = renderWithProviders(<AuthForm mode='register' />, {
      locale: 'en',
    });

    await user.click(screen.getByRole('button', { name: /^register$/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(validationMessages.requiredField())
      ).toHaveLength(4);
    });
  });

  test('submits valid login values without validation errors', async () => {
    vi.mocked(AuthService.signIn).mockResolvedValue({
      accessToken: 'access-token',
    });

    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'en',
    });

    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(validationMessages.requiredField())
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(validationMessages.invalidEmail)
      ).not.toBeInTheDocument();
    });

    expect(AuthService.signIn).toHaveBeenCalledWith({
      email: 'tom@example.com',
      password: 'password',
    });
    expect(useAuthTokenStore.getState().accessToken).toBe('access-token');
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
    expect(replaceMock).toHaveBeenCalledWith('/en/profile');
  });
});
