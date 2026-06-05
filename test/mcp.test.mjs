import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";
import { MoteRuntime, formatCommand, serveMcp } from "../src/index.js";

test("mcp adapter exposes pending approvals without granting them", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "mote-test-"));
  const runtime = new MoteRuntime({ projectRoot });
  const nodePattern = formatCommand(process.execPath, ["-e", "*"]);

  try {
    await runtime.init();
    await runtime.ask(nodePattern);
    const waiting = await runtime.run(process.execPath, ["-e", "console.log('needs approval')"]);

    const messages = [
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "mote_approvals",
          arguments: {}
        }
      }
    ];

    const output = await collectMcpOutput(runtime, messages);
    const listResult = output.find((message) => message.id === 1);
    const callResult = output.find((message) => message.id === 2);
    const toolNames = listResult.result.tools.map((tool) => tool.name);
    const approvals = JSON.parse(callResult.result.content[0].text);

    assert.equal(toolNames.includes("mote_approvals"), true);
    assert.equal(approvals.length, 1);
    assert.equal(approvals[0].id, waiting.approvalId);
    assert.equal(approvals[0].status, "pending");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

async function collectMcpOutput(runtime, messages) {
  let raw = "";
  const input = Readable.from(messages.map((message) => `${JSON.stringify(message)}\n`));
  const output = new Writable({
    write(chunk, _encoding, callback) {
      raw += chunk.toString();
      callback();
    }
  });

  await serveMcp(runtime, { input, output });

  return raw
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
