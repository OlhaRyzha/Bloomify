'use client';

import Link from 'next/link';
import { Formik, Form } from 'formik';
import type { LucideIcon } from 'lucide-react';
import { Chrome, Lock, Mail, User } from 'lucide-react';
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
import { loginSchema, registerSchema } from '@/schemas/auth.schemas';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { useTranslation } from '@/hooks/use-translation';

type AuthMode = 'login' | 'register';

type FieldConfig = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  helper?: string;
  icon: LucideIcon;
};

const initialValuesByMode: Record<AuthMode, Record<string, string>> = {
  login: {
    email: '',
    password: '',
  },
  register: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
};

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation();

  const fieldConfig: Record<string, FieldConfig> = {
    name: {
      name: 'name',
      label: t('auth.form.fields.name.label'),
      type: 'text',
      placeholder: t('auth.form.fields.name.placeholder'),
      autoComplete: 'name',
      helper: t('auth.form.fields.name.helper') || undefined,
      icon: User,
    },
    email: {
      name: 'email',
      label: t('auth.form.fields.email.label'),
      type: 'email',
      placeholder: t('auth.form.fields.email.placeholder'),
      autoComplete: 'email',
      icon: Mail,
    },
    password: {
      name: 'password',
      label: t('auth.form.fields.password.label'),
      type: 'password',
      placeholder: t('auth.form.fields.password.placeholder'),
      autoComplete: mode === 'login' ? 'current-password' : 'new-password',
      helper: t('auth.form.fields.password.helper') || undefined,
      icon: Lock,
    },
    confirmPassword: {
      name: 'confirmPassword',
      label: t('auth.form.fields.confirmPassword.label'),
      type: 'password',
      placeholder: t('auth.form.fields.confirmPassword.placeholder'),
      autoComplete: 'new-password',
      icon: Lock,
    },
  };

  const fields: FieldConfig[] =
    mode === 'login'
      ? [fieldConfig.email, fieldConfig.password]
      : [
          fieldConfig.name,
          fieldConfig.email,
          fieldConfig.password,
          fieldConfig.confirmPassword,
        ];
  const schema = mode === 'login' ? loginSchema : registerSchema;

  return (
    <Card
      className='w-full border border-border/70 bg-card/80 shadow-card backdrop-blur opacity-0 animate-scale-in'
      style={{ animationDelay: '0.1s' }}>
      <CardHeader className='pb-4'>
        <CardTitle className='font-display text-3xl'>{t(`auth.form.${mode}.title`)}</CardTitle>
        <CardDescription className='text-base'>{t(`auth.form.${mode}.subtitle`)}</CardDescription>
      </CardHeader>

      <CardContent>
        <Formik
          initialValues={initialValuesByMode[mode]}
          validate={(values) => validateWithZod(schema, values)}
          onSubmit={(_, actions) => {
            actions.setSubmitting(false);
          }}>
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
          }) => (
            <Form className='space-y-4'>
              <Button
                type='button'
                variant='outline'
                className='h-11 w-full justify-center gap-3 border-border/80 bg-background/60'>
                <span className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
                  <Chrome className='h-4 w-4 text-primary' />
                </span>
                {t(`auth.form.${mode}.googleLabel`)}
              </Button>

              <div className='flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground'>
                <Separator className='flex-1' />
                або
                <Separator className='flex-1' />
              </div>

              {fields.map((field) => {
                const errorMessage =
                  touched[field.name] && errors[field.name]
                    ? String(errors[field.name])
                    : undefined;
                const isInvalid = Boolean(errorMessage);
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
                        <Icon className='h-4 w-4' />
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
                          isInvalid ? `${field.name}-error` : undefined
                        }
                        className='h-11 bg-background/70 pl-10 mt-0.5'
                      />
                    </div>
                    {field.helper && !isInvalid && (
                      <p className='text-xs text-muted-foreground'>
                        {field.helper}
                      </p>
                    )}
                    {isInvalid && (
                      <p
                        id={`${field.name}-error`}
                        className='text-xs font-medium text-destructive'>
                        {errorMessage}
                      </p>
                    )}
                  </div>
                );
              })}

              <Button
                type='submit'
                size='lg'
                className='mt-2 w-full'
                disabled={isSubmitting}>
                {t(`auth.form.${mode}.submitLabel`)}
              </Button>

              {mode === 'register' && (
                <p className='text-xs text-muted-foreground'>
                  {t('auth.form.terms.text')}
                  <Link
                    href='/terms'
                    className='text-primary underline-offset-4 hover:underline'>
                    {t('auth.form.terms.termsLabel')}
                  </Link>
                  та
                  <Link
                    href='/privacy'
                    className='text-primary underline-offset-4 hover:underline'>
                    {t('auth.form.terms.privacyLabel')}
                  </Link>
                  .
                </p>
              )}

              <p className='text-sm text-muted-foreground'>
                {t(`auth.form.${mode}.switchText`)}{' '}
                <Link
                  href={t(`auth.form.${mode}.switchHref`)}
                  className='font-semibold text-primary underline-offset-4 hover:underline'>
                  {t(`auth.form.${mode}.switchLinkLabel`)}
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
