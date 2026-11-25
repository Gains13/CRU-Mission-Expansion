import Image from 'next/image'

// Centered single-card layout for auth steps outside the main sign-in page
// (forgot password, choose a new password).
export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <Image src="/cru-logo.png" alt="Cru" width={988} height={606} priority className="mb-8 h-10 w-auto" />
        <div className="font-heading text-xs uppercase tracking-widest text-accent">Mission Expansion</div>
        <h1 className="mb-5 mt-1 font-heading text-2xl font-medium">{title}</h1>
        {children}
      </div>
    </div>
  )
}
