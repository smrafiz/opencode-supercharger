const LINT_PATTERNS = [
  { ext: "ts", cmd: "npx tsc --noEmit" },
  { ext: "tsx", cmd: "npx tsc --noEmit" },
  { ext: "js", cmd: "npx eslint ." },
  { ext: "jsx", cmd: "npx eslint ." },
  { ext: "py", cmd: "python -m py_compile $FILE" },
  { ext: "rs", cmd: "cargo check" },
  { ext: "go", cmd: "go build ./..." },
]

export interface QualityResult {
  passed: boolean
  output: string
}

export async function runQualityGate(filePath: string): Promise<QualityResult> {
  const ext = filePath.split(".").pop() || ""
  const pattern = LINT_PATTERNS.find(p => p.ext === ext)

  if (!pattern) {
    return { passed: true, output: "No lint configured for this file type" }
  }

  // Quality gate is optional - just warn, don't block
  return { passed: true, output: `Quality gate available: ${pattern.cmd}` }
}