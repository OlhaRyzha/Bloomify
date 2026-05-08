'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface LoaderProps {
  loading: boolean;
}

const loaderElement = (
  <div
    data-testid='loader'
    className='fixed inset-0 z-50 flex items-center justify-center bg-background/60'>
    <div className='relative h-52 w-52'>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={clsx('loader-circle', `loader-circle-${i + 1}`)}
        />
      ))}
    </div>
  </div>
);

const Loader = ({ loading }: LoaderProps) => {
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', loading);

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [loading]);

  if (!loading) return null;

  if (typeof document === 'undefined') {
    return loaderElement;
  }

  return createPortal(loaderElement, document.body);
};

export default Loader;
