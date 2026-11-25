import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import { confirmEmailLink } from './actions'

// Landing page for links in Supabase auth emails (password reset).
//
// Handles both link styles Supabase can send:
//  - token_hash + type: works in any browser. Requires the Reset Password
//    email template to link here directly.
//  - code: the default PKCE link. Only works in the browser that asked for
//    the reset, because the matching verifier lives there.
//
// The link is verified by a button click rather than on page load: mail
// providers (notably Outlook) open links to scan them, which would otherwise
// use up the one-time token before the person ever clicks it.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { token_hash, type, code, next } = await searchParams

  if (!(token_hash && type) && !code) redirect('/forgot-password?expired=1')

  return (
    <AuthCard title="Reset your password">
      <form action={confirmEmailLink} className="flex flex-col gap-4">
        <p className="text-sm text-neutral-800">
          Continue to choose a new password for your account.
        </p>
        <input type="hidden" name="token_hash" value={token_hash ?? ''} />
        <input type="hidden" name="type" value={type ?? ''} />
        <input type="hidden" name="code" value={code ?? ''} />
        <input type="hidden" name="next" value={next ?? '/reset-password'} />
        <div>
          <button
            type="submit"
            className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100"
          >
            Continue
          </button>
        </div>
      </form>
    </AuthCard>
  )
}
