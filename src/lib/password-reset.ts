// Where a password-reset email should send the user. The link goes through
// /auth/confirm, which verifies it server-side and then forwards to the page
// where they choose a new password. Must be called in the browser.
export function passwordResetRedirect() {
  return `${window.location.origin}/auth/confirm?next=/reset-password`
}

export const MIN_PASSWORD_LENGTH = 8
