import {
  RetryFeedbackState,
  TranslatedFeedbackState,
} from '@/components/ui/translated-feedback-state';

import CatalogCardSkeleton from '../../card/catalog-card-skeleton';
import { CATALOG_GRID_CLASSNAME } from '../catalog.config';

type CatalogListStateProps = {
  isError: boolean;
  isEmpty: boolean;
  isLoading: boolean;
  skeletonCount: number;
  onRetry: () => Promise<unknown>;
};

export function CatalogListState({
  isError,
  isEmpty,
  isLoading,
  skeletonCount,
  onRetry,
}: CatalogListStateProps) {
  if (isError) {
    return (
      <RetryFeedbackState
        translationKeyPrefix='catalog'
        onRetry={async () => {
          await onRetry();
        }}
      />
    );
  }

  if (isLoading && isEmpty) {
    return (
      <div className={CATALOG_GRID_CLASSNAME}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <CatalogCardSkeleton key={`catalog-card-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (!isLoading && isEmpty) {
    return (
      <TranslatedFeedbackState
        kind='empty'
        translationKeyPrefix='catalog'
      />
    );
  }

  return null;
}
