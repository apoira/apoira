import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MoteRuntime, formatCommand } from "../src/index.js";

test("runtime blocks commands that do not match policy", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });

  try {
    await runtime.init();
    const result = await runtime.run(process.execPath, ["-e", "console.log('nope')"]);

    assert.equal(result.status, "blocked");
    assert.match(result.stderr, /no allow/u);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("runtime injects secrets and redacts command output", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });
  const nodePattern = formatCommand(process.execPath, ["-e", "*"]);

  try {
    await runtime.init();
    await runtime.allow(nodePattern);
    await runtime.setSecret("deploy_token", "sk_live_test_secret");

    const result = await runtime.runWithSecret(
      "deploy_token",
      process.execPath,
      ["-e", "console.log(process.env.MOTE_SECRET_DEPLOY_TOKEN)"]
    );

    assert.equal(result.status, "completed");
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /\[secret:DEPLOY_TOKEN\]/u);
    assert.doesNotMatch(result.stdout, /sk_live_test_secret/u);

    const events = await runtime.replay();
    assert.equal(events.some((event) => event.type === "secret.accessed"), true);
    assert.equal(events.some((event) => event.type === "command.completed"), true);
    assert.equal(JSON.stringify(events).includes("sk_live_test_secret"), false);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("approval rules stop execution unless approved", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });
  const nodePattern = formatCommand(process.execPath, ["-e", "*"]);

  try {
    await runtime.init();
    await runtime.ask(nodePattern);

    const waiting = await runtime.run(process.execPath, ["-e", "console.log('wait')"]);
    assert.equal(waiting.status, "approval_required");
    assert.equal(typeof waiting.approvalId, "string");

    const approved = await runtime.run(process.execPath, ["-e", "console.log('go')"], { approved: true });
    assert.equal(approved.status, "completed");
    assert.match(approved.stdout, /go/u);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("approval queue can approve and run pending commands", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });
  const nodePattern = formatCommand(process.execPath, ["-e", "*"]);

  try {
    await runtime.init();
    await runtime.ask(nodePattern);

    const waiting = await runtime.run(process.execPath, ["-e", "console.log('approved queue')"]);
    assert.equal(waiting.status, "approval_required");

    const pending = await runtime.listApprovals({ status: "pending" });
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, waiting.approvalId);
    assert.equal(pending[0].command, formatCommand(process.execPath, ["-e", "console.log('approved queue')"]));

    const approved = await runtime.approveApproval(waiting.approvalId, { actor: "tester" });
    assert.equal(approved.status, "approved");
    assert.equal(approved.approvedBy, "tester");

    const { approval, result } = await runtime.runApproval(waiting.approvalId);
    assert.equal(result.status, "completed");
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /approved queue/u);
    assert.equal(approval.status, "completed");

    const events = await runtime.replay();
    assert.equal(events.some((event) => event.type === "approval.used"), true);
    assert.equal(events.some((event) => event.type === "approval.completed"), true);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("rejected approvals cannot run", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });
  const nodePattern = formatCommand(process.execPath, ["-e", "*"]);

  try {
    await runtime.init();
    await runtime.ask(nodePattern);

    const waiting = await runtime.run(process.execPath, ["-e", "console.log('no')"]);
    await runtime.rejectApproval(waiting.approvalId, { reason: "not now" });

    await assert.rejects(
      () => runtime.runApproval(waiting.approvalId),
      /must be approved/u
    );
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("runtime status exposes policy after validation", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });

  try {
    await runtime.init();
    await runtime.allow("echo *");

    const status = await runtime.status();
    assert.equal(status.policy.commands.allow.includes("echo *"), true);
    assert.equal(status.events > 0, true);
    assert.equal(status.pendingApprovals, 0);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});
