/**
 * JalRakshak API Service
 * Connects frontend to FastAPI backend at localhost:8000
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error ${res.status}`)
  }
  return res.json()
}

/** GET /api/v1/health */
export const checkHealth = () => apiFetch('/api/v1/health')

/** GET /api/v1/cities */
export const getCities = () => apiFetch('/api/v1/cities')

/** POST /api/v1/predict */
export const predict = (payload) =>
  apiFetch('/api/v1/predict', { method: 'POST', body: JSON.stringify(payload) })

/** POST /api/v1/simulate */
export const simulate = (payload) =>
  apiFetch('/api/v1/simulate', { method: 'POST', body: JSON.stringify(payload) })
