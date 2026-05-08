import type { Metadata } from 'next';
import AuthForm from '@/features/auth/forms/auth-form';
import AuthShell from '@/features/auth/auth-shell';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_register_title'),
    description: t('metadata_register_description'),
  };
}

export default function RegisterPage() {
  return (
    <AuthShell variant='register'>
      <AuthForm mode='register' />
    </AuthShell>
  );
}
