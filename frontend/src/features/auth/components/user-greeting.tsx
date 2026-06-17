'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

import { useCurrentUser } from '../hooks/use-current-user';

type UserGreetingProps = {
  messageKey: string;
  className?: string;
};

/**
 * Subtle, page-specific personalised greeting for authenticated users.
 * Uses the first name only and renders nothing for guests, so it is safe to
 * drop into any page.
 */
export default function UserGreeting({
  messageKey,
  className,
}: UserGreetingProps) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  const fullName = user?.name?.trim();
  if (!fullName) {
    return null;
  }

  const firstName = fullName.split(/\s+/)[0];

  return (
    <p
      className={cn(
        'mb-6 text-center text-sm text-muted-foreground',
        className
      )}>
      {t(messageKey, { name: firstName })}
    </p>
  );
}
