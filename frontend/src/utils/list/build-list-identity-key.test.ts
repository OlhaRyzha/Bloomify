import { describe, expect, test } from 'vitest';

import { buildListIdentityKey } from './build-list-identity-key';

describe('buildListIdentityKey', () => {
  test('builds a stable key from namespace and item ids', () => {
    expect(
      buildListIdentityKey('en', [
        { id: 'rose-bouquet' },
        { id: 'white-harmony' },
      ])
    ).toBe('en:rose-bouquet,white-harmony');
  });

  test('supports numeric ids', () => {
    expect(buildListIdentityKey('orders', [{ id: 1 }, { id: 2 }])).toBe(
      'orders:1,2'
    );
  });
});
