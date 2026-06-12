import { CatalogActionFeedbackState } from '@/components/ui/translated-feedback-state';

export default function CartEmptyState() {
  return <CatalogActionFeedbackState translationKeyPrefix='cart' />;
}
