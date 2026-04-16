// Simple djb2-style hash — no crypto dependency
function simpleHash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
    h = h >>> 0 // keep 32-bit unsigned
  }
  return h.toString(36)
}

const callMap = new Map<string, number[]>()

export function trackCall(tool: string, args: unknown): boolean {
  const key = simpleHash(tool + JSON.stringify(args))
  const now = Date.now()
  const WINDOW_60S = 60_000
  const WINDOW_30S = 30_000

  // Clean stale entries
  const timestamps = (callMap.get(key) || []).filter((t) => now - t < WINDOW_60S)
  timestamps.push(now)
  callMap.set(key, timestamps)

  // Purge keys with no recent activity to prevent unbounded growth
  if (callMap.size > 500) {
    for (const [k, ts] of callMap.entries()) {
      if (ts.every((t) => now - t >= WINDOW_60S)) callMap.delete(k)
    }
  }

  const recent30s = timestamps.filter((t) => now - t < WINDOW_30S)
  return recent30s.length >= 3
}
