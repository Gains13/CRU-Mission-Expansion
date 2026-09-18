// Moves a single dedicated Instagram tab/window to the handle the app asks for.
// It never injects scripts into, reads, or interacts with Instagram pages.

const ALLOWED_PREFIX = 'https://www.instagram.com/'

async function getSaved() {
  const { review } = await chrome.storage.session.get('review')
  return review || null
}

async function openInReviewTab(url, bounds) {
  const saved = await getSaved()

  if (saved) {
    try {
      await chrome.tabs.update(saved.tabId, { url, active: true })
      return
    } catch {
      // Tab was closed — fall through and create a fresh window.
    }
  }

  const win = await chrome.windows.create({
    url,
    type: 'normal',
    focused: false,
    ...(bounds || {}),
  })
  await chrome.storage.session.set({ review: { tabId: win.tabs[0].id, windowId: win.id } })
}

chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'ping') {
    sendResponse({ ok: true })
    return
  }

  if (msg?.type === 'open' && typeof msg.url === 'string' && msg.url.startsWith(ALLOWED_PREFIX)) {
    openInReviewTab(msg.url, msg.bounds)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }))
    return true
  }

  sendResponse({ ok: false, error: 'unsupported message' })
})
