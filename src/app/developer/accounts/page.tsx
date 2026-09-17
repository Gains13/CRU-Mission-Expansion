'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Role = 'intern' | 'manager' | 'developer'
type Account = {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
  last_sign_in_at: string | null
}

const ROLE_CYCLE: Role[] = ['intern', 'manager', 'developer']

export default function AccountsPage() {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const [inviteRole, setInviteRole] = useState<Role>('intern')
  const [inviteEmail, setInviteEmail] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [sending, setSending] = useState(false)

  async function loadAccounts() {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_accounts')
    if (!error && data) setAccounts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  function say(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function cycleRole(account: Account) {
    const nextRole = ROLE_CYCLE[(ROLE_CYCLE.indexOf(account.role) + 1) % ROLE_CYCLE.length]
    const { error } = await supabase.rpc('admin_set_role', {
      p_user_id: account.id,
      p_new_role: nextRole,
    })
    if (error) {
      say('Could not change role: ' + error.message)
      return
    }
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, role: nextRole } : a))
    )
    say(`${account.full_name || account.email} is now ${nextRole}`)
  }

  async function sendReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    say(error ? 'Could not send reset: ' + error.message : `Reset link sent to ${email}`)
  }

  async function generateCode() {
    const { data, error } = await supabase.rpc('generate_invite', { p_role: inviteRole })
    if (error) {
      say('Could not generate code: ' + error.message)
      return
    }
    setGeneratedCode(data)
  }

  async function sendInviteEmail() {
    if (!inviteEmail.trim()) {
      say('Enter an email first.')
      return
    }
    setSending(true)
    const res = await fetch('/api/admin/invite-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const json = await res.json()
    setSending(false)

    if (!res.ok) {
      say('Could not send invite: ' + json.error)
      return
    }
    say(`Invite email sent to ${inviteEmail}`)
    setInviteEmail('')
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-2xl font-medium">Accounts & roles</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Who can sign in and what each role can reach.
        </p>
      </div>

      {/* Invite panel */}
      <section className="flex flex-col gap-4 rounded-md border border-divider p-5">
        <h2 className="font-heading text-lg font-medium">Bring someone on</h2>

        <div className="grid gap-1.5">
          <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
            Role
          </span>
          <div className="flex gap-2">
            {ROLE_CYCLE.map((r) => (
              <button
                key={r}
                onClick={() => setInviteRole(r)}
                className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                  inviteRole === r
                    ? 'border-accent bg-accent-100 text-accent-800'
                    : 'border-divider text-neutral-800 hover:bg-neutral-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
              Email (for a real invite email)
            </span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="newperson@cru.org"
              className="w-64 rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={sendInviteEmail}
            disabled={sending}
            className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send invite email'}
          </button>
          <span className="text-sm text-neutral-600">or</span>
          <button
            onClick={generateCode}
            className="rounded-md border border-divider px-4 py-2 font-heading text-sm font-semibold text-neutral-800 hover:bg-neutral-200"
          >
            Generate a code instead
          </button>
        </div>

        {generatedCode && (
          <div className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
            Code: <span className="font-heading font-semibold">{generatedCode}</span> — share this manually
          </div>
        )}
      </section>

      {/* Accounts table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {['Person', 'Role', 'Last sign-in', 'Actions'].map((h) => (
              <th
                key={h}
                className="border-b border-divider pb-2 pr-3 text-left font-heading text-[11px] uppercase tracking-widest text-neutral-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="py-4 text-neutral-600">
                Loading…
              </td>
            </tr>
          )}
          {!loading && accounts.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-neutral-600">
                No accounts yet.
              </td>
            </tr>
          )}
          {accounts.map((a) => (
            <tr key={a.id}>
              <td className="border-b border-divider py-2.5 pr-3">
                <div className="font-heading font-semibold">{a.full_name || '—'}</div>
                <div className="text-xs text-neutral-600">{a.email}</div>
              </td>
              <td className="border-b border-divider py-2.5 pr-3">
                <button
                  onClick={() => cycleRole(a)}
                  className="rounded-md border border-divider px-2.5 py-1 font-heading text-xs font-semibold capitalize text-neutral-800 hover:bg-neutral-200"
                >
                  {a.role}
                </button>
              </td>
              <td className="border-b border-divider py-2.5 pr-3 text-neutral-700">
                {a.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleDateString() : 'Never'}
              </td>
              <td className="border-b border-divider py-2.5 text-right">
                <button
                  onClick={() => sendReset(a.email)}
                  className="rounded-md border border-accent px-3 py-1 font-heading text-xs font-semibold text-accent-700 hover:bg-accent-100"
                >
                  Send reset
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md border border-accent-300 bg-accent-100 px-4 py-2.5 text-sm text-accent-800 shadow-md">
          {toast}
        </div>
      )}
    </div>
  )
}