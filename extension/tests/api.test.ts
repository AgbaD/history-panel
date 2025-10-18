import { listVisits, getSeries, getMetrics } from '../src/util/api'

describe('lib/api', () => {
  const url = 'https://example.com/page'

  test('list visits returns items + meta', async () => {
    const res = await listVisits(url, 2, 5)
    expect(res.items).toHaveLength(5)
    expect(res.meta.page).toBe(2)
    expect(res.meta.total_pages).toBeGreaterThan(1)
  })

  test('get metrics returns a Visit', async () => {
    const m = await getMetrics(url)
    expect(m?.url).toBe(url)
    expect(typeof m?.word_count).toBe('number')
  })

  test('get series returns points', async () => {
    const s = await getSeries(url, 5)
    expect(s.days).toBe(5)
    expect(s.points.length).toBeGreaterThan(0)
  })
})
