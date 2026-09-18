const EXTENSION_ID = 'epmdockmkkfdogdiofaijngehijhlnka'

type Bounds = { left: number; top: number; width: number; height: number }
type Reply = { ok: boolean } | undefined

type ChromeRuntime = {
  sendMessage: (id: string, msg: unknown, cb: (reply: Reply) => void) => void
  lastError?: unknown
}

function runtime(): ChromeRuntime | null {
  const c = (window as unknown as { chrome?: { runtime?: ChromeRuntime } }).chrome
  return c?.runtime?.sendMessage ? c.runtime : null
}

function send(msg: unknown): Promise<boolean> {
  return new Promise((resolve) => {
    const rt = runtime()
    if (!rt) return resolve(false)
    try {
      rt.sendMessage(EXTENSION_ID, msg, (reply) => {
        void rt.lastError
        resolve(!!reply?.ok)
      })
    } catch {
      resolve(false)
    }
  })
}

export const pingExtension = () => send({ type: 'ping' })

export const openViaExtension = (url: string, bounds: Bounds) =>
  send({ type: 'open', url, bounds })
