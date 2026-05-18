import { screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { validationMessages } from '@/constants/message.constants';
import { renderWithProviders } from '@/test/render';

import AuthForm from './auth-form';

describe('AuthForm', () => {
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
    const { user } = renderWithProviders(<AuthForm mode='login' />, {
      locale: 'en',
    });

    await user.type(screen.getByLabelText(/email/i), 'olha@example.com');
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
  });
});
