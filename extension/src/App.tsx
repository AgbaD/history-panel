import './App.css'
import { useEffect, useState } from 'react'
import { getMetrics, listVisits, getSeries, type Visit } from './lib/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function App() {
  const [url, setUrl] = useState('')
  const [latest, setLatest] = useState<Visit | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [meta, setMeta] = useState<{page:number;page_size:number;total:number;total_pages:number} | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [series, setSeries] = useState<{day:string;count:number}[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (msg: any) => {
      if (msg?.type === 'ACTIVE_URL') setUrl(msg.url as string)
    }
    chrome.runtime.onMessage.addListener(handler)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs[0]?.url) setUrl(tabs[0].url)
    })

    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  // async function reloadActiveTab() {
  //   if (!chrome?.tabs?.query) return;
  //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
  //     if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
  //   });
  // }

  async function loadAll(currentUrl = url) {
    if (!currentUrl) return;
    try {
      const [m, list, s] = await Promise.all([
        getMetrics(currentUrl),
        listVisits(currentUrl, page, pageSize),
        getSeries(currentUrl, 30),
      ]);
      setLatest(m);
      setVisits(list.items || []);
      setMeta(list.meta || null);
      setSeries(s.points || []);
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    }
  }

  useEffect(() => {
    if (!url) return
    loadAll(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, page, pageSize])

  const canPrev = meta ? page > 1 : false
  const canNext = meta ? page < meta.total_pages : false


  return (
    <div className="w-[380px] min-h-full p-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">History Sidepanel</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 break-words break-all">
          URL: <span className="font-medium">{url || "..."}</span>
        </p>
        {error && (
          <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {/* Current Metrics */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Current Page Metrics</h3>

          {latest ? (
            <>
              {/* Accent chips */}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
                  🔗 Links: <span className="tabular-nums">{latest.link_count}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                  ✍️ Words: <span className="tabular-nums">{latest.word_count}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  🖼️ Images: <span className="tabular-nums">{latest.image_count}</span>
                </span>
              </div>

              {/* Meta info */}
              <div className="mt-4 text-center">
                <div className="text-slate-500 dark:text-slate-400 text-sm">Last visited</div>
                <div className="font-medium text-sm">
                  {new Date(latest.datetime_visited).toLocaleString()}
                </div>
                <div className="mt-2 text-slate-500 dark:text-slate-400 text-sm">URL</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 break-words break-all">
                  {latest.url}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 text-sm text-slate-500">No metrics yet for this page.</div>
          )}
        </section>

        {/* Visits Over Time */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Visits over time</h3>
          {series.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No data.</div>
          ) : (
            <div className="mt-3 h-40 w-full rounded-md">
              <ResponsiveContainer>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                  <Line type="monotone" dataKey="count" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Past Visits */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">Past Visits</h3>

          {visits.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">None yet.</div>
          ) : (
            <>
              <ol className="mt-3 max-h-36 space-y-1 overflow-auto pl-5 text-sm marker:text-slate-400">
                {visits.map((v) => (
                  <li key={v.id} className="list-disc">{new Date(v.datetime_visited).toLocaleString()}</li>
                ))}
              </ol>

              <div className="mt-4 flex items-center justify-between">
                <button
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Page <span className="font-semibold">{meta?.page ?? page}</span> of{" "}
                  <span className="font-semibold">{meta?.total_pages ?? 1}</span>
                </div>

                <button
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
