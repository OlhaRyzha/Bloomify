'use client';

import { Form, Formik } from 'formik';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_ROUTES } from '@/constants/api.constant';
import { newsletterSubscribeInitialValues } from './footer-newsletter-form.config';
import {
  newsletterSubscribeSchema,
  type NewsletterSubscribeValues,
} from './footer-newsletter-form.schemas';
import apiClient from '@/services/api/clients/api-client';
import { useFormActionStatus } from '@/hooks/use-form-action-status';
import { getErrorMessage } from '@/utils/errors/get-error-message';
import { getFormFieldError } from '@/utils/forms/get-form-field-error';
import { validateWithZod } from '@/utils/forms/validate-with-zod';

type FooterNewsletterFormProps = {
  inputId: string;
  label: string;
  loadingLabel: string;
  placeholder: string;
  successMessage: string;
  errorMessage: string;
};

export default function FooterNewsletterForm({
  inputId,
  label,
  loadingLabel,
  placeholder,
  successMessage: successMessageText,
  errorMessage: fallbackErrorMessage,
}: FooterNewsletterFormProps) {
  const {
    clearStatus,
    errorMessage,
    setErrorStatus,
    setSuccessStatus,
    successMessage,
  } = useFormActionStatus();

  return (
    <div className='w-full max-w-full lg:w-auto'>
      <Formik<NewsletterSubscribeValues>
        initialValues={newsletterSubscribeInitialValues}
        validateOnMount
        validate={(values) => validateWithZod(newsletterSubscribeSchema, values)}
        onSubmit={async (values, actions) => {
          clearStatus();

          try {
            const payload = newsletterSubscribeSchema.parse(values);
            await apiClient.post<unknown, NewsletterSubscribeValues>(
              API_ROUTES.SUBSCRIBE,
              payload
            );
            setSuccessStatus(successMessageText);
            actions.resetForm();
          } catch (error) {
            setErrorStatus(getErrorMessage(error, fallbackErrorMessage));
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
        }) => {
          const emailError = getFormFieldError({
            errors,
            name: 'email',
            touched,
          });
          const statusMessage = emailError || errorMessage || successMessage;

          return (
            <Form className='w-full max-w-full lg:w-auto'>
              <div className='flex w-full min-w-0 flex-col gap-3 sm:flex-row lg:w-auto'>
                <label
                  htmlFor={inputId}
                  className='sr-only'>
                  {label}
                </label>
                <Input
                  id={inputId}
                  name='email'
                  type='email'
                  placeholder={placeholder}
                  autoComplete='email'
                  required
                  value={values.email}
                  onChange={(event) => {
                    clearStatus();
                    handleChange(event);
                  }}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={`${inputId}-status`}
                  className='w-full min-w-0 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/70 sm:min-w-0 lg:w-72'
                />
                <Button
                  className='h-10 w-full shrink-0 bg-gold px-5 py-2 text-forest hover:bg-gold/90 sm:w-auto'
                  type='submit'
                  disabled={isSubmitting}
                  aria-label={label}>
                  {isSubmitting ? loadingLabel : label}
                  <Send
                    className='h-4 w-4'
                    aria-hidden={true}
                  />
                </Button>
              </div>

              <p
                id={`${inputId}-status`}
                className='mt-2 min-h-4 text-xs text-primary-foreground/90'
                role='status'
                aria-live='polite'>
                {statusMessage}
              </p>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
