import { test, expect } from "bun:test"
import { trackCall } from "../src/loop-detector"

// Each test needs fresh state — use unique tool names to isolate
test("2 identical calls do not trigger", () => {
  const tool = "loop-test-2calls"
  const args = { cmd: "unique-2calls" }
  trackCall(tool, args)
  expect(trackCall(tool, args)).toBe(false)
})

test("3 identical calls trigger", () => {
  const tool = "loop-test-3calls"
  const args = { cmd: "unique-3calls" }
  trackCall(tool, args)
  trackCall(tool, args)
  expect(trackCall(tool, args)).toBe(true)
})

test("different calls do not trigger", () => {
  const tool = "loop-test-diff"
  expect(trackCall(tool, { cmd: "alpha" })).toBe(false)
  expect(trackCall(tool, { cmd: "beta" })).toBe(false)
  expect(trackCall(tool, { cmd: "gamma" })).toBe(false)
})
