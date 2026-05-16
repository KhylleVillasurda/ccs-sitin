import axios from 'axios'

const api = axios.create({
  baseURL: '/api',   // routes through Vite's proxy → localhost:8000
  timeout: 12000,
})

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Global 401 handler — clear session and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Simple in-memory GET cache ──────────────────────────────────────────────
// Safe approach: wrap api.get instead of touching axios internals.
const _cache = new Map()

const CACHE_MS = {
  '/reports/leaderboard': 60_000,
  '/announcements/':      30_000,
  '/notifications/count': 15_000,
  '/lab-software/':       120_000,  // software list changes rarely
}

const _get = api.get.bind(api)
api.get = (url, config) => {
  // Match by exact key OR by prefix (for URLs with query params like /lab-software/?lab=524)
  const matchedKey = Object.keys(CACHE_MS).find(k => url === k || url.startsWith(k))
  const ttl = matchedKey ? CACHE_MS[matchedKey] : 0
  if (ttl > 0) {
    const hit = _cache.get(url)
    if (hit && hit.expires > Date.now()) {
      return Promise.resolve({ data: hit.data, status: 200, cached: true })
    }
  }
  return _get(url, config).then(res => {
    if (ttl > 0) _cache.set(url, { data: res.data, expires: Date.now() + ttl })
    return res
  })
}

/** Bust cache entries whose key contains urlFragment. Call after mutations. */
export function bustCache(urlFragment) {
  _cache.forEach((_, key) => { if (key.includes(urlFragment)) _cache.delete(key) })
}

export default api
