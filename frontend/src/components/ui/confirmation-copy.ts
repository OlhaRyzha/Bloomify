import type { useTranslation } from '@/hooks/use-translation';

type Translation = ReturnType<typeof useTranslation>['t'];

export type ConfirmationAction =
  | 'clear'
  | 'delete'
  | 'signOut'
  | 'unsubscribe';

export type ConfirmationEntity =
  | 'account'
  | 'cart'
  | 'cartItem'
  | 'subscription';

export type ConfirmationCopyRequest = {
  action: ConfirmationAction;
  entity: ConfirmationEntity;
  entityName?: string;
};

export type ConfirmationCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
};

const getOptionalTranslation = (
  t: Translation,
  key: string,
  vars?: Record<string, string>
) => {
  const value = t(key, vars);
  return value === key ? undefined : value;
};

export const getConfirmationCopy = (
  t: Translation,
  { action, entity, entityName }: ConfirmationCopyRequest
): ConfirmationCopy => {
  const entityLabel =
    entityName ??
    getOptionalTranslation(t, `confirmation_entity_${entity}`) ??
    entity;

  const description =
    getOptionalTranslation(t, `confirmation_${action}_${entity}_description`, {
      entity: entityLabel,
    }) ??
    t('confirmation_generic_description', {
      action: t(`confirmation_action_${action}`),
      entity: entityLabel,
    });

  return {
    title: t(`confirmation_${action}_title`),
    description,
    confirmLabel: t(`confirmation_confirm_${action}`),
    cancelLabel: t('confirmation_cancel'),
    closeLabel: t('confirmation_close'),
  };
};
