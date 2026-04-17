const AGENT_KEYWORDS: Record<string, string[]> = {
  engineer: ["write", "code", "implement", "create", "function", "class", "add", "build", "fix", "refactor", "debug"],
  debugger: ["bug", "error", "crash", "exception", "fix", "broken", "fails", "issue", "problem"],
  reviewer: ["review", "audit", "check", "security", "vulnerability", "pr", "pull request"],
  writer: ["write", "doc", "readme", "documentation", "blog", "guide", "explain"],
  architect: ["design", "architecture", "system", "plan", "structure", "architecture"],
  planner: ["plan", "breakdown", "estimate", "roadmap", "task", "workflow"],
  researcher: ["research", "compare", "find", "search", "explore", "explain how"],
  analyst: ["analyze", "data", "sql", "query", "metric", "report", "chart"],
}

export function classifyPrompt(prompt: string): string | null {
  const lower = prompt.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    scores[agent] = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[agent]++
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best[1] > 0 ? best[0] : null
}

export function formatAgentHint(agent: string): string {
  return `Consider using @${agent} for this task`
}