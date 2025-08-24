// Generic success response
export type SuccessResponse<T> = {
  status: 'ok';
  data: T;
};

// Known validation error shape: field name → array of messages
export type KnownFormErrors = Record<string, string[]>;

// Validation error response with fallback for unknown shapes
export type ValidationErrorResponse = {
  status: 'form_errors';
  errors: KnownFormErrors | unknown;
};

// Server error response
export type ServerErrorResponse = {
  status: 'server_error';
  error: string;
};

// Redirect response
export type RedirectResponse = {
  status: 'redirect';
  url: string;
};

// Unified API response type
export type ApiResponse<T> =
  | SuccessResponse<T>
  | ValidationErrorResponse
  | ServerErrorResponse
  | RedirectResponse;
