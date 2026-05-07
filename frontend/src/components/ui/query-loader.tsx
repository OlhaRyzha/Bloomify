'use client';

import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import Loader from './loader';
import { isObject } from '@/utils/guards/is-object';
import { isBoolean } from '@/utils/guards/is-boolean';

type LoaderMeta = {
  showGlobalLoader?: boolean;
};

const shouldShowGlobalLoader = (meta: unknown): boolean => {
  if (!isObject(meta)) {
    return true;
  }

  const value = (meta as LoaderMeta).showGlobalLoader;
  return isBoolean(value) ? value : true;
};

export default function QueryLoader() {
  const pendingQueriesCount = useIsFetching({
    predicate: (query) =>
      query.state.status === 'pending' &&
      shouldShowGlobalLoader(query.options.meta),
  });
  const pendingMutationsCount = useIsMutating({
    predicate: (mutation) => shouldShowGlobalLoader(mutation.options.meta),
  });
  const isLoading = pendingQueriesCount > 0 || pendingMutationsCount > 0;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        setIsVisible(isLoading);
      },
      isLoading ? 150 : 0
    );

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  return <Loader loading={isVisible} />;
}
