'use client';

import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import FeedbackState from '@/components/ui/feedback-state';
import { useLocale } from '@/components/providers/locale-provider';
import AuthSessionService from '@/features/auth/auth-session.service';
import { getLocalizedPath } from '@/i18n/routing';
import { useTranslation } from '@/hooks/use-translation';

export default function AuthCallbackPage() {
  const { error, getAccessTokenSilently, getIdTokenClaims, isLoading } =
    useAuth0();
  const router = useRouter();
  const { locale } = useLocale();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading || error) {
      return;
    }

    const completeAuth0SignIn = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        const idTokenClaims = await getIdTokenClaims();
        const idToken = idTokenClaims?.__raw;
        if (!idToken) {
          throw new Error('Missing Auth0 ID token');
        }

        await AuthSessionService.signInWithAuth0(accessToken, idToken);
        router.replace(getLocalizedPath('/profile', locale));
      } catch {
        router.replace(getLocalizedPath('/sign-in', locale));
      }
    };

    void completeAuth0SignIn();
  }, [error, getAccessTokenSilently, getIdTokenClaims, isLoading, locale, router]);

  if (error) {
    return (
      <FeedbackState
        title={t('checkout_error_title')}
        description={error.message}
      />
    );
  }

  return (
    <FeedbackState
      title={t('checkout_payment_sync_title')}
      description={t('checkout_payment_sync_description')}
    />
  );
}
