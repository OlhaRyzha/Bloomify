import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';

export type NavigationKey = 'catalog' | 'favorites' | 'subscription' | 'about' | 'contact';

export const NAVIGATION_LINKS: { key: NavigationKey; href: string }[] = [
  { key: 'catalog', href: '/catalog' },
  { key: 'favorites', href: '/favorites' },
  { key: 'subscription', href: '/#subscription' },
  { key: 'about', href: '/#about' },
  { key: 'contact', href: '/#contact' },
];

export type ServiceKey = 'wedding' | 'corporate' | 'events' | 'gifts' | 'delivery';

export const SERVICE_LINKS: { key: ServiceKey; href: string }[] = [
  { key: 'wedding', href: '/#services' },
  { key: 'corporate', href: '/#services' },
  { key: 'events', href: '/#services' },
  { key: 'gifts', href: '/#services' },
  { key: 'delivery', href: '/#services' },
];

const kyivAddress = 'м. Київ, вул. Хрещатик, 1';
const kyivMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  kyivAddress
)}`;

type FooterContactItem = {
  id: string;
  icon: LucideIcon;
  content: ReactNode;
};

export const footerContactItems: FooterContactItem[] = [
  {
    id: 'phone',
    icon: Phone,
    content: (
      <a
        href='tel:+380991234567'
        className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
        +38 (099) 123-45-67
      </a>
    ),
  },
  {
    id: 'email',
    icon: Mail,
    content: (
      <a
        href='mailto:hello@bloomify.ua'
        className='text-primary-foreground/80 transition-colors hover:text-primary-foreground'>
        hello@bloomify.ua
      </a>
    ),
  },
  {
    id: 'address',
    icon: MapPin,
    content: (
      <address className='not-italic text-primary-foreground/80'>
        <a
          href={kyivMapUrl}
          target='_blank'
          rel='noreferrer'
          className='transition-colors hover:text-primary-foreground'>
          {kyivAddress}
        </a>
      </address>
    ),
  },
];

type SocialLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const footerSocialLinks: SocialLink[] = [
  {
    icon: Instagram,
    label: 'Instagram',
    href: 'https://instagram.com',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    href: 'https://facebook.com',
  },
  {
    icon: Send,
    label: 'Telegram',
    href: 'https://t.me',
  },
];
