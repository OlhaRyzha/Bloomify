'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { FALLBACK_IMAGE_SRC } from '@/constants/image.constants';
import { isString } from '@/utils/guards/is-string';

type FallbackImageProps = Omit<ImageProps, 'src'> & {
  fallbackSrc?: ImageProps['src'];
  src?: ImageProps['src'] | null;
};

function normalizeImageSrc(
  src?: ImageProps['src'] | null
): ImageProps['src'] | null {
  if (!src) {
    return null;
  }

  if (!isString(src)) {
    return src;
  }

  if (src.startsWith('http') || src.startsWith('/')) {
    return src;
  }

  return `/${src}`;
}

export default function FallbackImage({
  alt,
  fallbackSrc = FALLBACK_IMAGE_SRC,
  onError,
  src,
  ...props
}: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps['src'] | null>(null);

  const normalizedSrc = normalizeImageSrc(src);
  const requestedSrc = normalizedSrc ?? fallbackSrc;
  const currentSrc = failedSrc === requestedSrc ? fallbackSrc : requestedSrc;

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setFailedSrc(currentSrc);
        }

        onError?.(event);
      }}
    />
  );
}
