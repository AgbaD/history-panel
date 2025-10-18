// Import the script to register listeners.
import '../src/background/background'

describe('background script', () => {
  test('opens side panel and sends ACTIVE_URL on click', async () => {
    const add = chrome.action.onClicked.addListener as jest.Mock
    expect(add).toHaveBeenCalledTimes(1)

    const listener = add.mock.calls[0][0]
    await listener({ id: 7, url: 'https://foo.dev/page' })

    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 7 })
    expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
      tabId: 7,
      path: 'index.html',
      enabled: true,
    })
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'ACTIVE_URL',
      url: 'https://foo.dev/page',
    })
  })

  test('PING message responds with ok', () => {
    const add = chrome.runtime.onMessage.addListener as jest.Mock
    expect(add).toHaveBeenCalledTimes(1)

    const registered = add.mock.calls[0][0]
    const sendResponse = jest.fn()

    const ret = registered({ type: 'PING' }, {}, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ ok: true })
    expect(ret === true || ret === undefined).toBeTruthy()
  })
})
