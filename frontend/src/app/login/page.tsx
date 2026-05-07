import type { Metadata } from 'next';
import AuthForm from '@/features/auth/forms/auth-form';
import AuthShell from '@/features/auth/auth-shell';

export const metadata: Metadata = {
  title: 'Вхід',
  description:
    'Увійдіть до Bloomify, щоб керувати замовленнями, підписками та улюбленими букетами.',
};

export default function LoginPage() {
  return (
    <AuthShell variant='login'>
      <AuthForm mode='login' />
    </AuthShell>
  );
}
