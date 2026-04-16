const JS_TS_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /\beval\s*\(/, msg: "eval() enables code injection" },
  { pat: /\.innerHTML\s*=/, msg: "innerHTML assignment is XSS-prone" },
  { pat: /dangerouslySetInnerHTML/, msg: "dangerouslySetInnerHTML is XSS-prone" },
  { pat: /document\.write\s*\(/, msg: "document.write() is XSS-prone" },
  { pat: /new\s+Function\s*\(/, msg: "new Function() enables code injection" },
]

const PYTHON_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /pickle\.loads?\s*\(/, msg: "pickle.load() unsafe deserialization" },
  { pat: /\bexec\s*\(/, msg: "exec() enables code execution" },
  { pat: /\bcompile\s*\(/, msg: "compile() enables code execution" },
  { pat: /os\.system\s*\(/, msg: "os.system() shell injection risk" },
  { pat: /subprocess\.(?:run|call|Popen).*shell\s*=\s*True/, msg: "subprocess shell=True injection risk" },
  { pat: /\b__import__\s*\(/, msg: "__import__() dynamic import risk" },
]

const SQL_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /f["']\s*(SELECT|INSERT|UPDATE|DELETE)\s/i, msg: "f-string SQL query — use parameterized queries" },
  { pat: /"(SELECT|INSERT|UPDATE|DELETE)[^"]*"\s*\+/i, msg: "string-concatenated SQL — use parameterized queries" },
  { pat: /'(SELECT|INSERT|UPDATE|DELETE)[^']*'\s*\+/i, msg: "string-concatenated SQL — use parameterized queries" },
]

const SECRET_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /password\s*=\s*["'][^"']{3,}["']/, msg: "hardcoded password" },
  { pat: /secret\s*=\s*["'][^"']{3,}["']/, msg: "hardcoded secret" },
  { pat: /api[_-]?key\s*=\s*["'][^"']{3,}["']/i, msg: "hardcoded API key" },
]

const CRYPTO_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /crypto\.createHash\s*\(\s*['"]md5['"]/, msg: "MD5 is cryptographically weak" },
  { pat: /hashlib\.md5\s*\(/, msg: "MD5 is cryptographically weak" },
]

const GITHUB_ACTIONS_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /\$\{\{\s*github\.event\./, msg: "unsanitized github.event expression — injection risk in Actions" },
]

const OBFUSCATION_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /\batob\s*\(/, msg: "atob() — potential obfuscation" },
  { pat: /\bbtoa\s*\(/, msg: "btoa() — potential obfuscation" },
  { pat: /base64_decode\s*\(/, msg: "base64_decode() — potential obfuscation" },
  { pat: /b64decode\s*\(/, msg: "b64decode() — potential obfuscation" },
]

// Zero-width characters: U+200B, U+200C, U+200D, U+FEFF, U+2060
const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\uFEFF\u2060]/

const FILE_METACHAR_RE = /[\$\(\)`;\|]|&&/

export function scanContent(content: string, filePath: string): string[] {
  const warnings: string[] = []

  for (const { pat, msg } of JS_TS_PATTERNS) {
    if (pat.test(content)) warnings.push(msg)
  }
  for (const { pat, msg } of PYTHON_PATTERNS) {
    if (pat.test(content)) warnings.push(msg)
  }
  for (const { pat, msg } of SQL_PATTERNS) {
    if (pat.test(content)) warnings.push(msg)
  }
  for (const { pat, msg } of SECRET_PATTERNS) {
    if (pat.test(content)) warnings.push(msg)
  }
  for (const { pat, msg } of CRYPTO_PATTERNS) {
    if (pat.test(content)) warnings.push(msg)
  }

  // GitHub Actions — only for yml/yaml files
  if (/\.(ya?ml)$/.test(filePath)) {
    for (const { pat, msg } of GITHUB_ACTIONS_PATTERNS) {
      if (pat.test(content)) warnings.push(msg)
    }
  }

  for (const { pat, msg } of OBFUSCATION_PATTERNS) {
    if (pat.test(content)) warnings.push(msg)
  }

  if (ZERO_WIDTH_RE.test(content)) {
    warnings.push("zero-width unicode characters detected — possible injection/obfuscation")
  }

  if (filePath && FILE_METACHAR_RE.test(filePath)) {
    warnings.push(`file path contains shell metacharacters: ${filePath}`)
  }

  return warnings
}
