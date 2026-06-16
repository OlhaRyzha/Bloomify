import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useLocale } from '@/components/providers/locale-provider';
import type { ApiError } from '@/services/api/errors/api-error';
import type { SubscriptionPlan } from './subscription.schemas';
import SubscriptionService from './subscription.service';
import { subscriptionQueryKeys } from './query-keys';

type Options = Omit<UseQueryOptions<SubscriptionPlan[], ApiError>, 'queryKey' | 'queryFn'>;

export function useSubscriptionPlans(options?: Options) {
  const { locale } = useLocale();

  return useQuery<SubscriptionPlan[], ApiError>({
    queryKey: subscriptionQueryKeys.plans(locale),
    queryFn: () => SubscriptionService.getPlans(locale),
    staleTime: 60_000,
    ...options,
  });
}
