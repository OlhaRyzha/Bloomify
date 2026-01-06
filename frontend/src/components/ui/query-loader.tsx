'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import Loader from './loader';

export default function QueryLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching + isMutating > 0;

  return <Loader loading={isLoading} />;
}
