// Plain-language explanations for the auth errors people actually hit, keyed
// by Supabase error code. Each one says what happened and what to do next.

type Explanation = { title: string; detail: string }

const LINK_ERRORS: Record<string, Explanation> = {
  otp_expired: {
    title: 'This link has already been used or has expired.',
    detail:
      'Each link works once, for one hour, and only the newest email you were sent is valid. ' +
      'If you opened it before (for example on another device), or your email app opened it to ' +
      'check it for safety, it no longer works. Request a new link below and open only that one.',
  },
  pkce_code_verifier_not_found: {
    title: 'This link was opened in a different browser than the one that requested it.',
    detail: 'Request a new link below and open it on this device.',
  },
  flow_state_expired: {
    title: 'This link has expired.',
    detail: 'Request a new link below.',
  },
  flow_state_not_found: {
    title: 'This link has already been used.',
    detail: 'Request a new link below.',
  },
  missing_link_params: {
    title: 'This link is incomplete.',
    detail:
      'Your email app may have cut it off. Try opening the link again, or request a new one below.',
  },
  session_error: {
    title: 'We couldn’t sign you in from this link.',
    detail: 'It may have expired. Request a new link below.',
  },
}

const EMAIL_ERRORS: Record<string, string> = {
  over_email_send_rate_limit:
    'Too many emails have been sent in a short time. Wait a few minutes, then try again.',
  over_request_rate_limit: 'Too many attempts in a short time. Wait a few minutes, then try again.',
  email_address_invalid: 'That email address doesn’t look right. Check it and try again.',
  email_exists:
    'That email already has an account. Send them a password reset from the sign-in page instead.',
  user_already_exists:
    'That email already has an account. Send them a password reset from the sign-in page instead.',
  unexpected_failure:
    'The email couldn’t be sent. Check the SMTP settings in Supabase (Authentication → Emails), then try again.',
}

const FALLBACK_LINK: Explanation = {
  title: 'This link is invalid or has expired.',
  detail: 'Each link works once, and only the newest one is valid. Request a new link below.',
}

// Reasons may arrive prefixed with the link style, e.g. "token_hash: otp_expired".
function codeOf(reason: string) {
  return reason.includes(':') ? reason.slice(reason.lastIndexOf(':') + 1).trim() : reason.trim()
}

export function explainLinkError(reason: string | undefined): Explanation {
  if (!reason) return FALLBACK_LINK
  return LINK_ERRORS[codeOf(reason)] ?? FALLBACK_LINK
}

type AuthErrorLike = { code?: string; message?: string; status?: number } | null | undefined

export function explainEmailError(error: AuthErrorLike): string {
  if (!error) return ''
  const code = error.code ?? ''
  if (EMAIL_ERRORS[code]) return EMAIL_ERRORS[code]
  const message = error.message ?? ''
  if (/already been registered|already registered|already exists/i.test(message)) {
    return EMAIL_ERRORS.email_exists
  }
  if (/sending .*email|smtp/i.test(message)) return EMAIL_ERRORS.unexpected_failure
  if (/rate limit/i.test(message)) return EMAIL_ERRORS.over_email_send_rate_limit
  return message
    ? `Something went wrong: ${message}`
    : 'Something went wrong. Please try again in a moment.'
}
