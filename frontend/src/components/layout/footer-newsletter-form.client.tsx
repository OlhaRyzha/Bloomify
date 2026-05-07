'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_ROUTES } from '@/constants/api.constant';
import apiClient from '@/services/api/clients/api-client';

type FooterNewsletterFormProps = {
  inputId: string;
  label: string;
  loadingLabel: string;
  placeholder: string;
  invalidEmailMessage: string;
  successMessage: string;
  errorMessage: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FooterNewsletterForm({
  inputId,
  label,
  loadingLabel,
  placeholder,
  invalidEmailMessage,
  successMessage: successMessageText,
  errorMessage: fallbackErrorMessage,
}: FooterNewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    setErrorMessage('');
    setSuccessMessage('');

    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage(invalidEmailMessage);
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post<unknown, { email: string }>(API_ROUTES.SUBSCRIBE, {
        email: trimmedEmail,
      });
      setSuccessMessage(successMessageText);
      setEmail('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : fallbackErrorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full lg:w-auto'>
      <form
        onSubmit={handleSubmit}
        className='flex w-full gap-3 lg:w-auto'>
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={`${inputId}-status`}
          className='min-w-[250px] bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50'
        />
        <Button
          className='h-10 bg-gold px-6 py-2'
          type='submit'
          disabled={isLoading}
          aria-label={label}>
          {isLoading ? loadingLabel : label}
          <Send
            className='h-4 w-4'
            aria-hidden={true}
          />
        </Button>
      </form>

      <p
        id={`${inputId}-status`}
        className='mt-2 min-h-4 text-xs text-primary-foreground/80'
        role='status'
        aria-live='polite'>
        {errorMessage || successMessage}
      </p>
    </div>
  );
}
