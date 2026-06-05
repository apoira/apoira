import { spawn } from "node:child_process";
import { resolve } from "node:path";
import {
  addCommandRule,
  addPathDeny,
  assertValidPolicy,
  evaluateCommand,
  formatCommand
} from "./policy.js";
import {
  approveApproval,
  completeApproval,
  createApproval,
  getApproval,
  listApprovals,
  rejectApproval
} from "./approvals.js";
import {
  appendEvent,
  ensureProject,
  policyPath,
  readEvents,
  readJson,
  writeJson
} from "./store.js";
import {
  buildRedactor,
  getSecret,
  listSecrets,
  loadSecretValues,
  secretEnvName,
  setSecret
} from "./secrets.js";

export class MoteRuntime {
  constructor(options = {}) {
    this.projectRoot = resolve(options.projectRoot ?? process.cwd());
  }

  async init() {
    await ensureProject(this.projectRoot);
    await appendEvent(this.projectRoot, {
      type: "project.initialized",
      projectRoot: this.projectRoot
    });
    return this.projectRoot;
  }

  async loadPolicy() {
    await ensureProject(this.projectRoot);
    return assertValidPolicy(await readJson(policyPath(this.projectRoot)));
  }

  async savePolicy(policy, reason = "policy updated") {
    assertValidPolicy(policy);
    await writeJson(policyPath(this.projectRoot), policy);
    await appendEvent(this.projectRoot, {
      type: "policy.updated",
      reason
    });
    return policy;
  }

  async allow(pattern) {
    return this.savePolicy(addCommandRule(await this.loadPolicy(), "allow", pattern), `allowed command: ${pattern}`);
  }

  async ask(pattern) {
    return this.savePolicy(addCommandRule(await this.loadPolicy(), "ask", pattern), `approval required for command: ${pattern}`);
  }

  async denyCommand(pattern) {
    return this.savePolicy(addCommandRule(await this.loadPolicy(), "deny", pattern), `denied command: ${pattern}`);
  }

  async denyPath(pattern) {
    return this.savePolicy(addPathDeny(await this.loadPolicy(), pattern), `denied path: ${pattern}`);
  }

  async setSecret(name, value) {
    await ensureProject(this.projectRoot);
    const normalized = await setSecret(this.projectRoot, name, value);
    await appendEvent(this.projectRoot, {
      type: "secret.stored",
      name: normalized
    });
    return normalized;
  }

  async listSecrets() {
    await ensureProject(this.projectRoot);
    return listSecrets(this.projectRoot);
  }

  async listApprovals(options = {}) {
    await ensureProject(this.projectRoot);
    return listApprovals(this.projectRoot, options);
  }

  async approveApproval(id, options = {}) {
    await ensureProject(this.projectRoot);
    const approval = await approveApproval(this.projectRoot, id, options);

    await appendEvent(this.projectRoot, {
      type: "approval.granted",
      approvalId: approval.id,
      command: approval.command,
      approvedBy: approval.approvedBy
    });

    return approval;
  }

  async rejectApproval(id, options = {}) {
    await ensureProject(this.projectRoot);
    const approval = await rejectApproval(this.projectRoot, id, options);

    await appendEvent(this.projectRoot, {
      type: "approval.rejected",
      approvalId: approval.id,
      command: approval.command,
      rejectedBy: approval.rejectedBy,
      reason: approval.reason
    });

    return approval;
  }

  async runApproval(id, options = {}) {
    await ensureProject(this.projectRoot);
    const approval = await getApproval(this.projectRoot, id);

    if (approval.status !== "approved") {
      throw new Error(`Approval ${id} must be approved before it can run.`);
    }

    if (approval.type !== "command") {
      throw new Error(`Unsupported approval type: ${approval.type}`);
    }

    await appendEvent(this.projectRoot, {
      type: "approval.used",
      approvalId: approval.id,
      command: approval.command
    });

    const result = await this.run(approval.executable, approval.args, {
      ...options,
      approved: true,
      approvalId: approval.id
    });

    await completeApproval(this.projectRoot, id, result);
    await appendEvent(this.projectRoot, {
      type: "approval.completed",
      approvalId: approval.id,
      command: approval.command,
      status: result.status,
      exitCode: result.exitCode
    });

    return {
      approval: await getApproval(this.projectRoot, id),
      result
    };
  }

