import { readJson, secretsPath, writeJson } from "./store.js";

export function normalizeSecretName(name) {
  const normalized = String(name).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!normalized) {
    throw new Error("Secret name cannot be empty.");
  }
  return normalized;
}

export function secretEnvName(name) {
  return `MOTE_SECRET_${normalizeSecretName(name)}`;
}

export function encodeSecretValue(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

export function decodeSecretValue(value) {
  return Buffer.from(String(value), "base64").toString("utf8");
}

export async function loadSecretStore(projectRoot) {
  return readJson(secretsPath(projectRoot), { version: 1, secrets: {} });
}

export async function saveSecretStore(projectRoot, store) {
  await writeJson(secretsPath(projectRoot), store);
}

export async function setSecret(projectRoot, name, value) {
  const normalized = normalizeSecretName(name);
  const store = await loadSecretStore(projectRoot);

  store.secrets[normalized] = {
    value: encodeSecretValue(value),
    updatedAt: new Date().toISOString()
  };

  await saveSecretStore(projectRoot, store);
  return normalized;
}

export async function getSecret(projectRoot, name) {
  const normalized = normalizeSecretName(name);
  const store = await loadSecretStore(projectRoot);
  const entry = store.secrets[normalized];

  if (!entry) {
    throw new Error(`Secret not found: ${normalized}`);
  }

  return {
    name: normalized,
    value: decodeSecretValue(entry.value)
  };
}

export async function listSecrets(projectRoot) {
  const store = await loadSecretStore(projectRoot);
  return Object.keys(store.secrets).sort();
}

export async function loadSecretValues(projectRoot) {
  const store = await loadSecretStore(projectRoot);
  return Object.entries(store.secrets).map(([name, entry]) => ({
    name,
    value: decodeSecretValue(entry.value)
  }));
}

export function buildRedactor(secrets = []) {
  const values = secrets
    .filter((secret) => secret.value)
    .sort((a, b) => b.value.length - a.value.length);

  return (input) => {
    let output = String(input ?? "");

    for (const secret of values) {
      output = output.split(secret.value).join(`[secret:${secret.name}]`);
    }

    return output;
  };
}
