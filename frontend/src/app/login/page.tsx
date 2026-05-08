import type { Metadata } from 'next';
import AuthForm from '@/features/auth/forms/auth-form';
import AuthShell from '@/features/auth/auth-shell';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_login_title'),
    description: t('metadata_login_description'),
  };
}

export default function LoginPage() {
  return (
    <AuthShell variant='login'>
      <AuthForm mode='login' />
    </AuthShell>
  );
}
