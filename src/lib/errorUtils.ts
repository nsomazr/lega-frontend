/**
 * Formats FastAPI/Pydantic validation errors into a readable string
 * @param error - The error object from axios
 * @param defaultMessage - Default message if error can't be formatted
 * @returns A formatted error message string
 */
export function formatApiError(error: any, defaultMessage: string = 'An error occurred'): string {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Try to get error from response data
  const detail = error?.response?.data?.detail || error?.data?.detail;
  
  if (!detail) {
    // Fallback to error message
    return error?.message || defaultMessage;
  }

  // If detail is a string, return it directly
  if (typeof detail === 'string') {
    return detail;
  }

  // If detail is an array (Pydantic validation errors)
  if (Array.isArray(detail)) {
    return detail
      .map((err: any) => {
        if (typeof err === 'string') {
          return err;
        }
        // Format Pydantic error object
        const field = err.loc?.join('.') || 'field';
        const message = err.msg || 'Invalid value';
        return `${field}: ${message}`;
      })
      .join('; ');
  }

  // If detail is an object (other error format)
  if (typeof detail === 'object') {
    try {
      return JSON.stringify(detail);
    } catch {
      return defaultMessage;
    }
  }

  return defaultMessage;
}


