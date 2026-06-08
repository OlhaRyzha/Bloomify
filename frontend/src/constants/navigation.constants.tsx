import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';

export type NavigationKey =
  | 'catalog'
  | 'favorites'
  | 'subscription'
  | 'about'
  | 'contact'
  | 'orders';

export type NavigationVisibility = 'all' | 'authorized' | 'guest';

export type NavigationLabelKey =
  | 'label_catalog'
  | 'label_favorites'
  | 'label_subscription'
  | 'label_about'
  | 'label_contact'
  | 'label_orders';

type NavigationLink = {
  key: NavigationKey;
  href: string;
  labelKey: NavigationLabelKey;
  visibility: NavigationVisibility;
};

export const NAVIGATION_LINKS: NavigationLink[] = [
  {
    key: 'catalog',
    href: '/catalog',
    labelKey: 'label_catalog',
    visibility: 'all',
  },
  {
    key: 'favorites',
    href: '/favorites',
    labelKey: 'label_favorites',
    visibility: 'authorized',
  },
  {
    key: 'subscription',
    href: '/#subscription',
    labelKey: 'label_subscription',
    visibility: 'all',
  },
  {
    key: 'about',
    href: '/#about',
    labelKey: 'label_about',
    visibility: 'all',
  },
  {
    key: 'orders',
    href: '/orders',
    labelKey: 'label_orders',
    visibility: 'authorized',
  },
  {
    key: 'contact',
    href: '/#contact',
    labelKey: 'label_contact',
    visibility: 'all',
  },
];

export type ServiceKey =
  | 'wedding'
  | 'corporate'
  | 'events'
  | 'gifts'
  | 'delivery';

export const SERVICE_LINKS: { key: ServiceKey; href: string }[] = [
  { key: 'wedding', href: '/#services' },
  { key: 'corporate', href: '/#services' },
  { key: 'events', href: '/#services' },
  { key: 'gifts', href: '/#services' },
  { key: 'delivery', href: '/#services' },
];

export type FooterContactItem = {
  id: 'phone' | 'email' | 'address';
  icon: LucideIcon;
  href: string;
  external?: boolean;
  labelKey?: string;
  staticText?: string;
};

export const FOOTER_CONTACT_ITEMS: FooterContactItem[] = [
  {
    id: 'phone',
    icon: Phone,
    href: 'tel:+380991234567',
    staticText: '+38 (099) 123-45-67',
  },
  {
    id: 'email',
    icon: Mail,
    href: 'mailto:hello@bloomify.ua',
    staticText: 'hello@bloomify.ua',
  },
  {
    id: 'address',
    icon: MapPin,
    href: 'https://www.google.com/maps/search/?api=1&query=Kyiv',
    external: true,
    labelKey: 'footer_address',
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
