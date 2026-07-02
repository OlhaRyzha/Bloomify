import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { StaticImageData } from 'next/image';

import { FALLBACK_IMAGE_SRC } from '@/constants/image.constants';
import { isString } from '@/utils/guards/is-string';
import FallbackImage from './fallback-image';

const fallbackImagePath =
  isString(FALLBACK_IMAGE_SRC)
    ? FALLBACK_IMAGE_SRC
    : (FALLBACK_IMAGE_SRC as StaticImageData).src;

describe('FallbackImage', () => {
  test('uses the default image when the requested image fails to load', () => {
    render(
      <FallbackImage
        src='/missing-image.jpg'
        alt='Broken bouquet'
        width={120}
        height={120}
      />
    );

    const image = screen.getByAltText('Broken bouquet');

    fireEvent.error(image);

    expect(image).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent(fallbackImagePath))
    );
  });
});
