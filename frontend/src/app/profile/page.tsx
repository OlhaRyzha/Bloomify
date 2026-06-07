import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart, PackageCheck, ShoppingBag } from 'lucide-react';

import { PageShell } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getSignInPathWithNext } from '@/features/auth/auth-redirect';
import { hasAuthSessionCookie } from '@/features/auth/auth-session.server';
import { getLocalizedPath } from '@/i18n/routing';
import { getServerTranslator } from '@/i18n/server';

import ProfileSignOutButton from './profile-sign-out-button.client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator();

  return {
    title: t('metadata_profile_title'),
    description: t('metadata_profile_description'),
  };
}

export default async function ProfilePage() {
  const { locale, t } = await getServerTranslator();

  const isAuthorized = await hasAuthSessionCookie();

  if (!isAuthorized) {
    redirect(
      getSignInPathWithNext(getLocalizedPath('/profile', locale), locale)
    );
  }

  const profileCards = [
    {
      title: t('profile_orders_title'),
      description: t('profile_orders_description'),
      icon: PackageCheck,
      href: getLocalizedPath('/orders', locale),
    },
    {
      title: t('profile_favorites_title'),
      description: t('profile_favorites_description'),
      icon: Heart,
      href: getLocalizedPath('/favorites', locale),
    },
  ];

  return (
    <PageShell
      header={{
        label: t('profile_page_label'),
        title: t('profile_page_title'),
        description: t('profile_page_description'),
      }}>
      <div className='grid gap-4 md:grid-cols-2'>
        {profileCards.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className='group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
              <Card className='h-full border-border/70 bg-card/80 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg'>
                <CardHeader>
                  <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground'>
                    <Icon
                      className='h-5 w-5'
                      aria-hidden
                    />
                  </div>

                  <CardTitle className='transition group-hover:text-primary'>
                    {item.title}
                  </CardTitle>

                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className='mt-4 border-border/70 bg-card/80 shadow-card'>
        <CardContent className='flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='font-display text-2xl font-semibold'>
              {t('profile_continue_shopping_title')}
            </h2>

            <p className='mt-1 text-sm text-muted-foreground'>
              {t('profile_continue_shopping_description')}
            </p>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row'>
            <ProfileSignOutButton />

            <Button asChild>
              <Link href={getLocalizedPath('/catalog', locale)}>
                <ShoppingBag
                  className='mr-2 h-4 w-4'
                  aria-hidden
                />
                {t('profile_continue_shopping_cta')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
