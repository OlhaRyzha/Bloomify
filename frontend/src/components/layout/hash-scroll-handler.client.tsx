'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SCROLL_RETRY_DELAYS_MS = [0, 50, 150, 300];

const getHashTargetId = (hash: string) => {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;

  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const scrollToHashTarget = (hash: string) => {
  const targetId = getHashTargetId(hash);
  if (!targetId) return;

  for (const delay of SCROLL_RETRY_DELAYS_MS) {
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, delay);
  }
};

export default function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) {
      scrollToHashTarget(window.location.hash);
    }
  }, [pathname]);

  useEffect(() => {
    const handleHashChange = () => {
      scrollToHashTarget(window.location.hash);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) return;

      const isSamePath = url.pathname === window.location.pathname;
      if (isSamePath) {
        window.setTimeout(() => scrollToHashTarget(url.hash), 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return null;
}
