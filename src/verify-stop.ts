import { existsSync } from "node:fs"

interface VerifyState {
  filesModified: boolean
  testsRun: boolean
  buildRan: boolean
}

export function createVerifyOnStop(): { check: () => VerifyState; set: (key: keyof VerifyState, value: boolean) => void } {
  const state: VerifyState = {
    filesModified: false,
    testsRun: false,
    buildRan: false,
  }

  return {
    check: () => ({ ...state }),
    set: (key, value) => {
      state[key] = value
    },
  }
}

export function formatVerifyWarning(state: VerifyState): string | null {
  const warnings: string[] = []

  if (state.filesModified && !state.testsRun && !state.buildRan) {
    warnings.push("Files modified but no tests/build ran")
  }

  if (warnings.length > 0) {
    return `[Supercharger] Verification: ${warnings.join(", ")}`
  }
  return null
}