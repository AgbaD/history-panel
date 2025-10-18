const VISIT_ENDPOINT = 'http://localhost:8000/api/visit'

const loadContent = async () => {
  await jest.isolateModulesAsync(async () => {
    await import('../src/content/content')
  })
}

describe('content script', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <p aria-hidden="true">hidden aria</p>
        <p style="display:none">hidden css</p>
        <p>visible words here</p>
        <a href="#">link1</a>
        <img src="x.png" />
      </div>
    `
    localStorage.clear()
    jest.restoreAllMocks()
  })

  test('posts metrics once on load with visible word count', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'created' }), { status: 201 }) as any)

    await loadContent()
    window.dispatchEvent(new Event('load'))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(VISIT_ENDPOINT)

    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.link_count).toBe(1)
    expect(body.image_count).toBe(1)
    expect(body.word_count).toBeGreaterThan(0)
    expect(typeof body.datetime_visited).toBe('string')
  })

  test('dedups repeated sends within 15s', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'created' }), { status: 201 }) as any)

    await loadContent()
    window.dispatchEvent(new Event('load'))
    window.dispatchEvent(new Event('load'))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  test('sends again on SPA navigation (pushState + popstate)', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'created' }), { status: 201 }) as any)

    await loadContent()
    window.dispatchEvent(new Event('load'))

    history.pushState({}, '', '/next')
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    window.dispatchEvent(new Event('popstate'))
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })
})
