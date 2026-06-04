#!/usr/bin/env node
import { resolve } from "node:path";
import { MoteRuntime } from "./runtime.js";
import { serveMcp } from "./mcp.js";
import { evaluateCommand, evaluatePath, formatCommand } from "./policy.js";

const { command, args, projectRoot } = parseArgs(process.argv.slice(2));
const runtime = new MoteRuntime({ projectRoot });

try {
  await dispatch(runtime, command, args);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function dispatch(runtime, command, args) {
  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "init") {
    const root = args[0] ? resolve(args[0]) : runtime.projectRoot;
    const scopedRuntime = new MoteRuntime({ projectRoot: root });
    await scopedRuntime.init();
    console.log(`Initialized Mote at ${root}`);
    return;
  }

  if (command === "status") {
    console.log(JSON.stringify(await runtime.status(), null, 2));
    return;
  }

  if (command === "check-command") {
    if (args.length === 0) {
      throw new Error("Usage: mote check-command COMMAND [ARGS...]");
    }

    const commandLine = formatCommand(args[0], args.slice(1));
    console.log(JSON.stringify({
      command: commandLine,
      decision: evaluateCommand(await runtime.loadPolicy(), commandLine)
    }, null, 2));
    return;
  }

  if (command === "check-path") {
    const targetPath = requiredPattern(args);
    console.log(JSON.stringify({
      path: targetPath,
      decision: evaluatePath(await runtime.loadPolicy(), runtime.projectRoot, targetPath)
    }, null, 2));
    return;
  }

  if (command === "allow") {
    await runtime.allow(requiredPattern(args));
    console.log("Command rule added.");
    return;
  }

  if (command === "ask") {
    await runtime.ask(requiredPattern(args));
    console.log("Approval rule added.");
    return;
  }

  if (command === "deny") {
    await runtime.denyPath(requiredPattern(args));
    console.log("Path deny rule added.");
    return;
  }

  if (command === "deny-command") {
    await runtime.denyCommand(requiredPattern(args));
    console.log("Command deny rule added.");
    return;
  }

  if (command === "secret:set") {
    const [name, ...valueParts] = args;
    if (!name || valueParts.length === 0) {
      throw new Error("Usage: mote secret:set NAME VALUE");
    }
    const normalized = await runtime.setSecret(name, valueParts.join(" "));
    console.log(`Stored secret ${normalized}.`);
    return;
  }

  if (command === "secret:list") {
    for (const name of await runtime.listSecrets()) {
      console.log(name);
    }
    return;
  }

  if (command === "secret:use") {
    const separator = args.indexOf("--");
    if (separator < 1 || separator === args.length - 1) {
      throw new Error("Usage: mote secret:use NAME -- COMMAND [ARGS...]");
    }

    const approved = removeFlag(args, "--yes");
    const name = args[0];
    const commandArgs = args.slice(separator + 1);
    await printRunResult(await runtime.runWithSecret(name, commandArgs[0], commandArgs.slice(1), { approved }));
    return;
  }

  if (command === "run") {
    if (args.length === 0) {
      throw new Error("Usage: mote run COMMAND [ARGS...]");
    }

    const approved = removeFlag(args, "--yes");
    await printRunResult(await runtime.run(args[0], args.slice(1), { approved }));
    return;
  }

  if (command === "replay") {
    for (const event of await runtime.replay()) {
      const suffix = event.command ? ` ${event.command}` : "";
      console.log(`${event.timestamp} ${event.type}${suffix}`);
    }
    return;
  }

  if (command === "serve") {
    if (!args.includes("--mcp")) {
      throw new Error("Usage: mote serve --mcp");
    }

    await runtime.init();
    await serveMcp(runtime);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseArgs(argv) {
  const args = [...argv];
  let projectRoot = process.cwd();

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--project") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--project requires a path");
      }
      projectRoot = resolve(value);
      args.splice(index, 2);
      index -= 1;
    }
  }

  return {
    command: args.shift(),
    args,
    projectRoot
  };
}

function requiredPattern(args) {
  const pattern = args.join(" ").trim();
  if (!pattern) {
    throw new Error("A rule pattern is required.");
  }
  return pattern;
}

function removeFlag(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return false;
  }
  args.splice(index, 1);
  return true;
}

async function printRunResult(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`);
  }

  if (result.status !== "completed") {
    process.exitCode = 1;
  } else {
    process.exitCode = result.exitCode ?? 0;
  }
}

function printHelp() {
  console.log(`Mote

Usage:
  mote init [dir]
  mote status [--project dir]
  mote check-command COMMAND [ARGS...] [--project dir]
  mote check-path PATH [--project dir]
  mote allow "npm test" [--project dir]
  mote ask "git push" [--project dir]
  mote deny ".env" [--project dir]
  mote deny-command "rm -rf *" [--project dir]
  mote run COMMAND [ARGS...] [--yes] [--project dir]
  mote secret:set NAME VALUE [--project dir]
  mote secret:list [--project dir]
  mote secret:use NAME -- COMMAND [ARGS...] [--yes] [--project dir]
  mote replay [--project dir]
  mote serve --mcp [--project dir]`);
}
