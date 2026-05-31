'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
  getConfirmationCopy,
  type ConfirmationCopy,
} from '@/components/ui/confirmation-copy';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import AuthSessionService from '@/features/auth/auth-session.service';
import { getLocalizedPath } from '@/i18n/routing';
import { useTranslation } from '@/hooks/use-translation';
import { trackAuthSignedOut } from '@/services/analytics/analytics.events';

export default function ProfileSignOutButton() {
  const [confirmationCopy, setConfirmationCopy] =
    useState<ConfirmationCopy | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();

  const handleConfirm = async () => {
    setIsSigningOut(true);

    try {
      await AuthSessionService.signOut();
      trackAuthSignedOut({ locale });
    } catch {
      // Local session is cleared in AuthSessionService even when backend logout fails.
    } finally {
      router.replace(getLocalizedPath('/sign-in', locale));
      router.refresh();
    }
  };

  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={isSigningOut}
        onClick={() => {
          setConfirmationCopy(
            getConfirmationCopy(t, {
              action: 'signOut',
              entity: 'account',
            })
          );
        }}>
        <LogOut
          className='mr-2 h-4 w-4'
          aria-hidden
        />
        {t('profile_sign_out_cta')}
      </Button>

      {confirmationCopy ? (
        <ConfirmationDialog
          open
          tone='warning'
          title={confirmationCopy.title}
          description={confirmationCopy.description}
          confirmLabel={confirmationCopy.confirmLabel}
          cancelLabel={confirmationCopy.cancelLabel}
          closeLabel={confirmationCopy.closeLabel}
          onConfirm={handleConfirm}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmationCopy(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
