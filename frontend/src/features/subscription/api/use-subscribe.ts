import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import SubscriptionService from './subscription.service';
import { subscriptionQueryKeys } from './query-keys';
import { submitLiqPayCheckout } from '@/features/checkout/components/checkout.helpers';
import { isString } from '@/utils/guards/is-string';

export function useSubscribe() {
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = isString(params?.locale) ? params.locale : undefined;

  return useMutation({
    mutationFn: (planId: number) =>
      SubscriptionService.subscribe(planId, locale),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.all,
      });
      submitLiqPayCheckout(data.liqpay);
    },
  });
}
