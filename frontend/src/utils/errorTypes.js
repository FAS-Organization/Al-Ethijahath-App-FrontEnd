// Content for every error page. One ErrorPage component shows any of these.
// To add a new error later, add one more entry here.
//
// actions: 'home' | 'back' | 'retry' | 'signout'
export const ERROR_TYPES = {
  not_found: {
    code: '404',
    title: 'Page not found',
    message:
      'The page you are looking for does not exist or has been moved. Please check the address, or go back to the start.',
    actions: ['home', 'back'],
  },
  forbidden: {
    code: '403',
    title: 'You do not have access',
    message:
      'Your account is not allowed to open this page. If you think this is a mistake, please contact support.',
    actions: ['home', 'back'],
  },
  pending: {
    code: 'Pending',
    title: 'Your account is awaiting approval',
    message:
      'Our team is reviewing your registration. You will be able to use the portal as soon as it is approved.',
    actions: ['retry', 'signout'],
  },
  suspended: {
    code: 'Suspended',
    title: 'Your account is suspended',
    message:
      'Access to the portal is paused for this account. Please contact support to restore it.',
    actions: ['signout'],
  },
  server: {
    code: '500',
    title: 'Something went wrong',
    message:
      'We could not complete this on our side. Nothing you entered was lost. Please try again in a moment.',
    actions: ['retry', 'home'],
  },
  offline: {
    code: 'Offline',
    title: 'No internet connection',
    message:
      'Please check your connection and try again. Your changes will not be saved until you are back online.',
    actions: ['retry'],
  },
  maintenance: {
    code: '503',
    title: 'Back shortly',
    message:
      'The portal is down for scheduled maintenance. Please try again in a few minutes.',
    actions: ['retry'],
  },
}

// Turn an API status code into an error type (for the backend later).
// Returns null for errors that should stay inline (400, 401, 422, 429...).
export function errorTypeFromStatus(status, code) {
  if (code === 'account_pending') return 'pending'
  if (code === 'account_suspended') return 'suspended'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 503) return 'maintenance'
  if (status >= 500) return 'server'
  return null
}