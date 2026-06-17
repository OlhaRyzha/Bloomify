'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { formatTemplate } from '@/utils/i18n';

import { useCurrentUser } from '../hooks/use-current-user';

type UserGreetingProps = {
  className?: string;
};

/**
 * Subtle personalised greeting for authenticated users. Renders nothing for
 * guests or while the name is unavailable, so it is safe to drop into any page.
 */
export default function UserGreeting({ className }: UserGreetingProps) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  const name = user?.name?.trim();
  if (!name) {
    return null;
  }

  return (
    <p
      className={cn(
        'mb-6 text-center text-sm text-muted-foreground',
        className
      )}>
      {formatTemplate(t('greeting_welcome'), { name })}
    </p>
  );
}
