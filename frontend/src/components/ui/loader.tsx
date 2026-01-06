'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

interface LoaderProps {
  loading: boolean;
}

const Loader = ({ loading }: LoaderProps) => {
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', loading);
  }, [loading]);

  if (!loading) return null;

  return (
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
};

export default Loader;
