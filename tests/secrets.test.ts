import { test, expect } from "bun:test"
import { scanOutput } from "../src/secrets"

test("AWS key detected", () => {
  expect(scanOutput("AKIAIOSFODNN7EXAMPLE1234")).toBe(true)
})

test("GitHub token detected", () => {
  expect(scanOutput("ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789012")).toBe(true)
})

test("JWT detected", () => {
  const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
  expect(scanOutput(jwt)).toBe(true)
})

test("normal output passes", () => {
  expect(scanOutput("Build succeeded. 42 tests passed.")).toBe(false)
})
