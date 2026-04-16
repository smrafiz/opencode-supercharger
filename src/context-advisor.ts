import { statSync } from "node:fs"
import path from "node:path"

export interface ContextStats {
  used: number
  limit: number
  percentage: number
}

export function getContextStats(ctx: any): ContextStats | null {
  try {
    const session = ctx.client?.session
    if (session?.prompt) {
      const promptLength = session.prompt.length || 0
      const limit = 200000
      return {
        used: Math.floor(promptLength / 4),
        limit,
        percentage: Math.round((promptLength / 4 / limit) * 100),
      }
    }
  } catch {}
  return null
}

export function getContextAdvice(stats: ContextStats): string | null {
  if (stats.percentage >= 90) {
    return "CRITICAL: Context at 90%+ - consider /compact now"
  }
  if (stats.percentage >= 80) {
    return "Warning: Context at 80%+ - recommend 'eco minimal' mode"
  }
  if (stats.percentage >= 70) {
    return "Context at 70%+ - consider compacting soon"
  }
  if (stats.percentage >= 50) {
    return "Context at 50% - monitoring"
  }
  return null
}