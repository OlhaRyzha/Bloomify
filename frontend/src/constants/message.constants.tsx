export const validationMessages = {
  requiredField: (fiealName: string = 'This field') =>
    `${fiealName} is required.`,
  lengthMax: (maxSize: string) =>
    `The selected file must be smaller than ${maxSize}.`,
  invalidScheme: 'Only HTTP and HTTPS links are supported.',
  invalidHost:
    'The provided image host is not allowed. Please use a trusted source.',
  error: 'An error occurred',
  zodError: '[ZOD PARSE ERROR]:',
  unknownError: 'An unknown error occurred',
  errorUploading: 'Error uploading audio:',
  responseIsNull: 'Response is null or undefined',
};

export const dialogMessages = {
  cannotBeUndone: 'This action cannot be undone.',
  areYouSure: 'Are you absolutely sure?',
  delete: (value: string) => `Delete ${value}? `,
  deleteAll: (value: string) =>
    `This will permanently delete all selected ${value}? `,
};

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
