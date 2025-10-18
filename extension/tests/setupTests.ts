import '@testing-library/jest-dom'
import 'whatwg-fetch'

// ---- Chrome API mock (only what you use) ----
const chromeMock: any = {
  action: {
    onClicked: { addListener: jest.fn() },
  },
  sidePanel: {
    open: jest.fn().mockResolvedValue(undefined),
    setOptions: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    query: jest.fn((_, cb) => cb([{ id: 1, url: 'https://example.com/page' }])),
    reload: jest.fn(),
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
}

Object.defineProperty(global, 'chrome', {
  value: chromeMock,
  writable: false,
})

// ---- JSDOM shims Recharts sometimes needs ----
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(global as any).ResizeObserver = RO

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// ---- Global fetch stub (covers all endpoints you call) ----
// You can tweak the data shapes if your backend responses change.
beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString()

    // POST /api/visit (content script)
    if (url.endsWith('/api/visit') && init?.method === 'POST') {
      return new Response(JSON.stringify({ status: 'created', data: { ok: true } }), { status: 201 }) as any
    }

    // GET /api/visit?url=...&page=...&page_size=...
    if (url.includes('/api/visit?')) {
      const u = new URL(url)
      const page = Number(u.searchParams.get('page') || '1')
      const pageSize = Number(u.searchParams.get('page_size') || '5')
      const pageUrl = u.searchParams.get('url') || 'https://example.com/page'
      const items = Array.from({ length: pageSize }).map((_, i) => ({
        id: (page - 1) * pageSize + i + 1,
        url: pageUrl,
        datetime_visited: new Date().toISOString(),
        link_count: 10,
        word_count: 100,
        image_count: 2,
      }))
      const meta = { page, page_size: pageSize, total: 20, total_pages: 4 }
      return new Response(JSON.stringify({ status: 'ok', data: { items, meta } })) as any
    }

    // GET /api/visit/metrics?url=...
    if (url.includes('/api/visit/metrics')) {
      const u = new URL(url)
      const mUrl = u.searchParams.get('url') || 'https://example.com/page'
      const data = {
        id: 99,
        url: mUrl,
        datetime_visited: new Date().toISOString(),
        link_count: 12,
        word_count: 345,
        image_count: 6,
      }
      return new Response(JSON.stringify({ status: 'ok', data })) as any
    }

    // GET /api/visit/series?url=...&days=...
    if (url.includes('/api/visit/series')) {
      const points = Array.from({ length: 5 }).map((_, idx) => {
        const d = new Date()
        d.setDate(d.getDate() - (4 - idx))
        return { day: d.toISOString(), count: (idx + 1) * 2 }
      })
      return new Response(JSON.stringify({ status: 'ok', data: { points, days: 5 } })) as any
    }

    // default
    return new Response('{}', { status: 200 }) as any
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
