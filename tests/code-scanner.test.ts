import { test, expect } from "bun:test"
import { scanContent } from "../src/code-scanner"

test("eval() is warned", () => {
  expect(scanContent("eval(userInput)", "app.ts").length).toBeGreaterThan(0)
})

test("innerHTML is warned", () => {
  expect(scanContent("el.innerHTML = data", "app.ts").length).toBeGreaterThan(0)
})

test("pickle.load is warned", () => {
  expect(scanContent("pickle.loads(data)", "app.py").length).toBeGreaterThan(0)
})

test("hardcoded password is warned", () => {
  expect(scanContent('password = "hunter2"', "config.py").length).toBeGreaterThan(0)
})

test("f-string SQL is warned", () => {
  expect(scanContent('query = f"SELECT * FROM users WHERE id = {uid}"', "db.py").length).toBeGreaterThan(0)
})

test("normal code passes", () => {
  expect(scanContent("const x = 1 + 2\nconsole.log(x)", "utils.ts")).toEqual([])
})
