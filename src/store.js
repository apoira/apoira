import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { defaultPolicy } from "./policy.js";

export function moteDir(projectRoot) {
  return join(resolve(projectRoot), ".mote");
}

export function policyPath(projectRoot) {
  return join(moteDir(projectRoot), "policy.json");
}

export function eventLogPath(projectRoot) {
  return join(moteDir(projectRoot), "events.jsonl");
}

export function secretsPath(projectRoot) {
  return join(moteDir(projectRoot), "secrets.json");
}

export async function ensureProject(projectRoot) {
  await mkdir(moteDir(projectRoot), { recursive: true });

  const policyFile = policyPath(projectRoot);
  const secretsFile = secretsPath(projectRoot);
  const eventsFile = eventLogPath(projectRoot);

  await writeJsonIfMissing(policyFile, defaultPolicy());
  await writeJsonIfMissing(secretsFile, { version: 1, secrets: {} });
  await writeFileIfMissing(eventsFile, "");
}

export async function appendEvent(projectRoot, event) {
  await mkdir(dirname(eventLogPath(projectRoot)), { recursive: true });

  const entry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...event
  };

  await appendFile(eventLogPath(projectRoot), `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

export async function readEvents(projectRoot) {
  const raw = await readTextIfExists(eventLogPath(projectRoot), "");
  return raw
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" && fallback !== undefined) {
      return structuredClone(fallback);
    }
    throw error;
  }
}

export async function writeJson(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeJsonIfMissing(filePath, value) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    await writeJson(filePath, value);
  }
}

async function writeFileIfMissing(filePath, value) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    await writeFile(filePath, value, "utf8");
  }
}

async function readTextIfExists(filePath, fallback) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}
