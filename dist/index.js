// src/safety.ts
var DESTRUCTIVE = [
  { pat: /rm\s+-rf\s+(\/|~|\$HOME|\.\.)/, msg: "recursive force rm on dangerous target" },
  { pat: /DROP\s+TABLE/i, msg: "DROP TABLE is destructive" },
  { pat: /DROP\s+DATABASE/i, msg: "DROP DATABASE is destructive" },
  { pat: /chmod\s+-?R?\s*777/, msg: "chmod 777 is insecure" },
  { pat: /mkfs\./, msg: "filesystem creation command" },
  { pat: /\bdd\s+if=/, msg: "dd with raw input" },
  { pat: />\s*\/dev\/sd/, msg: "direct disk write" },
  { pat: /curl[^|]*\|\s*(ba)?sh/, msg: "pipe-to-shell execution" },
  { pat: /wget[^|]*\|\s*(ba)?sh/, msg: "pipe-to-shell execution" },
  { pat: /:\(\)\s*\{.*:\s*\|.*:\s*\}\s*;/, msg: "fork bomb" },
  { pat: /kill\s+-9\s+-1/, msg: "kill -9 -1 kills all processes" },
  { pat: /\beval\s+/, msg: "eval execution" },
  { pat: /base64\s+.*\|\s*(ba)?sh/, msg: "base64 pipe-to-shell" },
  { pat: /echo\s+.*\|\s*base64\s+-d.*\|\s*(ba)?sh/, msg: "base64 decode pipe-to-shell" }
];
var CRED_PATTERNS = [
  /[Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*=/,
  /[Ss][Ee][Cc][Rr][Ee][Tt][_-]?[Kk][Ee][Yy]\s*=/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{48}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\s*=/,
  /-----BEGIN\s+.*PRIVATE KEY-----/,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/
];
var CLIPBOARD_PATTERNS = [
  /\bpbpaste\b|\bpbcopy\b/,
  /\bxclip\b|\bxsel\b/,
  /\bwl-paste\b|\bwl-copy\b/
];
var SENSITIVE_PATHS = [
  /Library\/Keychains/,
  /Library\/Messages/,
  /Signal\/sql/,
  /\.1password/,
  /gnome-keyring/,
  /\.password-store/,
  /\/Cookies$/,
  /\/Login\s+Data$/
];
var BROWSER_DATA = [
  /Application\s+Support\/Google\/Chrome/,
  /Application\s+Support\/Arc/,
  /\.mozilla\/firefox/i,
  /Application\s+Support\/Firefox/,
  /Application\s+Support\/BraveSoftware/,
  /Application\s+Support\/Microsoft\s+Edge/,
  /\/History$/
];
var SHELL_HISTORY = [
  /\.bash_history/,
  /\.zsh_history/,
  /\.python_history/,
  /\.psql_history/,
  /\.mysql_history/,
  /\.node_repl_history/
];
var SSH_OPS = [
  /\bssh-keygen\b/,
  /\bssh-add\b/,
  /\bssh-copy-id\b/
];
var CRONTAB_MOD = [
  /\bcrontab\s+-e\b/,
  /\bcrontab\s+-\b/
];
var SHELL_PROFILE_MOD = [
  />>\s*~\/\.bashrc/,
  />>\s*~\/\.zshrc/,
  />>\s*~\/\.profile/
];
var SELF_MOD = [
  /\.opencode\/settings/,
  /opencode\.json/
];
function checkCommand(cmd) {
  const n = cmd.trim().replace(/\s+/g, " ");
  for (const { pat, msg } of DESTRUCTIVE) {
    if (pat.test(n))
      return { blocked: true, reason: msg };
  }
  for (const pat of CRED_PATTERNS) {
    if (pat.test(n))
      return { blocked: true, reason: "credential pattern in command" };
  }
  for (const pat of CLIPBOARD_PATTERNS) {
    if (pat.test(n))
      return { blocked: true, reason: "clipboard access" };
  }
  for (const pat of SENSITIVE_PATHS) {
    if (pat.test(n))
      return { blocked: true, reason: "sensitive path access" };
  }
  for (const pat of BROWSER_DATA) {
    if (pat.test(n))
      return { blocked: true, reason: "browser data access" };
  }
  for (const pat of SHELL_HISTORY) {
    if (pat.test(n))
      return { blocked: true, reason: "shell history access" };
  }
  for (const pat of SSH_OPS) {
    if (pat.test(n))
      return { blocked: true, reason: "SSH key operation" };
  }
  for (const pat of CRONTAB_MOD) {
    if (pat.test(n))
      return { blocked: true, reason: "crontab modification" };
  }
  for (const pat of SHELL_PROFILE_MOD) {
    if (pat.test(n))
      return { blocked: true, reason: "shell profile modification" };
  }
  if (/\b(write|echo|tee|cat\s*>|sed\s+-i)\b/.test(n)) {
    for (const pat of SELF_MOD) {
      if (pat.test(n))
        return { blocked: true, reason: "self-modification of opencode config" };
    }
  }
  return null;
}

// src/git-safety.ts
var BLOCKED_GIT = [
  {
    pat: /git\s+push\s+(?:.*\s)?--force(?:-with-lease)?(?:\s+.*)?(?:origin\s+)?(main|master)/,
    msg: "force push to protected branch (main/master)"
  },
  {
    pat: /git\s+push\s+(?:.*\s)?(?:origin\s+)?(main|master)(?:\s+.*)?--force(?:-with-lease)?/,
    msg: "force push to protected branch (main/master)"
  },
  {
    pat: /git\s+reset\s+--hard/,
    msg: "git reset --hard destroys uncommitted work"
  },
  {
    pat: /git\s+checkout\s+--\s*\./,
    msg: "git checkout -- . discards all changes"
  },
  {
    pat: /git\s+restore\s+\./,
    msg: "git restore . discards all changes"
  },
  {
    pat: /git\s+clean\s+(?:.*-[a-zA-Z]*f|-f)/,
    msg: "git clean -f removes untracked files"
  },
  {
    pat: /git\s+branch\s+-D\s+(main|master)/,
    msg: "deleting protected branch (main/master)"
  },
  {
    pat: /git\s+stash\s+(drop|clear)/,
    msg: "git stash drop/clear permanently removes stashed changes"
  }
];
var WARN_GIT = [
  {
    pat: /git\s+push\s+(?:.*\s)?--force(?:-with-lease)?/,
    msg: "force push to non-protected branch \u2014 verify this is intentional"
  }
];
function checkGitCommand(cmd) {
  const n = cmd.trim().replace(/\s+/g, " ");
  for (const { pat, msg } of BLOCKED_GIT) {
    if (pat.test(n))
      return { blocked: true, reason: msg };
  }
  for (const { pat, msg } of WARN_GIT) {
    if (pat.test(n)) {
      console.error(`[Supercharger] Git warning: ${msg}`);
    }
  }
  return null;
}

// src/pkg-manager.ts
var {existsSync} = (() => ({}));

// node:path
var L = Object.create;
var b = Object.defineProperty;
var z = Object.getOwnPropertyDescriptor;
var D = Object.getOwnPropertyNames;
var T = Object.getPrototypeOf;
var R = Object.prototype.hasOwnProperty;
var _ = (f, e) => () => (e || f((e = { exports: {} }).exports, e), e.exports);
var E = (f, e) => {
  for (var r in e)
    b(f, r, { get: e[r], enumerable: true });
};
var C = (f, e, r, l) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let i of D(e))
      !R.call(f, i) && i !== r && b(f, i, { get: () => e[i], enumerable: !(l = z(e, i)) || l.enumerable });
  return f;
};
var A = (f, e, r) => (C(f, e, "default"), r && C(r, e, "default"));
var y = (f, e, r) => (r = f != null ? L(T(f)) : {}, C(e || !f || !f.__esModule ? b(r, "default", { value: f, enumerable: true }) : r, f));
var h = _((F, S) => {
  function c(f) {
    if (typeof f != "string")
      throw new TypeError("Path must be a string. Received " + JSON.stringify(f));
  }
  function w(f, e) {
    for (var r = "", l = 0, i = -1, s = 0, n, t = 0;t <= f.length; ++t) {
      if (t < f.length)
        n = f.charCodeAt(t);
      else {
        if (n === 47)
          break;
        n = 47;
      }
      if (n === 47) {
        if (!(i === t - 1 || s === 1))
          if (i !== t - 1 && s === 2) {
            if (r.length < 2 || l !== 2 || r.charCodeAt(r.length - 1) !== 46 || r.charCodeAt(r.length - 2) !== 46) {
              if (r.length > 2) {
                var a = r.lastIndexOf("/");
                if (a !== r.length - 1) {
                  a === -1 ? (r = "", l = 0) : (r = r.slice(0, a), l = r.length - 1 - r.lastIndexOf("/")), i = t, s = 0;
                  continue;
                }
              } else if (r.length === 2 || r.length === 1) {
                r = "", l = 0, i = t, s = 0;
                continue;
              }
            }
            e && (r.length > 0 ? r += "/.." : r = "..", l = 2);
          } else
            r.length > 0 ? r += "/" + f.slice(i + 1, t) : r = f.slice(i + 1, t), l = t - i - 1;
        i = t, s = 0;
      } else
        n === 46 && s !== -1 ? ++s : s = -1;
    }
    return r;
  }
  function J(f, e) {
    var r = e.dir || e.root, l = e.base || (e.name || "") + (e.ext || "");
    return r ? r === e.root ? r + l : r + f + l : l;
  }
  var g = { resolve: function() {
    for (var e = "", r = false, l, i = arguments.length - 1;i >= -1 && !r; i--) {
      var s;
      i >= 0 ? s = arguments[i] : (l === undefined && (l = process.cwd()), s = l), c(s), s.length !== 0 && (e = s + "/" + e, r = s.charCodeAt(0) === 47);
    }
    return e = w(e, !r), r ? e.length > 0 ? "/" + e : "/" : e.length > 0 ? e : ".";
  }, normalize: function(e) {
    if (c(e), e.length === 0)
      return ".";
    var r = e.charCodeAt(0) === 47, l = e.charCodeAt(e.length - 1) === 47;
    return e = w(e, !r), e.length === 0 && !r && (e = "."), e.length > 0 && l && (e += "/"), r ? "/" + e : e;
  }, isAbsolute: function(e) {
    return c(e), e.length > 0 && e.charCodeAt(0) === 47;
  }, join: function() {
    if (arguments.length === 0)
      return ".";
    for (var e, r = 0;r < arguments.length; ++r) {
      var l = arguments[r];
      c(l), l.length > 0 && (e === undefined ? e = l : e += "/" + l);
    }
    return e === undefined ? "." : g.normalize(e);
  }, relative: function(e, r) {
    if (c(e), c(r), e === r || (e = g.resolve(e), r = g.resolve(r), e === r))
      return "";
    for (var l = 1;l < e.length && e.charCodeAt(l) === 47; ++l)
      ;
    for (var i = e.length, s = i - l, n = 1;n < r.length && r.charCodeAt(n) === 47; ++n)
      ;
    for (var t = r.length, a = t - n, v = s < a ? s : a, u = -1, o = 0;o <= v; ++o) {
      if (o === v) {
        if (a > v) {
          if (r.charCodeAt(n + o) === 47)
            return r.slice(n + o + 1);
          if (o === 0)
            return r.slice(n + o);
        } else
          s > v && (e.charCodeAt(l + o) === 47 ? u = o : o === 0 && (u = 0));
        break;
      }
      var k = e.charCodeAt(l + o), P = r.charCodeAt(n + o);
      if (k !== P)
        break;
      k === 47 && (u = o);
    }
    var d = "";
    for (o = l + u + 1;o <= i; ++o)
      (o === i || e.charCodeAt(o) === 47) && (d.length === 0 ? d += ".." : d += "/..");
    return d.length > 0 ? d + r.slice(n + u) : (n += u, r.charCodeAt(n) === 47 && ++n, r.slice(n));
  }, _makeLong: function(e) {
    return e;
  }, dirname: function(e) {
    if (c(e), e.length === 0)
      return ".";
    for (var r = e.charCodeAt(0), l = r === 47, i = -1, s = true, n = e.length - 1;n >= 1; --n)
      if (r = e.charCodeAt(n), r === 47) {
        if (!s) {
          i = n;
          break;
        }
      } else
        s = false;
    return i === -1 ? l ? "/" : "." : l && i === 1 ? "//" : e.slice(0, i);
  }, basename: function(e, r) {
    if (r !== undefined && typeof r != "string")
      throw new TypeError('"ext" argument must be a string');
    c(e);
    var l = 0, i = -1, s = true, n;
    if (r !== undefined && r.length > 0 && r.length <= e.length) {
      if (r.length === e.length && r === e)
        return "";
      var t = r.length - 1, a = -1;
      for (n = e.length - 1;n >= 0; --n) {
        var v = e.charCodeAt(n);
        if (v === 47) {
          if (!s) {
            l = n + 1;
            break;
          }
        } else
          a === -1 && (s = false, a = n + 1), t >= 0 && (v === r.charCodeAt(t) ? --t === -1 && (i = n) : (t = -1, i = a));
      }
      return l === i ? i = a : i === -1 && (i = e.length), e.slice(l, i);
    } else {
      for (n = e.length - 1;n >= 0; --n)
        if (e.charCodeAt(n) === 47) {
          if (!s) {
            l = n + 1;
            break;
          }
        } else
          i === -1 && (s = false, i = n + 1);
      return i === -1 ? "" : e.slice(l, i);
    }
  }, extname: function(e) {
    c(e);
    for (var r = -1, l = 0, i = -1, s = true, n = 0, t = e.length - 1;t >= 0; --t) {
      var a = e.charCodeAt(t);
      if (a === 47) {
        if (!s) {
          l = t + 1;
          break;
        }
        continue;
      }
      i === -1 && (s = false, i = t + 1), a === 46 ? r === -1 ? r = t : n !== 1 && (n = 1) : r !== -1 && (n = -1);
    }
    return r === -1 || i === -1 || n === 0 || n === 1 && r === i - 1 && r === l + 1 ? "" : e.slice(r, i);
  }, format: function(e) {
    if (e === null || typeof e != "object")
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof e);
    return J("/", e);
  }, parse: function(e) {
    c(e);
    var r = { root: "", dir: "", base: "", ext: "", name: "" };
    if (e.length === 0)
      return r;
    var l = e.charCodeAt(0), i = l === 47, s;
    i ? (r.root = "/", s = 1) : s = 0;
    for (var n = -1, t = 0, a = -1, v = true, u = e.length - 1, o = 0;u >= s; --u) {
      if (l = e.charCodeAt(u), l === 47) {
        if (!v) {
          t = u + 1;
          break;
        }
        continue;
      }
      a === -1 && (v = false, a = u + 1), l === 46 ? n === -1 ? n = u : o !== 1 && (o = 1) : n !== -1 && (o = -1);
    }
    return n === -1 || a === -1 || o === 0 || o === 1 && n === a - 1 && n === t + 1 ? a !== -1 && (t === 0 && i ? r.base = r.name = e.slice(1, a) : r.base = r.name = e.slice(t, a)) : (t === 0 && i ? (r.name = e.slice(1, n), r.base = e.slice(1, a)) : (r.name = e.slice(t, n), r.base = e.slice(t, a)), r.ext = e.slice(n, a)), t > 0 ? r.dir = e.slice(0, t - 1) : i && (r.dir = "/"), r;
  }, sep: "/", delimiter: ":", win32: null, posix: null };
  g.posix = g;
  S.exports = g;
});
var m = {};
E(m, { default: () => q });
A(m, y(h()));
var q = y(h());

