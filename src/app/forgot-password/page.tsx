import ForgotPasswordForm from './form'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; reason?: string }>
}) {
  const { expired, reason } = await searchParams
  return <ForgotPasswordForm expired={expired === '1'} reason={reason?.slice(0, 120)} />
}
