/** Backend API base — uses Vite proxy in dev when VITE_API_URL is unset */
export const API_BASE = import.meta.env.VITE_API_URL || ''

export async function submitGrievance(payload) {
  const res = await fetch(`${API_BASE}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Submission failed')
  return data
}

export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE}/api/health`)
  return res.json()
}

export async function fetchFormConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`)
    if (res.ok) return res.json()
  } catch {
    // fallback to local config
  }
  return null
}
