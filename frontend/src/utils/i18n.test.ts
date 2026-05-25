import { describe, expect, test } from 'vitest';

import { getBouquetCountLabel } from './i18n';

describe('getBouquetCountLabel', () => {
  test.each([
    [1, 'букет'],
    [2, 'букети'],
    [5, 'букетів'],
    [21, 'букет'],
    [22, 'букети'],
    [25, 'букетів'],
  ])('formats Ukrainian bouquet count label for %i', (count, label) => {
    expect(getBouquetCountLabel(count, 'uk')).toBe(label);
  });

  test('formats English bouquet count labels', () => {
    expect(getBouquetCountLabel(1, 'en')).toBe('bouquet');
    expect(getBouquetCountLabel(2, 'en')).toBe('bouquets');
  });
});
