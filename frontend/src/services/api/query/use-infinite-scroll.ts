import { RefObject, useEffect } from 'react';

type UseInfiniteScrollParams = {
  targetRef: RefObject<Element | null>;
  enabled?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number;
};

export function useInfiniteScroll({
  targetRef,
  enabled = true,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  rootMargin = '200px',
  threshold = 0,
}: UseInfiniteScrollParams) {
  useEffect(() => {
    const element = targetRef.current;

    if (!enabled || !element || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    enabled,
    targetRef,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    rootMargin,
    threshold,
  ]);
}
