type InviteRequest = { email: string; role: 'intern' | 'manager' | 'developer'; fullName: string }

// Calls the invite API and always resolves to a message that's safe to show,
// including when the request itself fails (offline, server error, timeout).
export async function sendInvite(body: InviteRequest): Promise<{ ok: true } | { ok: false; error: string }> {
  let res: Response
  try {
    res = await fetch('/api/admin/invite-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, error: 'Couldn’t reach the server. Check your internet connection and try again.' }
  }

  if (res.ok) return { ok: true }

  const json = (await res.json().catch(() => null)) as { error?: string } | null
  if (json?.error) return { ok: false, error: json.error }
  if (res.status === 401) return { ok: false, error: 'Your session has ended. Sign in again, then retry.' }
  if (res.status === 403) return { ok: false, error: 'Your account isn’t allowed to send this invite.' }
  return { ok: false, error: `The server had a problem (error ${res.status}). Try again in a moment.` }
}
