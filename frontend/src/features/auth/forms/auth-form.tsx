'use client';

import Link from 'next/link';
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
import { loginSchema, registerSchema } from './auth.schemas';
import {
  authInitialValuesByMode,
  getAuthFields,
  type AuthFormValues,
  type AuthMode,
} from './auth-form.config';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { validateWithZod } from '@/utils/forms/validate-with-zod';
import { useTranslation } from '@/hooks/use-translation';

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation();
  const fields = getAuthFields({ mode, t });
  const schema = mode === 'login' ? loginSchema : registerSchema;

  return (
    <Card
      className='w-full border border-border/70 bg-card/80 shadow-card backdrop-blur opacity-0 animate-scale-in'
      style={{ animationDelay: '0.1s' }}>
      <CardHeader className='pb-4'>
        <CardTitle className='font-display text-3xl'>
          {t(`auth_form_${mode}_title`)}
        </CardTitle>
        <CardDescription className='text-base'>
          {t(`auth_form_${mode}_subtitle`)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Formik<AuthFormValues>
          initialValues={authInitialValuesByMode[mode]}
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
                  <Chrome
                    className='h-4 w-4 text-primary'
                    aria-hidden
                  />
                </span>
                {t(`auth_form_${mode}_google_label`)}
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

              <Button
                type='submit'
                size='lg'
                className='mt-2 w-full'
                disabled={isSubmitting}>
                {t(`auth_form_${mode}_submit_label`)}
              </Button>

              {mode === 'register' && (
                <p className='text-xs text-muted-foreground'>
                  {t('auth_form_terms_text')}
                  <Link
                    href='/terms'
                    className='text-primary underline-offset-4 hover:underline'>
                    {t('auth_form_terms_terms_label')}
                  </Link>
                  {t('auth_form_terms_and')}
                  <Link
                    href='/privacy'
                    className='text-primary underline-offset-4 hover:underline'>
                    {t('auth_form_terms_privacy_label')}
                  </Link>
                  .
                </p>
              )}

              <p className='text-sm text-muted-foreground'>
                {t(`auth_form_${mode}_switch_text`)}
                <Link
                  href={t(`auth_form_${mode}_switch_href`)}
                  className='font-semibold text-primary underline-offset-4 hover:underline'>
                  {t(`auth_form_${mode}_switch_link_label`)}
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
