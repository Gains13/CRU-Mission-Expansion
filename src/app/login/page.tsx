import LoginForm from './form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signedOut?: string }>
}) {
  const { signedOut } = await searchParams
  return <LoginForm signedOutIdle={signedOut === 'idle'} />
}
