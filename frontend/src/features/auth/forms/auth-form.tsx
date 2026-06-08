'use client';

import Link from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { useSearchParams } from 'next/navigation';
import { Formik, Form } from 'formik';
import { Chrome } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createLoginSchema, createRegisterSchema } from './auth.schemas';
import {
  authInitialValuesByMode,
  getAuthFields,
  type AuthFormValues,
  type AuthMode,
} from './auth-form.config';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { useTranslation } from '@/hooks/use-translation';
import { getLocalizedPath } from '@/i18n/routing';
import { ApiError } from '@/services/api/errors/api-error';
import { getPostAuthRedirectPath } from '../lib/shared/auth-redirect';
import AuthSessionService from '../lib/shared/auth-session.service';
import {
  trackAuthSignedIn,
  trackAuthSignedUp,
} from '@/services/analytics/analytics.events';
import {
  navigateAfterAuth,
  rememberPostAuthRedirectPath,
} from '../lib/client/auth-navigation.client';

const AUTH_FORM_COPY_KEYS = {
  login: {
    title: 'action_log_in',
    subtitle: 'auth_form_login_subtitle',
    googleLabel: 'auth_form_login_google_label',
    submitLabel: 'action_log_in',
    switchText: 'auth_form_login_switch_text',
    switchHref: 'auth_form_login_switch_href',
    switchLinkLabel: 'action_register',
  },
  register: {
    title: 'action_create_account',
    subtitle: 'auth_form_register_subtitle',
    googleLabel: 'auth_form_register_google_label',
    submitLabel: 'action_register',
    switchText: 'auth_form_register_switch_text',
    switchHref: 'auth_form_register_switch_href',
    switchLinkLabel: 'action_log_in',
  },
} as const;

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const { locale, t } = useTranslation();
  const searchParams = useSearchParams();
  const { loginWithRedirect, isLoading: isAuth0Loading } = useAuth0();

  const copyKeys = AUTH_FORM_COPY_KEYS[mode];
  const fields = getAuthFields({ mode, t });
  const schema =
    mode === 'login' ? createLoginSchema(t) : createRegisterSchema(t);
  const redirectPath = getPostAuthRedirectPath(
    searchParams.get('next'),
    locale
  );

  const handleGoogleSignIn = async () => {
    rememberPostAuthRedirectPath(redirectPath);

    await loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        prompt: 'select_account',
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
      appState: {
        returnTo: redirectPath,
      },
    });
  };

  return (
    <Card
      className='w-full border border-border/70 bg-card/80 shadow-card backdrop-blur opacity-0 animate-scale-in'
      style={{ animationDelay: '0.1s' }}>
      <CardHeader className='pb-4'>
        <CardTitle className='font-display text-3xl'>
          {t(copyKeys.title)}
        </CardTitle>

        <CardDescription className='text-base'>
          {t(copyKeys.subtitle)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Formik<AuthFormValues>
          initialValues={authInitialValuesByMode[mode]}
          validate={(values) => validateWithZod(schema, values)}
          onSubmit={async (values, actions) => {
            actions.setStatus(undefined);

            try {
              if (mode === 'login') {
                await AuthSessionService.signIn({
                  email: values.email,
                  password: values.password,
                });
              } else {
                await AuthSessionService.signUp({
                  name: values.name,
                  email: values.email,
                  password: values.password,
                });
              }

              const trackAuth =
                mode === 'login' ? trackAuthSignedIn : trackAuthSignedUp;

              trackAuth({ locale });

              navigateAfterAuth(redirectPath);
            } catch (error) {
              actions.setStatus(ApiError.fromUnknown(error).userMessage);
            } finally {
              actions.setSubmitting(false);
            }
          }}>
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
            status,
          }) => (
            <Form className='space-y-4'>
              <Button
                type='button'
                variant='outline'
                className='h-11 w-full justify-center gap-3 border-border/80 bg-background/60'
                disabled={isAuth0Loading}
                onClick={handleGoogleSignIn}>
                <span className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
                  <Chrome
                    className='h-4 w-4 text-primary'
                    aria-hidden
                  />
                </span>
                {t(copyKeys.googleLabel)}
              </Button>

              <div className='flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground'>
                <Separator className='flex-1' />
                {t('auth_form_or')}
                <Separator className='flex-1' />
              </div>

              {fields.map((field) => {
                const errorMessage = getFormFieldError({
                  errors,
                  name: field.name,
                  touched,
                });
                const isInvalid = Boolean(errorMessage);
                const helperId = `${field.name}-helper`;
                const errorId = `${field.name}-error`;
                const Icon = field.icon;

                return (
                  <div
                    key={field.name}
                    className='space-y-2'>
                    <label
                      htmlFor={field.name}
                      className='text-sm font-medium text-foreground'>
                      {field.label}
                    </label>

                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                        <Icon
                          className='h-4 w-4'
                          aria-hidden
                        />
                      </span>

                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete}
                        value={values[field.name] ?? ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={isInvalid}
                        aria-describedby={
                          isInvalid
                            ? errorId
                            : field.helper
                              ? helperId
                              : undefined
                        }
                        className='mt-0.5 h-11 bg-background/70 pl-10'
                      />
                    </div>

                    {field.helper && !isInvalid && (
                      <p
                        id={helperId}
                        className='text-xs text-muted-foreground'>
                        {field.helper}
                      </p>
                    )}

                    {isInvalid && (
                      <p
                        id={errorId}
                        className='text-xs font-medium text-destructive'>
                        {errorMessage}
                      </p>
                    )}
                  </div>
                );
              })}

              {status && (
                <p
                  role='alert'
                  className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'>
                  {status}
                </p>
              )}

              <Button
                type='submit'
                size='lg'
                className='mt-2 w-full'
                disabled={isSubmitting}>
                {t(copyKeys.submitLabel)}
              </Button>

              {mode === 'register' && (
                <p className='text-xs text-muted-foreground'>
                  {t('auth_form_terms_text') + ' '}
                  <Link
                    href={getLocalizedPath('/terms', locale)}
                    className='text-primary underline-offset-4 hover:underline'>
                    {t('auth_form_terms_terms_label') + ' '}
                  </Link>
                  {t('auth_form_terms_and') + ' '}
                  <Link
                    href={getLocalizedPath('/privacy', locale)}
                    className='text-primary underline-offset-4 hover:underline'>
                    {t('auth_form_terms_privacy_label')}
                  </Link>
                  .
                </p>
              )}

              <p className='text-sm text-muted-foreground'>
                {t(copyKeys.switchText) + ' '}
                <Link
                  href={getLocalizedPath(t(copyKeys.switchHref), locale)}
                  className='font-semibold text-primary underline-offset-4 hover:underline'>
                  {t(copyKeys.switchLinkLabel)}
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
