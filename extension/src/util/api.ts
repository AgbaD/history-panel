const API_BASE = 'http://localhost:8000'

export type Visit = {
  id: number
  url: string
  datetime_visited: string
  link_count: number
  word_count: number
  image_count: number
}

export async function listVisits(url: string, page = 1, page_size = 10) {
  const r = await fetch(`${API_BASE}/api/visit?url=${encodeURIComponent(url)}&page=${page}&page_size=${page_size}`)
  if (!r.ok) throw new Error('Failed to fetch visits')
  const j = await r.json()
  return j.data as { items: Visit[]; meta: { page:number; page_size:number; total:number; total_pages:number } }
}

export async function getSeries(url: string, days = 30) {
  const r = await fetch(`${API_BASE}/api/visit/series?url=${encodeURIComponent(url)}&days=${days}`)
  if (!r.ok) throw new Error('Failed to fetch series')
  const j = await r.json()
  return j.data as { points: { day: string; count: number }[]; days: number }
}

export async function getMetrics(url: string): Promise<Visit | null> {
  const r = await fetch(`${API_BASE}/api/visit/metrics?url=${encodeURIComponent(url)}`)
  if (!r.ok) throw new Error('Failed to fetch metrics')
  const j = await r.json()
  return j.data as Visit | null
}


