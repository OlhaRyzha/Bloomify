import { useMutation, useQueryClient } from '@tanstack/react-query';
import SubscriptionService from './subscription.service';
import { subscriptionQueryKeys } from './query-keys';

export function useUnsubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: SubscriptionService.unsubscribe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
    },
  });
}
