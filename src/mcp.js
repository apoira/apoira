const TOOLS = [
  {
    name: "mote_status",
    description: "Return project status, policy, event count, and secret count.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "mote_run",
    description: "Run a command through Mote policy.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "array", items: { type: "string" } },
        approved: { type: "boolean" }
      },
      required: ["command"],
      additionalProperties: false
    }
  },
  {
    name: "mote_allow",
    description: "Add an allow command rule.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string" }
      },
      required: ["pattern"],
      additionalProperties: false
    }
  },
  {
    name: "mote_ask",
    description: "Add an approval-required command rule.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string" }
      },
      required: ["pattern"],
      additionalProperties: false
    }
  },
  {
    name: "mote_deny_path",
    description: "Add a denied path pattern.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string" }
      },
      required: ["pattern"],
      additionalProperties: false
    }
  },
  {
    name: "mote_secret_use",
    description: "Run a command with a named secret injected into the environment.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        command: { type: "array", items: { type: "string" } },
        approved: { type: "boolean" }
      },
      required: ["name", "command"],
      additionalProperties: false
    }
  },
  {
    name: "mote_replay",
    description: "Return the append-only event log.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

export async function serveMcp(runtime, streams = {}) {
  const input = streams.input ?? process.stdin;
  const output = streams.output ?? process.stdout;

  input.setEncoding("utf8");

  let buffer = "";
  for await (const chunk of input) {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/u);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      await handleLine(runtime, output, line);
    }
  }
}

async function handleLine(runtime, output, line) {
  let request;

  try {
    request = JSON.parse(line);
    const result = await route(runtime, request);
    writeMessage(output, {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result
    });
  } catch (error) {
    writeMessage(output, {
      jsonrpc: "2.0",
      id: request?.id ?? null,
      error: {
        code: -32000,
        message: error.message
      }
    });
  }
}

async function route(runtime, request) {
  if (request.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: "mote",
        version: "0.1.0"
      }
    };
  }

  if (request.method === "tools/list") {
    return { tools: TOOLS };
  }

  if (request.method === "tools/call") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await callTool(runtime, request.params?.name, request.params?.arguments ?? {}), null, 2)
        }
      ]
    };
  }

  throw new Error(`Unsupported method: ${request.method}`);
}

async function callTool(runtime, name, args) {
  if (name === "mote_status") {
    return runtime.status();
  }

  if (name === "mote_run") {
    const [executable, ...commandArgs] = commandArray(args.command);
    return runtime.run(executable, commandArgs, { approved: Boolean(args.approved) });
  }

  if (name === "mote_allow") {
    await runtime.allow(requiredString(args.pattern, "pattern"));
    return { ok: true };
  }

  if (name === "mote_ask") {
    await runtime.ask(requiredString(args.pattern, "pattern"));
    return { ok: true };
  }

  if (name === "mote_deny_path") {
    await runtime.denyPath(requiredString(args.pattern, "pattern"));
    return { ok: true };
  }

  if (name === "mote_secret_use") {
    const [executable, ...commandArgs] = commandArray(args.command);
    return runtime.runWithSecret(requiredString(args.name, "name"), executable, commandArgs, {
      approved: Boolean(args.approved)
    });
  }

  if (name === "mote_replay") {
    return runtime.replay();
  }

  throw new Error(`Unknown tool: ${name}`);
}

function writeMessage(output, message) {
  output.write(`${JSON.stringify(message)}\n`);
}

function commandArray(value) {
  if (!Array.isArray(value) || value.length === 0 || !value.every((part) => typeof part === "string")) {
    throw new Error("command must be a non-empty string array");
  }

  return value;
}

function requiredString(value, key) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required`);
  }

  return value;
}
