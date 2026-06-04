import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const blockedPatterns = [
  { label: "legacy project name", regex: new RegExp(`${"civi"}${"tas"}`, "iu") },
  { label: "legacy org handle", regex: new RegExp(`${"getcivi"}${"tas"}`, "iu") },
  { label: "legacy repo name", regex: /\bnex\b/iu }
];

const ignoredDirectories = new Set([
  ".git",
  ".mote",
  "node_modules"
]);

const ignoredFiles = new Set([
  "package-lock.json"
]);

const findings = [];

for await (const filePath of walk(root)) {
  const rel = normalize(relative(root, filePath));

  if (ignoredFiles.has(rel)) {
    continue;
  }

  const content = await readText(filePath);
  if (content === null) {
    continue;
  }

  for (const pattern of blockedPatterns) {
    const match = content.match(pattern.regex);
    if (match) {
      findings.push(`${rel}: found ${pattern.label}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Repository residue check failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log("Repository residue check passed.");
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function readText(filePath) {
  try {
    const buffer = await readFile(filePath);
    if (buffer.includes(0)) {
      return null;
    }
    return buffer.toString("utf8");
  } catch {
    return null;
  }
}

function normalize(value) {
  return value.replace(/\\/g, "/");
}
