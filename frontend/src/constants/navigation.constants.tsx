import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';

type NavLink = { href: string; label: string };
type SocialLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};
type FooterContactItem = {
  id: string;
  icon: LucideIcon;
  content: ReactNode;
};

export const mainNavigationLinks: NavLink[] = [
  { label: 'Каталог', href: '/catalog' },
  { label: 'Вибране', href: '/favorites' },
  { label: 'Підписка', href: '/#subscription' },
  { label: 'Про нас', href: '/#about' },
  { label: 'Контакти', href: '/#contact' },
];

export const footerServiceLinks: NavLink[] = [
  { label: 'Весільна флористика', href: '/#services' },
  { label: 'Корпоративні замовлення', href: '/#services' },
  { label: 'Оформлення свят', href: '/#services' },
  { label: 'Подарункові кошики', href: '/#services' },
  { label: 'Доставка квітів', href: '/#services' },
];

const kyivAddress = 'м. Київ, вул. Хрещатик, 1';
const kyivMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  kyivAddress
)}`;

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
