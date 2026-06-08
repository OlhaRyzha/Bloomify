export type TranslationFn = (
  key: string,
  values?: Record<string, string | number>
) => string;

export const getValidationMessages = (t: TranslationFn) => ({
  requiredField: (fieldName: string = t('validation_field_default')) =>
    t('validation_required_field', { fieldName }),

  invalidEmail: t('validation_invalid_email'),
  invalidPhone: t('validation_invalid_phone'),

  invalidImageUrl: t('validation_invalid_image_url'),
  passwordMin: (minSize: number) => t('validation_password_min', { minSize }),
  passwordRules: t('validation_password_rules'),
  passwordMismatch: t('validation_password_mismatch'),
  nameMin: (minSize: number) => t('validation_name_min', { minSize }),
  lengthMax: (maxSize: string) => t('validation_length_max', { maxSize }),
  invalidScheme: t('validation_invalid_scheme'),
  invalidHost: t('validation_invalid_host'),
  error: t('error_generic'),
  unknownError: t('error_unknown'),
  errorUploading: 'Error uploading audio:',
  responseIsNull: 'Response is null or undefined',
});

export const getDialogMessages = (t: TranslationFn) => ({
  cannotBeUndone: t('dialog_cannot_be_undone'),
  areYouSure: t('dialog_are_you_sure'),
  delete: (value: string) => t('dialog_delete', { value }),
  deleteAll: (value: string) => t('dialog_delete_all', { value }),
});

export const apiErrorMessages = {
  badRequest: 'Bad Request',
  unauthorized: 'Please log in',
  forbidden: 'Access denied',
  notFound: 'Not found',
  timeout: 'Request timed out',
  conflict: 'Conflict',
  payloadTooLarge: 'Payload too large',
  unsupportedMediaType: 'Unsupported media type',
  validationError: 'Validation error',
  tooManyRequests: 'Too many requests',
  serverError: 'Server error',
  badGateway: 'Bad gateway',
  serviceUnavailable: 'Service unavailable',
  gatewayTimeout: 'Gateway timeout',
  clientError: 'Client error',
  serverErrorStatus: 'Server error',
  networkError: 'Network error',
};

export const technicalMessages = {
  zodError: '[ZOD PARSE ERROR]:',
  binanceFetchError: '[Binance] fetch error',
  unknownError: 'An unknown error occurred.',
} as const;