// src/pkg-manager.ts
var { join } = q;
var PKG_RULES = [
  {
    lock: "pnpm-lock.yaml",
    pat: /^npm\s+(install|run|exec|ci|add|remove|update)\b/,
    manager: "pnpm"
  },
  {
    lock: "yarn.lock",
    pat: /^npm\s+(install|ci|add|remove|update)\b/,
    manager: "yarn"
  },
  {
    lock: "bun.lockb",
    pat: /^npm\s+(install|run|exec|ci|add|remove|update)\b/,
    manager: "bun"
  },
  {
    lock: "bun.lock",
    pat: /^npm\s+(install|run|exec|ci|add|remove|update)\b/,
    manager: "bun"
  },
  {
    lock: "uv.lock",
    pat: /^pip\s+install\b/,
    manager: "uv"
  },
  {
    lock: "poetry.lock",
    pat: /^pip\s+install\b/,
    manager: "poetry"
  }
];
function checkPackageManager(cmd, projectDir) {
  const n = cmd.trim().replace(/\s+/g, " ");
  for (const { lock, pat, manager } of PKG_RULES) {
    if (existsSync(join(projectDir, lock)) && pat.test(n)) {
      return {
        blocked: true,
        reason: `project uses ${manager} (found ${lock}), not npm \u2014 use ${manager} instead`
      };
    }
  }
  return null;
}

