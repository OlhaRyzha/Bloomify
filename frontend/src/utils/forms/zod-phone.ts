import { z } from 'zod';
import { PHONE_REGEX } from '../patterns/regex';

type PhoneStringMessages = {
  required: string;
  invalid: string;
};

export const phoneString = ({ required, invalid }: PhoneStringMessages) =>
  z
    .string()
    .trim()
    .min(1, required)
    .regex(PHONE_REGEX, invalid)
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, '');

      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }, invalid);
