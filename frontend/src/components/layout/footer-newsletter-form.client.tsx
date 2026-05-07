'use client';

import type { FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FooterNewsletterFormProps = {
  inputId: string;
  label: string;
  placeholder: string;
};

export default function FooterNewsletterForm({
  inputId,
  label,
  placeholder,
}: FooterNewsletterFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
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
        className='min-w-[250px] bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50'
      />
      <Button
        className='h-10 bg-gold px-6 py-2'
        type='submit'
        size='icon'
        aria-label={label}>
        <Send
          className='h-4 w-4'
          aria-hidden
        />
      </Button>
    </form>
  );
}
