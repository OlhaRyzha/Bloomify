'use client';

import Link from 'next/link';

import { CLOSE_MOBILE_MENU_EVENT } from './header-events';

type HeaderLogoProps = {
  brand: string;
  href: string;
};

export default function HeaderLogo({ brand, href }: HeaderLogoProps) {
  return (
    <Link
      href={href}
      className='flex min-w-0 shrink-0 items-center gap-2'
      onClick={() => {
        window.dispatchEvent(new Event(CLOSE_MOBILE_MENU_EVENT));
      }}>
      <span className='bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl'>
        {brand}
      </span>
    </Link>
  );
}
