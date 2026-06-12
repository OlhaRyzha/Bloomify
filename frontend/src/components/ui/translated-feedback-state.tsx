'use client';

import type { ComponentProps } from 'react';

import { getLocalizedPath } from '@/i18n/routing';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import FeedbackState from './feedback-state';

type FeedbackStateBaseProps = Omit<
  ComponentProps<typeof FeedbackState>,
  | 'actionHref'
  | 'actionLabel'
  | 'description'
  | 'onAction'
  | 'title'
  | 'tone'
>;

type FeedbackTranslationPrefix =
  | 'cart'
  | 'catalog'
  | 'checkout'
  | 'orders'
  | 'sections_favorites';

type FeedbackKind = 'empty' | 'error';

type TranslatedFeedbackStateProps = FeedbackStateBaseProps & {
  kind: FeedbackKind;
  translationKeyPrefix: FeedbackTranslationPrefix;
  actionHref?: string;
  actionLabelKey?: string;
  onAction?: () => void | Promise<void>;
};

export function TranslatedFeedbackState({
  kind,
  translationKeyPrefix,
  actionHref,
  actionLabelKey,
  onAction,
  ...props
}: TranslatedFeedbackStateProps) {
  const { t } = useTranslation();
  const tone = kind === 'error' ? 'error' : 'neutral';
  const fallbackActionLabelKey =
    kind === 'error' && onAction ? 'common_try_again' : undefined;
  const resolvedActionLabelKey = actionLabelKey ?? fallbackActionLabelKey;

  return (
    <FeedbackState
      {...props}
      tone={tone}
      title={t(`${translationKeyPrefix}_${kind}_title`)}
      description={t(`${translationKeyPrefix}_${kind}_description`)}
      actionLabel={
        resolvedActionLabelKey ? t(resolvedActionLabelKey) : undefined
      }
      actionHref={actionHref}
      onAction={onAction}
    />
  );
}

type RetryFeedbackStateProps = Omit<
  TranslatedFeedbackStateProps,
  'actionLabelKey' | 'actionHref' | 'kind' | 'onAction'
> & {
  onRetry: () => void | Promise<void>;
};

export function RetryFeedbackState({
  onRetry,
  ...props
}: RetryFeedbackStateProps) {
  return (
    <TranslatedFeedbackState
      {...props}
      kind='error'
      onAction={onRetry}
    />
  );
}

type CatalogActionFeedbackStateProps = Omit<
  TranslatedFeedbackStateProps,
  'actionHref' | 'actionLabelKey' | 'kind' | 'onAction'
> & {
  actionLabelKey?: string;
};

export function CatalogActionFeedbackState({
  actionLabelKey = 'action_go_to_catalog',
  className,
  ...props
}: CatalogActionFeedbackStateProps) {
  const { locale } = useTranslation();

  return (
    <TranslatedFeedbackState
      {...props}
      kind='empty'
      actionLabelKey={actionLabelKey}
      actionHref={getLocalizedPath('/catalog', locale)}
      className={cn('bg-gradient-card shadow-card', className)}
    />
  );
}
