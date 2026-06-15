import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useLocale } from '@/components/providers/locale-provider';
import type { ApiError } from '@/services/api/errors/api-error';
import type { MySubscription } from './subscription.schemas';
import SubscriptionService from './subscription.service';
import { subscriptionQueryKeys } from './query-keys';

type Options = Omit<UseQueryOptions<MySubscription | null, ApiError>, 'queryKey' | 'queryFn'>;

export function useMySubscription(enabled = true, options?: Options) {
  const { locale } = useLocale();

  return useQuery<MySubscription | null, ApiError>({
    queryKey: subscriptionQueryKeys.mine(locale),
    queryFn: () => SubscriptionService.getMySubscription(locale),
    enabled,
    ...options,
  });
}
