import { checkCommand } from "./safety.ts"
import { checkGitCommand } from "./git-safety.ts"
import { checkPackageManager } from "./pkg-manager.ts"
import { scanContent } from "./code-scanner.ts"
import { scanOutput } from "./secrets.ts"
import { logEvent, rotateAudit } from "./audit.ts"
import { trackCall } from "./loop-detector.ts"
import { scanConfigFiles } from "./config-scan.ts"
import { classifyPrompt } from "./agent-routing.ts"
import { trackFileChange, getScopeWarning, resetScope } from "./scope-alert.ts"

const VERSION = "1.5.0"
let sessionId = ""
let filesModified = 0
let totalCost = 0

export const supercharger = async (ctx: any) => {
  const projectDir = (ctx.directory || process.cwd()) as string
  const client = ctx.client

  console.error(`[Supercharger] v${VERSION} loaded`)

  const notify = async (message: string, type: "info" | "warn" | "error" = "info") => {
    try {
      if (client?.app?.log) {
        await client.app.log({
          level: type,
          message: `[Supercharger] ${message}`,
        })
      }
    } catch {
      // notifications must never crash
    }
  }

  return {
    "tool.execute.before": async (input: any, output: any) => {
      const tool = input.tool as string
      const args = output.args || {}
      const cmd = (args.command || "") as string
      const content = (args.content || args.new_string || "") as string
      const filePath = (args.filePath || "") as string

      if (tool === "bash" && cmd) {
        const danger = checkCommand(cmd)
        if (danger) {
          logEvent({ tool, args: cmd.slice(0, 100), blocked: true, reason: danger.reason })
          notify(`Blocked: ${danger.reason}`, "error")
          throw new Error(`[Supercharger] Blocked: ${danger.reason}`)
        }

        const git = checkGitCommand(cmd)
        if (git) {
          logEvent({ tool, args: cmd.slice(0, 100), blocked: true, reason: git.reason })
          notify(`Blocked: ${git.reason}`, "error")
          throw new Error(`[Supercharger] Blocked: ${git.reason}`)
        }

        const pkg = checkPackageManager(cmd, projectDir)
        if (pkg) {
          logEvent({ tool, args: cmd.slice(0, 100), blocked: true, reason: pkg.reason })
          notify(`Blocked: ${pkg.reason}`, "error")
          throw new Error(`[Supercharger] Blocked: ${pkg.reason}`)
        }
      }

      if ((tool === "edit" || tool === "write") && content) {
        const warnings = scanContent(content, filePath)
        for (const w of warnings) {
          console.error(`[Supercharger] Warning: ${w}`)
          notify(w, "warn")
        }

        if (filePath && sessionId) {
          const count = trackFileChange(sessionId, filePath)
          if (count > 5) {
            const scopeMsg = getScopeWarning(sessionId)
            if (scopeMsg) {
              console.error(`[Supercharger] ${scopeMsg}`)
              notify(scopeMsg, "warn")
            }
          }
        }
      }
    },

    "tool.execute.after": async (input: any, output: any) => {
      const tool = input.tool as string
      const args = (output as any).args || {}
      const result = ((output as any).result || "") as string

      logEvent({
        tool,
        args: JSON.stringify(args).slice(0, 100),
      })

      if (result) {
        scanOutput(result)
      }

      if ((tool === "edit" || tool === "write" || tool === "bash") && args) {
        filesModified++
      }

      if (trackCall(tool, args)) {
        const msg = "LOOP: same tool+args repeated 3x in 30s — try a different approach"
        console.error(`[Supercharger] ${msg}`)
        notify(msg, "warn")
      }
    },

    event: async ({ event }: any) => {
      if (event.type === "session.created") {
        sessionId = event.session_id || `session-${Date.now()}`
        console.error(`[Supercharger] Session started — v${VERSION}`)
        notify("Session started", "info")
        rotateAudit()

        const warnings = scanConfigFiles(projectDir)
        for (const w of warnings) {
          console.error(`[Supercharger] CONFIG WARNING: ${w}`)
          notify(`Config warning: ${w}`, "warn")
        }
      }
      if (event.type === "session.deleted") {
        console.error("[Supercharger] Session ended")
        if (sessionId) resetScope(sessionId)
        notify("Session ended", "info")
      }
      if (event.type === "session.idle") {
        console.error("[Supercharger] Task complete")
        notify("Task complete", "info")
      }
      if (event.type === "message.created") {
        const prompt = event.message?.content || ""
        const agent = classifyPrompt(prompt)
        if (agent) {
          console.error(`[Supercharger] Hint: Consider @${agent} for this task`)
        }
      }
    },

    "tui.toast.show": async (input: any, output: any) => {
      // Allow toast to show - we use this for our own notifications
    },

    "tui.statusLine.variables": async (input: any, output: any) => {
      output.variables = output.variables || {}
      output.variables.supercharger_files = filesModified
      output.variables.supercharger_cost = totalCost.toFixed(2)
      return output
    },
  }
}

export default supercharger
