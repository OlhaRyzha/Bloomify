import type { LucideIcon } from 'lucide-react';
import { Lock, Mail, User } from 'lucide-react';
import type { RegisterValues } from './auth.schemas';

export type AuthMode = 'login' | 'register';
export type AuthFormValues = RegisterValues;
export type AuthFieldName = keyof AuthFormValues;

export type AuthFieldConfig = {
  name: AuthFieldName;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  helper?: string;
  icon: LucideIcon;
};

type GetAuthFieldConfigParams = {
  mode: AuthMode;
  t: (key: string) => string;
};

const initialValues: AuthFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const authInitialValuesByMode: Record<AuthMode, AuthFormValues> = {
  login: initialValues,
  register: initialValues,
};

export function getAuthFields({
  mode,
  t,
}: GetAuthFieldConfigParams): AuthFieldConfig[] {
  const fieldConfig: Record<AuthFieldName, AuthFieldConfig> = {
    name: {
      name: 'name',
      label: t('auth_form_fields_name_label'),
      type: 'text',
      placeholder: t('auth_form_fields_name_placeholder'),
      autoComplete: 'name',
      helper: t('auth_form_fields_name_helper') || undefined,
      icon: User,
    },
    email: {
      name: 'email',
      label: t('auth_form_fields_email_label'),
      type: 'email',
      placeholder: t('auth_form_fields_email_placeholder'),
      autoComplete: 'email',
      icon: Mail,
    },
    password: {
      name: 'password',
      label: t('auth_form_fields_password_label'),
      type: 'password',
      placeholder: t('auth_form_fields_password_placeholder'),
      autoComplete: mode === 'login' ? 'current-password' : 'new-password',
      helper: t('auth_form_fields_password_helper') || undefined,
      icon: Lock,
    },
    confirmPassword: {
      name: 'confirmPassword',
      label: t('auth_form_fields_confirm_password_label'),
      type: 'password',
      placeholder: t('auth_form_fields_confirm_password_placeholder'),
      autoComplete: 'new-password',
      icon: Lock,
    },
  };

  return mode === 'login'
    ? [fieldConfig.email, fieldConfig.password]
    : [...Object.values(fieldConfig)];
}
