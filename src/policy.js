import { relative, resolve } from "node:path";

const COMMAND_RULE_KINDS = ["allow", "ask", "deny"];

export const DEFAULT_POLICY = Object.freeze({
  version: 1,
  commands: {
    allow: [
      "npm test",
      "npm run test",
      "npm run build",
      "node --test"
    ],
    ask: [
      "git push",
      "vercel deploy",
      "npm publish"
    ],
    deny: [
      "rm -rf *",
      "Remove-Item *",
      "del *"
    ]
  },
  paths: {
    deny: [
      ".env",
      ".env.*",
      ".git/**",
      ".ssh/**",
      ".mote/secrets.json",
      "node_modules/**"
    ]
  },
  network: {
    allow: [],
    deny: []
  },
  secrets: {
    redact: true
  }
});

export function defaultPolicy() {
  return structuredClone(DEFAULT_POLICY);
}

export function formatCommand(executable, args = []) {
  return [executable, ...args].map(quotePart).join(" ");
}

export function evaluateCommand(policy, commandLine) {
  const commands = policy.commands ?? {};

  const denied = firstMatch(commands.deny, commandLine);
  if (denied) {
    return {
      effect: "deny",
      matched: denied,
      reason: `matched deny command rule: ${denied}`
    };
  }

  const ask = firstMatch(commands.ask, commandLine);
  if (ask) {
    return {
      effect: "ask",
      matched: ask,
      reason: `matched approval command rule: ${ask}`
    };
  }

  const allowed = firstMatch(commands.allow, commandLine);
  if (allowed) {
    return {
      effect: "allow",
      matched: allowed,
      reason: `matched allow command rule: ${allowed}`
    };
  }

  return {
    effect: "deny",
    matched: null,
    reason: "no allow or approval rule matched"
  };
}

export function evaluatePath(policy, projectRoot, targetPath) {
  const root = resolve(projectRoot);
  const absolute = resolve(root, targetPath);
  const rel = normalizePath(relative(root, absolute));

  if (rel.startsWith("..") || rel === "") {
    return {
      effect: "deny",
      matched: null,
      reason: "path is outside project root"
    };
  }

  const denied = firstPathMatch(policy.paths?.deny, rel);
  if (denied) {
    return {
      effect: "deny",
      matched: denied,
      reason: `matched deny path rule: ${denied}`
    };
  }

  return {
    effect: "allow",
    matched: null,
    reason: "no deny path rule matched"
  };
}

export function addCommandRule(policy, kind, pattern) {
  if (!COMMAND_RULE_KINDS.includes(kind)) {
    throw new Error(`Unknown command rule kind: ${kind}`);
  }

  const next = structuredClone(policy);
  next.commands ??= {};
  next.commands[kind] ??= [];

  if (!next.commands[kind].includes(pattern)) {
    next.commands[kind].push(pattern);
  }

  return next;
}

export function addPathDeny(policy, pattern) {
  const next = structuredClone(policy);
  next.paths ??= {};
  next.paths.deny ??= [];

  if (!next.paths.deny.includes(pattern)) {
    next.paths.deny.push(pattern);
  }

  return next;
}

export function validatePolicy(policy) {
  const issues = [];

  if (!policy || typeof policy !== "object") {
    return ["policy must be an object"];
  }

  if (policy.version !== 1) {
    issues.push("policy.version must be 1");
  }

  for (const kind of COMMAND_RULE_KINDS) {
    validateStringArray(policy.commands?.[kind], `commands.${kind}`, issues);
  }

  validateStringArray(policy.paths?.deny, "paths.deny", issues);
  validateStringArray(policy.network?.allow, "network.allow", issues);
  validateStringArray(policy.network?.deny, "network.deny", issues);

  if (typeof policy.secrets?.redact !== "boolean") {
    issues.push("secrets.redact must be a boolean");
  }

  return issues;
}

export function assertValidPolicy(policy) {
  const issues = validatePolicy(policy);

  if (issues.length > 0) {
    throw new Error(`Invalid Mote policy: ${issues.join("; ")}`);
  }

  return policy;
}

export function matchPattern(pattern, value) {
  const exactPrefix = !pattern.includes("*");
  if (exactPrefix && (value === pattern || value.startsWith(`${pattern} `))) {
    return true;
  }

  return wildcardRegExp(pattern, false).test(value);
}

function validateStringArray(value, key, issues) {
  if (!Array.isArray(value)) {
    issues.push(`${key} must be an array`);
    return;
  }

  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      issues.push(`${key} entries must be non-empty strings`);
      return;
    }
  }
}

function firstMatch(patterns = [], value) {
  return patterns.find((pattern) => matchPattern(pattern, value)) ?? null;
}

function firstPathMatch(patterns = [], value) {
  return patterns.find((pattern) => wildcardRegExp(normalizePath(pattern), true).test(value)) ?? null;
}

function wildcardRegExp(pattern, pathMode) {
  let escaped = "";
  const value = String(pattern);

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "*") {
      if (pathMode && value[index + 1] === "*") {
        escaped += ".*";
        index += 1;
      } else {
        escaped += pathMode ? "[^/]*" : ".*";
      }
      continue;
    }

    escaped += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }

  return new RegExp(`^${escaped}$`);
}

function normalizePath(value) {
  return String(value).replace(/\\/g, "/");
}

function quotePart(part) {
  const value = String(part);
  if (value === "") {
    return "\"\"";
  }

  if (/[\s"]/u.test(value)) {
    return JSON.stringify(value);
  }

  return value;
}
