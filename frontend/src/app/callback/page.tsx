import AuthCallback from '@/features/auth/components/auth-callback.client';
import Auth0ProviderClient from '@/features/auth/components/auth0-provider.client';

export default function AuthCallbackPage() {
  return (
    <Auth0ProviderClient>
      <AuthCallback />
    </Auth0ProviderClient>
  );
}
