import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { validationMessages } from '@/constants/message.constants';
import { createDeferred } from '@/test/deferred';
import { renderWithProviders } from '@/test/render';
import { ApiError, ApiErrorType } from '@/utils/api/api-error';

import AuthForm from './auth-form';
import AuthSessionService from '../auth-session.service';
import { createSignInPayload, createSignUpPayload } from '../auth.factory';
import { useAuthTokenStore } from '../store/auth-token.store';
import { AUTH_SESSION_COOKIE_NAME } from '../auth-routing';

const replaceMock = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => searchParams,
}));

const loginWithRedirectMock = vi.fn();

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isLoading: false,
    loginWithRedirect: loginWithRedirectMock,
  }),
}));

vi.mock('../auth-session.service', () => ({
  default: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    refresh: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('AuthForm', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.mocked(AuthSessionService.signIn).mockReset();
    vi.mocked(AuthSessionService.signUp).mockReset();
    loginWithRedirectMock.mockReset();
    useAuthTokenStore.getState().clearAccessToken();
    document.cookie = `${AUTH_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
    searchParams = new URLSearchParams();
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
    vi.mocked(AuthSessionService.signIn).mockImplementation(async () => {
      useAuthTokenStore.getState().setAccessToken('access-token');
      document.cookie = `${AUTH_SESSION_COOKIE_NAME}=1; Path=/`;

      return {
        accessToken: 'access-token',
      };
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

    expect(AuthSessionService.signIn).toHaveBeenCalledWith(
      createSignInPayload({
        email: 'tom@example.com',
        password: 'password',
      })
    );
    expect(useAuthTokenStore.getState().accessToken).toBe('access-token');
    expect(document.cookie).toContain(`${AUTH_SESSION_COOKIE_NAME}=1`);
    expect(replaceMock).toHaveBeenCalledWith('/en/profile');
  });

  test('submits sign up without confirmPassword payload', async () => {
    vi.mocked(AuthSessionService.signUp).mockImplementation(async () => {
      useAuthTokenStore.getState().setAccessToken('registered-access-token');

      return {
        accessToken: 'registered-access-token',
      };
    });

    const { user } = renderWithProviders(<AuthForm mode='register' />, {
      locale: 'en',
    });

    await user.type(screen.getByLabelText(/name/i), 'Olha Ryzha');
    await user.type(screen.getByLabelText(/email/i), 'olha@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^register$/i }));

    await waitFor(() => {
      expect(AuthSessionService.signUp).toHaveBeenCalledWith(
        createSignUpPayload()
      );
    });

    expect(useAuthTokenStore.getState().accessToken).toBe(
      'registered-access-token'
    );
    expect(replaceMock).toHaveBeenCalledWith('/en/profile');
  });

  test('redirects to safe next path after login', async () => {
    searchParams = new URLSearchParams({ next: '/uk/checkout' });
    vi.mocked(AuthSessionService.signIn).mockResolvedValue({
      accessToken: 'access-token',
    });

    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'uk',
    });

    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.type(screen.getByLabelText(/^пароль$/i), 'password');
    await user.click(screen.getByRole('button', { name: /^увійти$/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/uk/checkout');
    });
  });

  test('ignores unsafe next path after login', async () => {
    searchParams = new URLSearchParams({ next: 'https://example.com' });
    vi.mocked(AuthSessionService.signIn).mockResolvedValue({
      accessToken: 'access-token',
    });

    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'en',
    });

    await user.type(screen.getByLabelText(/email/i), 'tom@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/en/profile');
    });
  });

  test('shows form-level API errors and preserves entered values', async () => {
    vi.mocked(AuthSessionService.signIn).mockRejectedValue(
      new ApiError(ApiErrorType.Unauthorized, 'Invalid email or password')
    );

    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'en',
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'olha@example.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    expect(await screen.findByRole('alert', { name: '' })).toHaveTextContent(
      'Invalid email or password'
    );
    expect(emailInput).toHaveValue('olha@example.com');
    expect(passwordInput).toHaveValue('wrong-password');
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test('disables submit button while auth request is pending', async () => {
    const deferred = createDeferred<{ accessToken: string }>();
    vi.mocked(AuthSessionService.signIn).mockReturnValue(deferred.promise);

    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'en',
    });

    const submitButton = screen.getByRole('button', { name: /^log in$/i });

    await user.type(screen.getByLabelText(/email/i), 'olha@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    deferred.resolve({ accessToken: 'access-token' });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/en/profile');
    });
  });

  test('starts Google login through Auth0', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH0_AUDIENCE', 'https://bloomify-api');

    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'en',
    });

    await user.click(screen.getByRole('button', { name: /google/i }));

    expect(loginWithRedirectMock).toHaveBeenCalledWith({
      authorizationParams: {
        connection: 'google-oauth2',
        prompt: 'select_account',
        audience: 'https://bloomify-api',
        scope: 'openid profile email',
      },
      appState: {
        returnTo: '/en/profile',
      },
    });

    vi.unstubAllEnvs();
  });
});