// src/code-scanner.ts
var JS_TS_PATTERNS = [
  { pat: /\beval\s*\(/, msg: "eval() enables code injection" },
  { pat: /\.innerHTML\s*=/, msg: "innerHTML assignment is XSS-prone" },
  { pat: /dangerouslySetInnerHTML/, msg: "dangerouslySetInnerHTML is XSS-prone" },
  { pat: /document\.write\s*\(/, msg: "document.write() is XSS-prone" },
  { pat: /new\s+Function\s*\(/, msg: "new Function() enables code injection" }
];
var PYTHON_PATTERNS = [
  { pat: /pickle\.loads?\s*\(/, msg: "pickle.load() unsafe deserialization" },
  { pat: /\bexec\s*\(/, msg: "exec() enables code execution" },
  { pat: /\bcompile\s*\(/, msg: "compile() enables code execution" },
  { pat: /os\.system\s*\(/, msg: "os.system() shell injection risk" },
  { pat: /subprocess\.(?:run|call|Popen).*shell\s*=\s*True/, msg: "subprocess shell=True injection risk" },
  { pat: /\b__import__\s*\(/, msg: "__import__() dynamic import risk" }
];
var SQL_PATTERNS = [
  { pat: /f["']\s*(SELECT|INSERT|UPDATE|DELETE)\s/i, msg: "f-string SQL query \u2014 use parameterized queries" },
  { pat: /"(SELECT|INSERT|UPDATE|DELETE)[^"]*"\s*\+/i, msg: "string-concatenated SQL \u2014 use parameterized queries" },
  { pat: /'(SELECT|INSERT|UPDATE|DELETE)[^']*'\s*\+/i, msg: "string-concatenated SQL \u2014 use parameterized queries" }
];
var SECRET_PATTERNS = [
  { pat: /password\s*=\s*["'][^"']{3,}["']/, msg: "hardcoded password" },
  { pat: /secret\s*=\s*["'][^"']{3,}["']/, msg: "hardcoded secret" },
  { pat: /api[_-]?key\s*=\s*["'][^"']{3,}["']/i, msg: "hardcoded API key" }
];
var CRYPTO_PATTERNS = [
  { pat: /crypto\.createHash\s*\(\s*['"]md5['"]/, msg: "MD5 is cryptographically weak" },
  { pat: /hashlib\.md5\s*\(/, msg: "MD5 is cryptographically weak" }
];
var GITHUB_ACTIONS_PATTERNS = [
  { pat: /\$\{\{\s*github\.event\./, msg: "unsanitized github.event expression \u2014 injection risk in Actions" }
];
var OBFUSCATION_PATTERNS = [
  { pat: /\batob\s*\(/, msg: "atob() \u2014 potential obfuscation" },
  { pat: /\bbtoa\s*\(/, msg: "btoa() \u2014 potential obfuscation" },
  { pat: /base64_decode\s*\(/, msg: "base64_decode() \u2014 potential obfuscation" },
  { pat: /b64decode\s*\(/, msg: "b64decode() \u2014 potential obfuscation" }
];
var ZERO_WIDTH_RE = /[\u200B\u200C\u200D\uFEFF\u2060]/;
var FILE_METACHAR_RE = /[\$\(\)`;\|]|&&/;
function scanContent(content, filePath) {
  const warnings = [];
  for (const { pat, msg } of JS_TS_PATTERNS) {
    if (pat.test(content))
      warnings.push(msg);
  }
  for (const { pat, msg } of PYTHON_PATTERNS) {
    if (pat.test(content))
      warnings.push(msg);
  }
  for (const { pat, msg } of SQL_PATTERNS) {
    if (pat.test(content))
      warnings.push(msg);
  }
  for (const { pat, msg } of SECRET_PATTERNS) {
    if (pat.test(content))
      warnings.push(msg);
  }
  for (const { pat, msg } of CRYPTO_PATTERNS) {
    if (pat.test(content))
      warnings.push(msg);
  }
  if (/\.(ya?ml)$/.test(filePath)) {
    for (const { pat, msg } of GITHUB_ACTIONS_PATTERNS) {
      if (pat.test(content))
        warnings.push(msg);
    }
  }
  for (const { pat, msg } of OBFUSCATION_PATTERNS) {
    if (pat.test(content))
      warnings.push(msg);
  }
  if (ZERO_WIDTH_RE.test(content)) {
    warnings.push("zero-width unicode characters detected \u2014 possible injection/obfuscation");
  }
  if (filePath && FILE_METACHAR_RE.test(filePath)) {
    warnings.push(`file path contains shell metacharacters: ${filePath}`);
  }
  return warnings;
}

// src/secrets.ts
function scanOutput(output) {
  for (const pat of CRED_PATTERNS) {
    if (pat.test(output)) {
      console.error("[Supercharger] WARNING: possible secret/credential detected in tool output");
      return true;
    }
  }
  return false;
}

// src/audit.ts
var {existsSync: existsSync2, mkdirSync, appendFileSync, readdirSync, unlinkSync, statSync} = (() => ({}));

// node:os
var c = Object.create;
var a = Object.defineProperty;
var m2 = Object.getOwnPropertyDescriptor;
var s = Object.getOwnPropertyNames;
var p = Object.getPrototypeOf;
var d = Object.prototype.hasOwnProperty;
var l = (r, n) => () => (n || r((n = { exports: {} }).exports, n), n.exports);
var h2 = (r, n, t, i) => {
  if (n && typeof n == "object" || typeof n == "function")
    for (let o of s(n))
      !d.call(r, o) && o !== t && a(r, o, { get: () => n[o], enumerable: !(i = m2(n, o)) || i.enumerable });
  return r;
};
var g = (r, n, t) => (t = r != null ? c(p(r)) : {}, h2(n || !r || !r.__esModule ? a(t, "default", { value: r, enumerable: true }) : t, r));
var f = l((e) => {
  e.endianness = function() {
    return "LE";
  };
  e.hostname = function() {
    return typeof location < "u" ? location.hostname : "";
  };
  e.loadavg = function() {
    return [];
  };
  e.uptime = function() {
    return 0;
  };
  e.freemem = function() {
    return Number.MAX_VALUE;
  };
  e.totalmem = function() {
    return Number.MAX_VALUE;
  };
  e.cpus = function() {
    return [];
  };
  e.type = function() {
    return "Browser";
  };
  e.release = function() {
    return typeof navigator < "u" ? navigator.appVersion : "";
  };
  e.networkInterfaces = e.getNetworkInterfaces = function() {
    return {};
  };
  e.arch = function() {
    return "javascript";
  };
  e.platform = function() {
    return "browser";
  };
  e.tmpdir = e.tmpDir = function() {
    return "/tmp";
  };
  e.EOL = `
`;
  e.homedir = function() {
    return "/";
  };
});
var u = g(f());
var E2 = u.default;
var { endianness: L2, hostname: k, loadavg: y2, uptime: A2, freemem: I, totalmem: N, cpus: b2, type: V, release: x, arch: M, platform: O, tmpdir: U, EOL: X, homedir: _2, networkInterfaces: j, getNetworkInterfaces: B } = u.default;

// src/audit.ts
var { join: join2, basename } = q;
var CRED_REDACT = [
  /([Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*=\s*)[^\s&"']+/g,
  /([Ss][Ee][Cc][Rr][Ee][Tt][_-]?[Kk][Ee][Yy]\s*=\s*)[^\s&"']+/g,
  /(AKIA)[0-9A-Z]{16}/g,
  /(ghp_)[a-zA-Z0-9]{36}/g,
  /(sk-)[a-zA-Z0-9]{48}/g,
  /(AIza)[0-9A-Za-z_-]{35}/g,
  /([Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\s*=\s*)[^\s&"']+/g,
  /(eyJ[a-zA-Z0-9_-]{10,})\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g
];
function redact(s2) {
  let out = s2;
  for (const pat of CRED_REDACT) {
    out = out.replace(pat, (_3, prefix) => `${prefix}[REDACTED]`);
  }
  return out;
}
function auditDir() {
  return join2(_2(), ".config", "opencode", "supercharger", "audit");
}
function todayFile() {
  const d2 = new Date().toISOString().slice(0, 10);
  return join2(auditDir(), `${d2}.jsonl`);
}
function ensureDir() {
  const dir = auditDir();
  if (!existsSync2(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
function logEvent(entry) {
  try {
    ensureDir();
    const record = {
      timestamp: new Date().toISOString(),
      tool: entry.tool,
      args_preview: redact(entry.args.slice(0, 100)),
      ...entry.blocked !== undefined ? { blocked: entry.blocked } : {},
      ...entry.reason ? { reason: entry.reason } : {}
    };
    appendFileSync(todayFile(), JSON.stringify(record) + "\n", "utf8");
  } catch {
  }
}
function rotateAudit() {
  try {
    const dir = auditDir();
    if (!existsSync2(dir))
      return;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".jsonl"))
        continue;
      const full = join2(dir, file);
      try {
        const { mtimeMs } = statSync(full);
        if (mtimeMs < cutoff)
          unlinkSync(full);
      } catch {
      }
    }
  } catch {
  }
}

// src/loop-detector.ts
function simpleHash(s2) {
  let h3 = 5381;
  for (let i = 0;i < s2.length; i++) {
    h3 = (h3 << 5) + h3 ^ s2.charCodeAt(i);
    h3 = h3 >>> 0;
  }
  return h3.toString(36);
}
var callMap = new Map;
function trackCall(tool, args) {
  const key = simpleHash(tool + JSON.stringify(args));
  const now = Date.now();
  const WINDOW_60S = 60000;
  const WINDOW_30S = 30000;
  const timestamps = (callMap.get(key) || []).filter((t) => now - t < WINDOW_60S);
  timestamps.push(now);
  callMap.set(key, timestamps);
  if (callMap.size > 500) {
    for (const [k2, ts] of callMap.entries()) {
      if (ts.every((t) => now - t >= WINDOW_60S))
        callMap.delete(k2);
    }
  }
  const recent30s = timestamps.filter((t) => now - t < WINDOW_30S);
  return recent30s.length >= 3;
}

// src/config-scan.ts
var {existsSync: existsSync3, readdirSync: readdirSync2, readFileSync} = (() => ({}));
var { join: join3 } = q;
var INJECTION_PATTERNS = [
  { pat: /ignore\s+previous\s+instructions/i, msg: "prompt injection: 'ignore previous instructions'" },
  { pat: /you\s+are\s+now\b/i, msg: "prompt injection: 'you are now'" },
  { pat: /system\s+prompt/i, msg: "prompt injection: 'system prompt'" },
  { pat: /\bdisregard\b/i, msg: "prompt injection: 'disregard'" },
  { pat: /\bjailbreak\b/i, msg: "prompt injection: 'jailbreak'" },
  { pat: /<\|im_start\|>/, msg: "prompt injection: ChatML delimiter" },
  { pat: /\[INST\]/, msg: "prompt injection: Llama instruction delimiter" },
  { pat: /<<SYS>>/, msg: "prompt injection: Llama system delimiter" },
  { pat: /aWdub3JlI/, msg: "possible base64-encoded prompt injection (ignore...)" },
  { pat: /c3lzdGVtI/, msg: "possible base64-encoded prompt injection (system...)" }
];
function scanFile(filePath) {
  const warnings = [];
  try {
    const content = readFileSync(filePath, "utf8");
    for (const { pat, msg } of INJECTION_PATTERNS) {
      if (pat.test(content)) {
        warnings.push(`${filePath}: ${msg}`);
      }
    }
  } catch {
  }
  return warnings;
}
function scanConfigFiles(projectDir) {
  const warnings = [];
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const p2 = join3(projectDir, name);
    if (existsSync3(p2))
      warnings.push(...scanFile(p2));
  }
  const opencodeDir = join3(projectDir, ".opencode");
  if (existsSync3(opencodeDir)) {
    try {
      for (const entry of readdirSync2(opencodeDir)) {
        if (entry.endsWith(".md")) {
          warnings.push(...scanFile(join3(opencodeDir, entry)));
        }
      }
    } catch {
    }
  }
  return warnings;
}

// src/index.ts
var VERSION = "1.0.0";
var supercharger = async (ctx) => {
  const projectDir = ctx.directory || process.cwd();
  console.error(`[Supercharger] v${VERSION} loaded`);
  return {
    "tool.execute.before": async (input, output) => {
      const tool = input.tool;
      const args = output.args || {};
      const cmd = args.command || "";
      const content = args.content || args.new_string || "";
      const filePath = args.filePath || "";
      if (tool === "bash" && cmd) {
        const danger = checkCommand(cmd);
        if (danger) {
          logEvent({ tool, args: cmd.slice(0, 100), blocked: true, reason: danger.reason });
          throw new Error(`[Supercharger] Blocked: ${danger.reason}`);
        }
        const git = checkGitCommand(cmd);
        if (git) {
          logEvent({ tool, args: cmd.slice(0, 100), blocked: true, reason: git.reason });
          throw new Error(`[Supercharger] Blocked: ${git.reason}`);
        }
        const pkg = checkPackageManager(cmd, projectDir);
        if (pkg) {
          logEvent({ tool, args: cmd.slice(0, 100), blocked: true, reason: pkg.reason });
          throw new Error(`[Supercharger] Blocked: ${pkg.reason}`);
        }
      }
      if ((tool === "edit" || tool === "write") && content) {
        const warnings = scanContent(content, filePath);
        for (const w of warnings) {
          console.error(`[Supercharger] Warning: ${w}`);
        }
      }
    },
    "tool.execute.after": async (input, output) => {
      const tool = input.tool;
      const args = output.args || {};
      const result = output.result || "";
      logEvent({
        tool,
        args: JSON.stringify(args).slice(0, 100)
      });
      if (result) {
        scanOutput(result);
      }
      if (trackCall(tool, args)) {
        console.error("[Supercharger] LOOP: same tool+args repeated 3x in 30s \u2014 try a different approach");
      }
    },
    event: async ({ event }) => {
      if (event.type === "session.created") {
        console.error(`[Supercharger] Session started \u2014 v${VERSION}`);
        rotateAudit();
        const warnings = scanConfigFiles(projectDir);
        for (const w of warnings) {
          console.error(`[Supercharger] CONFIG WARNING: ${w}`);
        }
      }
      if (event.type === "session.deleted") {
        console.error("[Supercharger] Session ended");
      }
    }
  };
};
var src_default = supercharger;
export {
  supercharger,
  src_default as default
};
