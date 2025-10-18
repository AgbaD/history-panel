import type { RuntimeMessage } from "../types/messages"

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  if (!tab.id) return
  await chrome.sidePanel.open({ tabId: tab.id })
  await chrome.sidePanel.setOptions({ tabId: tab.id, path: 'index.html', enabled: true })
  if (tab.url) {
    chrome.runtime.sendMessage({ type: 'ACTIVE_URL', url: tab.url })
  }
})

chrome.runtime.onMessage.addListener(
  (msg: RuntimeMessage, _sender, sendResponse: (resp?: { ok: boolean }) => void) => {
    if (msg.type === 'PING') {
      sendResponse({ ok: true });
      return true;
    }
    return false;
  }
)
