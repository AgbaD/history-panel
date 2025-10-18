const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
const VISIT_ENDPOINT = `${API_BASE}/api/visit`;
const DEDUP_WINDOW_SEC = 15;

// ---- Utilities ------------------------------------------------------------

function isElementVisible(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;

  const tag = el.tagName.toLowerCase();
  // ignore non-content elements
  if (["script", "style", "noscript", "template", "svg", "meta", "link"].includes(tag)) {
    return false;
  }

  // aria-hidden or CSS hidden/transparent
  if (el.getAttribute("aria-hidden") === "true") return false;

  const style = getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    parseFloat(style.opacity || "1") === 0
  ) {
    return false;
  }

  // zero-size / out of flow (allow body/html)
  const rect = el.getBoundingClientRect();
  if ((rect.width === 0 && rect.height === 0) || el.offsetParent === null) {
    if (!["body", "html"].includes(tag)) return false;
  }

  return true;
}

function countVisibleWords(): number {
  if (!document.body) return 0;

  const filter: NodeFilter = {
    acceptNode(node: Node): number {
      const parent = (node as Text).parentElement;
      if (!parent || !isElementVisible(parent)) return NodeFilter.FILTER_REJECT;

      const txt = (node as Text).nodeValue?.replace(/\s+/g, " ").trim() ?? "";
      if (!txt) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    }
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, filter);

  let words = 0;
  while (walker.nextNode()) {
    const t = (walker.currentNode as Text).nodeValue ?? "";
    const w = t.trim().split(/\s+/).filter(Boolean);
    words += w.length;
  }
  return words;
}

function collectMetrics() {
  const url = location.href;
  const link_count = document.querySelectorAll("a").length;
  const image_count = document.querySelectorAll("img").length;
  const word_count = countVisibleWords();
  const datetime_visited = new Date().toISOString();
  return { url, link_count, image_count, word_count, datetime_visited };
}

async function postJSON(url: string, body: unknown) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // swallow errors (backend may be off)
  }
}

// ---- Dedup per-URL --------------------------------------------------------

const LAST_KEY_PREFIX = "historySidepanel:last:";

function keyForUrl(u: string) {
  const url = new URL(u);
  // include query to differentiate pages within the same path
  return `${LAST_KEY_PREFIX}${url.origin}${url.pathname}${url.search}`;
}

function shouldSkipVisit(u: string): boolean {
  try {
    const k = keyForUrl(u);
    const prev = Number(localStorage.getItem(k) || "0");
    if (!Number.isFinite(prev)) return false;
    return Date.now() - prev < DEDUP_WINDOW_SEC * 1000;
  } catch {
    return false;
  }
}

function markVisit(u: string) {
  try {
    localStorage.setItem(keyForUrl(u), String(Date.now()));
  } catch {
    // ignore quota/availability errors
  }
}

// ---- Send metrics (initial + SPA) ----------------------------------------

async function sendMetricsIfNeeded() {
  const url = location.href;
  if (shouldSkipVisit(url)) return;

  const metrics = collectMetrics();
  markVisit(url);
  await postJSON(VISIT_ENDPOINT, metrics);
}

// For SPA navigations: when URL changes without reload, treat as a new visit
function hookSpaNavigation() {
  const origPushState = history.pushState.bind(history);
  history.pushState = function (...args: Parameters<History['pushState']>) {
    const ret = origPushState(...args);
    sendMetricsIfNeeded();
    return ret;
  };

  window.addEventListener("popstate", () => {
    sendMetricsIfNeeded();
  });
}

// ---- Boot -----------------------------------------------------------------

window.addEventListener("load", () => {
  sendMetricsIfNeeded();
});

hookSpaNavigation();
