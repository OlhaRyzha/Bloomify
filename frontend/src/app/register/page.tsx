import type { Metadata } from 'next';
import AuthForm from '@/features/auth/auth-form';
import AuthShell from '@/features/auth/auth-shell';

export const metadata: Metadata = {
  title: 'Реєстрація',
  description:
    'Створіть акаунт Bloomify, щоб отримувати бонуси, зберігати улюблені композиції та швидше оформлювати замовлення.',
};

export default function RegisterPage() {
  return (
    <AuthShell variant='register'>
      <AuthForm mode='register' />
    </AuthShell>
  );
}
