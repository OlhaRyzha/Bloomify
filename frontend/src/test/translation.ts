import type { TranslationFn } from '@/constants/message.constants';

export const testTranslations: Record<string, string> = {
  validation_field_default: 'This field',
  validation_required_field: '{{fieldName}} is required.',
  validation_invalid_email: 'Enter a valid email address.',
  validation_invalid_phone: 'Enter a valid phone number.',
  validation_invalid_image_url: 'Enter a valid image URL.',
  validation_name_min: 'Name must contain at least {{minSize}} characters.',

  checkout_validation_name_required: 'Enter your full name.',
  checkout_validation_name_min: 'Name must be at least 2 characters.',
  checkout_validation_email_required: 'Enter your email.',
  checkout_validation_email_invalid: 'Enter a valid email address.',
  checkout_validation_phone_required: 'Enter your phone number.',
  checkout_validation_city_required: 'Enter the delivery city.',
  checkout_validation_address_required: 'Enter the delivery address.',
};

export const testT: TranslationFn = (key, values) => {
  const template = testTranslations[key] ?? key;

  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (message, [name, value]) =>
      message.replaceAll(`{{${name}}}`, String(value)),
    template
  );
};
