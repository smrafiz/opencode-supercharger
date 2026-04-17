const FILE_THRESHOLD = 5
const fileCounts = new Map<string, number>()

export function trackFileChange(sessionId: string, filePath: string): number {
  const key = sessionId
  const current = fileCounts.get(key) || 0
  fileCounts.set(key, current + 1)
  return current + 1
}

export function getScopeWarning(sessionId: string): string | null {
  const count = fileCounts.get(sessionId) || 0
  if (count > FILE_THRESHOLD) {
    return `Scope alert: ${count} files touched — consider staying focused`
  }
  return null
}

export function resetScope(sessionId: string): void {
  fileCounts.delete(sessionId)
}