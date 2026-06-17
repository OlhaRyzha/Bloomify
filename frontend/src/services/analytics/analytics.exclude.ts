import { currentUserQueryKey } from '@/features/auth/hooks/use-current-user';
import type { CurrentUser } from '@/features/auth/lib/server/api/auth.schemas';
import queryClient from '@/services/api/query/query-client';

const EXCLUDED_EMAILS = (
  process.env.NEXT_PUBLIC_ANALYTICS_EXCLUDED_EMAILS ?? ''
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Whether the currently signed-in visitor's email is on the analytics
 * exclusion list (owner/testers), so their page views and events are dropped
 * and the dashboard reflects real visitors only. Reads the signed-in user from
 * the React Query cache, so it only applies once that visitor has logged in on
 * the device. Configure via NEXT_PUBLIC_ANALYTICS_EXCLUDED_EMAILS.
 */
export const isAnalyticsExcludedVisitor = (): boolean => {
  if (EXCLUDED_EMAILS.length === 0) {
    return false;
  }

  const user = queryClient.getQueryData<CurrentUser>(currentUserQueryKey);
  const email = user?.email?.trim().toLowerCase();

  return email ? EXCLUDED_EMAILS.includes(email) : false;
};
