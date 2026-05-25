'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { FALLBACK_IMAGE_SRC } from '@/constants/image.constants';

type FallbackImageProps = Omit<ImageProps, 'src'> & {
  fallbackSrc?: ImageProps['src'];
  src?: ImageProps['src'] | null;
};

export default function FallbackImage({
  alt,
  fallbackSrc = FALLBACK_IMAGE_SRC,
  onError,
  src,
  ...props
}: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps['src'] | null>(null);
  const requestedSrc = src ?? fallbackSrc;
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
