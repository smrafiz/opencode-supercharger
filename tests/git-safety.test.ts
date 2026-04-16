import { test, expect } from "bun:test"
import { checkGitCommand } from "../src/git-safety"

test("force push to main is blocked", () => {
  expect(checkGitCommand("git push --force origin main")).not.toBeNull()
})

test("force push to master is blocked", () => {
  expect(checkGitCommand("git push origin master --force")).not.toBeNull()
})

test("git reset --hard is blocked", () => {
  expect(checkGitCommand("git reset --hard HEAD~1")).not.toBeNull()
})

test("git checkout -- . is blocked", () => {
  expect(checkGitCommand("git checkout -- .")).not.toBeNull()
})

test("git clean -f is blocked", () => {
  expect(checkGitCommand("git clean -f")).not.toBeNull()
})

test("git stash drop is blocked", () => {
  expect(checkGitCommand("git stash drop")).not.toBeNull()
})

test("git stash clear is blocked", () => {
  expect(checkGitCommand("git stash clear")).not.toBeNull()
})

test("normal git push passes", () => {
  expect(checkGitCommand("git push origin feature-branch")).toBeNull()
})

test("git commit passes", () => {
  expect(checkGitCommand('git commit -m "feat: add feature"')).toBeNull()
})