  async run(executable, args = [], options = {}) {
    await ensureProject(this.projectRoot);

    const commandLine = formatCommand(executable, args);
    const policy = await this.loadPolicy();
    const decision = evaluateCommand(policy, commandLine);
    const secrets = [
      ...(await loadSecretValues(this.projectRoot)),
      ...(options.extraSecrets ?? [])
    ];
    const redact = buildRedactor(secrets);

    await appendEvent(this.projectRoot, {
      type: "command.requested",
      command: commandLine,
      decision
    });

    if (decision.effect === "deny") {
      await appendEvent(this.projectRoot, {
        type: "command.blocked",
        command: commandLine,
        reason: decision.reason
      });

      return {
        status: "blocked",
        exitCode: null,
        decision,
        stdout: "",
        stderr: decision.reason
      };
    }

    if (decision.effect === "ask" && !options.approved) {
      const approval = await createApproval(this.projectRoot, {
        type: "command",
        command: commandLine,
        executable,
        args,
        matched: decision.matched,
        reason: decision.reason
      });

      await appendEvent(this.projectRoot, {
        type: "command.approval_required",
        approvalId: approval.id,
        command: commandLine,
        reason: decision.reason
      });

      return {
        status: "approval_required",
        approvalId: approval.id,
        exitCode: null,
        decision,
        stdout: "",
        stderr: `approval required: ${approval.id}`
      };
    }

    if (decision.effect === "ask" && options.approved) {
      await appendEvent(this.projectRoot, {
        type: options.approvalId ? "approval.accepted" : "approval.granted",
        approvalId: options.approvalId,
        command: commandLine,
        reason: decision.reason
      });
    }

    const result = await spawnCommand(executable, args, {
      cwd: this.projectRoot,
      env: {
        ...process.env,
        ...(options.env ?? {})
      },
      shell: options.shell ?? shouldUseShell(executable)
    });

    const stdout = redact(result.stdout);
    const stderr = redact(result.stderr);

    await appendEvent(this.projectRoot, {
      type: "command.completed",
      command: commandLine,
      exitCode: result.exitCode,
      stdout,
      stderr
    });

    return {
      status: "completed",
      exitCode: result.exitCode,
      decision,
      stdout,
      stderr
    };
  }

  async runWithSecret(name, executable, args = [], options = {}) {
    await ensureProject(this.projectRoot);

    const secret = await getSecret(this.projectRoot, name);
    await appendEvent(this.projectRoot, {
      type: "secret.accessed",
      name: secret.name,
      command: formatCommand(executable, args)
    });

    return this.run(executable, args, {
      ...options,
      env: {
        ...(options.env ?? {}),
        [secretEnvName(secret.name)]: secret.value
      },
      extraSecrets: [
        ...(options.extraSecrets ?? []),
        secret
      ]
    });
  }

  async replay() {
    await ensureProject(this.projectRoot);
    return readEvents(this.projectRoot);
  }

  async status() {
    await ensureProject(this.projectRoot);

    const [policy, events, secrets, pendingApprovals] = await Promise.all([
      this.loadPolicy(),
      this.replay(),
      this.listSecrets(),
      this.listApprovals({ status: "pending" })
    ]);

    return {
      projectRoot: this.projectRoot,
      events: events.length,
      secrets: secrets.length,
      pendingApprovals: pendingApprovals.length,
      policy
    };
  }
}

function spawnCommand(executable, args, options) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env,
      shell: options.shell,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolveResult({ exitCode, stdout, stderr });
    });
  });
}

function shouldUseShell(executable) {
  return process.platform === "win32" && /^(npm|npx|pnpm|yarn)(\.cmd)?$/iu.test(executable);
}
