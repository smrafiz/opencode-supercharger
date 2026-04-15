import type { Plugin } from "./types.ts";

const VERSION = "1.0.0";

const DANGEROUS = [
  {
    pat: /rm\s+-rf\s+(\/|~|\$HOME|\.\.)/,
    msg: "recursive force rm on dangerous target",
  },
  { pat: /DROP\s+TABLE/i, msg: "DROP TABLE is destructive" },
  { pat: /DROP\s+DATABASE/i, msg: "DROP DATABASE is destructive" },
  { pat: /chmod\s+-R?\s+777/, msg: "chmod 777 is insecure" },
  { pat: /mkfs\./, msg: "filesystem creation" },
  { pat: /dd\s+if=/, msg: "dd with raw input" },
  { pat: />\s*\/dev\/sd/, msg: "direct disk write" },
  { pat: /curl.*\|\s*(bash|sh|zsh)/, msg: "pipe to shell" },
  { pat: /wget.*\|\s*(bash|sh|zsh)/, msg: "pipe to shell" },
  { pat: /:\(\)\{.*:.*\|.*:.*\};:/, msg: "fork bomb" },
  { pat: /kill\s+-9\s+-1/, msg: "kill -9 -1" },
];

const CREDS = [
  /[Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*=/,
  /[Ss][Ee][Cc][Rr][Ee][Tt][_-]?[Kk][Ee][Yy]\s*=/,
  /[Aa][Kk][Ii][A-Z0-9]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{48}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\s*=/,
  /-----BEGIN.*PRIVATE KEY-----/,
];

const CLIPBOARD = [/pbpaste|pbcopy/, /xclip|xsel/, /wl-paste|wl-copy/];
const SENSITIVE = [
  /Library\/Keychains/,
  /Library\/Messages/,
  /\/Cookies$/,
  /\.1password/,
];

const GIT_BLOCKED = [
  {
    pat: /git\s+push\s+.*--force.*\s+(main|master)/,
    msg: "force push to protected",
  },
  { pat: /git\s+reset\s+--hard/, msg: "reset --hard destroys work" },
  { pat: /git\s+checkout\s+.*--\s*\./, msg: "checkout -- discards changes" },
  { pat: /git\s+clean\s+-f/, msg: "clean -f removes files" },
  { pat: /git\s+stash\s+(drop|clear)/, msg: "stash drop/clear permanent" },
];

const PKG_MANAGER = [
  {
    lock: "pnpm-lock.yaml",
    cmd: /^npm\s+(install|run|exec|ci|start|test|add|remove|update)/,
    msg: "pnpm",
  },
  {
    lock: "yarn.lock",
    cmd: /^npm\s+(install|ci|add|remove|update)/,
    msg: "yarn",
  },
  {
    lock: "bun.lockb",
    cmd: /^npm\s+(install|run|exec|ci|start|test|add|remove|update)/,
    msg: "bun",
  },
  {
    lock: "bun.lock",
    cmd: /^npm\s+(install|run|exec|ci|start|test|add|remove|update)/,
    msg: "bun",
  },
  { lock: "uv.lock", cmd: /^pip\s+install/, msg: "uv" },
  { lock: "poetry.lock", cmd: /^pip\s+install/, msg: "poetry" },
];

const CODE_VULN = [
  { pat: /eval\s*\(/, msg: "eval() code injection" },
  { pat: /\.innerHTML\s*=/, msg: "innerHTML XSS" },
  { pat: /dangerouslySetInnerHTML/, msg: "React XSS" },
  { pat: /document\.write\s*\(/, msg: "document.write XSS" },
  { pat: /new\s+Function\s*\(/, msg: "Function() injection" },
  { pat: /pickle\.load/, msg: "unsafe deserialization" },
  { pat: /\bexec\s*\(/, msg: "exec() code execution" },
  { pat: /os\.system\s*\(/, msg: "shell injection" },
  { pat: /subprocess\.run.*shell\s*=\s*True/, msg: "subprocess shell=True" },
];

const auditLog: {
  t: string;
  tool: string;
  a: string;
  bl?: boolean;
  r?: string;
}[] = [];
const toolHistory: { tool: string; args: unknown; time: number }[] = [];

function block(msg: string): never {
  auditLog.push({
    t: new Date().toISOString(),
    tool: "blocked",
    a: "blocked",
    bl: true,
    r: msg,
  });
  throw new Error(`[Supercharger] Blocked: ${msg}`);
}

function warn(msg: string): void {
  console.error(`[Supercharger Warning] ${msg}`);
}

function norm(cmd: string): string {
  return cmd.trim().replace(/\s+/g, " ");
}

function detectLoop(): boolean {
  const now = Date.now();
  const recent = toolHistory.filter((x) => now - x.time < 30000);
  if (recent.length < 5) return false;
  const last = recent[recent.length - 1];
  const matches = recent.filter(
    (x) =>
      x.tool === last.tool &&
      JSON.stringify(x.args) === JSON.stringify(last.args),
  );
  return matches.length >= 3;
}

export const supercharger: Plugin = async () => {
  console.error(`[Supercharger] v${VERSION} loaded`);

  return {
    "tool.execute.before": async (input, args) => {
      const tool = input.tool as string;
      const cmd = (args.command as string) || "";
      const content =
        (args.content as string) || (args.new_string as string) || "";
      const filePath = (args.filePath as string) || "";

      if (tool === "bash" && cmd) {
        if (cmd.startsWith("git commit")) return;
        const n = norm(cmd);
        for (const { pat, msg } of DANGEROUS) {
          if (pat.test(n)) block(msg);
        }
        for (const pat of CREDS) {
          if (pat.test(n)) block("credential in command");
        }
        for (const pat of CLIPBOARD) {
          if (pat.test(n)) block("clipboard access");
        }
        for (const pat of SENSITIVE) {
          if (pat.test(n)) block("sensitive data");
        }
        for (const { pat, msg } of GIT_BLOCKED) {
          if (pat.test(n)) block(msg);
        }

        const projectDir = Deno.cwd();
        for (const { lock, cmd: cmdPat, msg: manager } of PKG_MANAGER) {
          try {
            const lockPath = `${projectDir}/${lock}`;
            const stat = await Deno.stat(lockPath).catch(() => null);
            if (stat && !stat.isDirectory && cmdPat.test(n)) {
              block(`project uses ${manager}, not npm`);
            }
          } catch {}
        }
      }

      if ((tool === "edit" || tool === "write") && content) {
        for (const { pat, msg } of CODE_VULN) {
          if (pat.test(content)) warn(msg);
        }
        if (filePath && /[\$\(\)`;|&&]/.test(filePath))
          warn("file path shell metacharacters");
        if (/password\s*=\s*"[^"]+"/.test(content)) warn("hardcoded password");
        if (/secret\s*=\s*"[^"]+"/.test(content)) warn("hardcoded secret");
        if (/api_key\s*=\s*"[^"]+"/.test(content)) warn("hardcoded api_key");
      }

      toolHistory.push({ tool, args, time: Date.now() });
    },

    "tool.execute.after": async (input, output, args) => {
      const tool = input.tool as string;
      const result = (output as { result?: string }).result || "";

      auditLog.push({
        t: new Date().toISOString(),
        tool,
        a: JSON.stringify(args).slice(0, 100),
      });

      if (result) {
        for (const pat of CREDS) {
          if (pat.test(result)) warn("SECRET in output");
        }
      }

      if (detectLoop()) warn("LOOP: same tool+args 3x in 30s");
    },

    event: async ({ event }) => {
      if (event.type === "session.created") {
        console.error(`[Supercharger] Session started — ${VERSION}`);
      }
      if (event.type === "session.deleted") {
        console.error(
          `[Supercharger] Session ended — ${auditLog.length} events`,
        );
      }
    },
  };
};

export default supercharger;
