import type { LoginValues, RegisterValues } from '../../forms/auth.schemas';

type SignInPayload = LoginValues;
type SignUpPayload = Omit<RegisterValues, 'confirmPassword'>;

export const createSignInPayload = (
  overrides: Partial<SignInPayload> = {}
): SignInPayload => ({
  email: 'olha@example.com',
  password: 'password123',
  ...overrides,
});

export const createSignUpPayload = (
  overrides: Partial<SignUpPayload> = {}
): SignUpPayload => ({
  name: 'Olena Kolomiec',
  ...createSignInPayload(),
  ...overrides,
});
