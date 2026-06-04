import test from "node:test";
import assert from "node:assert/strict";
import {
  addCommandRule,
  defaultPolicy,
  evaluateCommand,
  evaluatePath
} from "../src/index.js";

test("commands default to deny unless policy allows or asks", () => {
  const policy = defaultPolicy();

  assert.equal(evaluateCommand(policy, "npm test").effect, "allow");
  assert.equal(evaluateCommand(policy, "git push").effect, "ask");
  assert.equal(evaluateCommand(policy, "python deploy.py").effect, "deny");
});

test("command deny rules win over allow rules", () => {
  let policy = defaultPolicy();
  policy = addCommandRule(policy, "allow", "rm *");

  assert.equal(evaluateCommand(policy, "rm -rf .").effect, "deny");
});

test("path policy blocks sensitive paths", () => {
  const policy = defaultPolicy();
  const root = process.cwd();

  assert.equal(evaluatePath(policy, root, ".env").effect, "deny");
  assert.equal(evaluatePath(policy, root, ".git/config").effect, "deny");
  assert.equal(evaluatePath(policy, root, "src/index.js").effect, "allow");
});
