import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/features/auth/forms/auth-form';
import AuthShell from '@/features/auth/components/auth-shell';
import Auth0ProviderClient from '@/features/auth/components/auth0-provider.client';
import { getServerTranslator } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_register_title'),
    description: t('metadata_register_description'),
  };
}

export default function SignUpPage() {
  return (
    <AuthShell variant='register'>
      <Suspense>
        <Auth0ProviderClient>
          <AuthForm mode='register' />
        </Auth0ProviderClient>
      </Suspense>
    </AuthShell>
  );
}
