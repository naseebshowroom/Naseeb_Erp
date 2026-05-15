import toast from 'react-hot-toast';

/**
 * Standardized API error handler.
 *
 * Extracts a meaningful message from backend error shapes,
 * shows a toast notification, and triggers logout on 401.
 *
 * @param {import('axios').AxiosError} error
 * @param {object} [options]
 * @param {boolean} [options.silent]   - suppress toast (useful in background refreshes)
 * @param {string}  [options.fallback] - custom fallback message
 * @returns {string} human-readable error message
 */
export const handleApiError = (error, options = {}) => {
  const { silent = false, fallback = 'An unexpected error occurred. Please try again.' } = options;

  let message = fallback;

  if (error.response) {
    const { status, data } = error.response;

    // Extract backend error message
    if (data?.message) {
      message = data.message;
    } else if (data?.errors?.length) {
      // express-validator array format
      message = data.errors.map((e) => e.msg).join('. ');
    }

    switch (status) {
      case 400:
        // Validation or bad request — message already extracted above
        break;

      case 401:
        // Token expired / invalid — Axios interceptor in lib/axios.js handles the
        // token refresh. This case only fires if refresh itself failed.
        message = 'Session expired. Please log in again.';
        break;

      case 403:
        message = 'Access denied. You do not have permission for this action.';
        break;

      case 404:
        message = data?.message || 'The requested resource was not found.';
        break;

      case 409:
        message = data?.message || 'A conflict occurred (duplicate entry).';
        break;

      case 422:
        message = data?.message || 'Validation failed. Please check your input.';
        break;

      case 500:
        message = 'Server error. Please contact the administrator.';
        break;

      default:
        break;
    }
  } else if (error.request) {
    // Request made but no response received
    message = 'Cannot connect to the server. Please check your network connection.';
  }

  if (!silent) {
    toast.error(message, { id: 'api-error' }); // id deduplicates rapid-fire toasts
  }

  return message;
};

/**
 * Wraps an async service call with standardized error handling.
 * Returns { data, error } tuple — never throws.
 *
 * Usage:
 *   const { data, error } = await safeCall(() => customerService.getCustomers());
 */
export const safeCall = async (fn, options = {}) => {
  try {
    const result = await fn();
    return { data: result, error: null };
  } catch (err) {
    const message = handleApiError(err, options);
    return { data: null, error: message };
  }
};
