import { describe, expect, test } from 'vitest';

import { translations } from '@/locales/translations';
import { getConfirmationCopy } from './confirmation-copy';

const t = (key: string, vars?: Record<string, unknown>) => {
  const value = translations.en[key as keyof typeof translations.en];
  const template = typeof value === 'string' ? value : key;

  return Object.entries(vars ?? {}).reduce(
    (acc, [name, replacement]) =>
      acc.replaceAll(`{{${name}}}`, String(replacement ?? '')),
    template
  );
};

describe('getConfirmationCopy', () => {
  test('uses a specific action/entity message when it exists', () => {
    expect(
      getConfirmationCopy(t, {
        action: 'delete',
        entity: 'cartItem',
        entityName: 'Rose bouquet',
      })
    ).toMatchObject({
      title: 'Delete item?',
      description: 'Are you sure you want to remove “Rose bouquet” from the cart?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
  });

  test('supports non-cart confirmation actions', () => {
    expect(
      getConfirmationCopy(t, {
        action: 'signOut',
        entity: 'account',
      })
    ).toMatchObject({
      title: 'Sign out?',
      description: 'Are you sure you want to sign out of your account?',
      confirmLabel: 'Sign out',
    });
  });
});
