import { randomUUID } from "node:crypto";
import { approvalsPath, readJson, writeJson } from "./store.js";

const TERMINAL_STATUSES = new Set(["rejected", "completed"]);

export async function createApproval(projectRoot, request) {
  const store = await loadApprovalStore(projectRoot);
  const now = new Date().toISOString();
  const approval = {
    id: randomUUID(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...request
  };

  store.approvals.push(approval);
  await saveApprovalStore(projectRoot, store);
  return approval;
}

export async function listApprovals(projectRoot, options = {}) {
  const store = await loadApprovalStore(projectRoot);
  const approvals = [...store.approvals].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (!options.status) {
    return approvals;
  }

  return approvals.filter((approval) => approval.status === options.status);
}

export async function getApproval(projectRoot, id) {
  const store = await loadApprovalStore(projectRoot);
  const approval = store.approvals.find((item) => item.id === id);

  if (!approval) {
    throw new Error(`Approval not found: ${id}`);
  }

  return approval;
}

export async function approveApproval(projectRoot, id, options = {}) {
  return updateApproval(projectRoot, id, (approval) => {
    assertApprovalCanTransition(approval, "approved");
    approval.status = "approved";
    approval.approvedAt = new Date().toISOString();
    approval.approvedBy = options.actor ?? "local";
    approval.note = options.note ?? approval.note;
  });
}

export async function rejectApproval(projectRoot, id, options = {}) {
  return updateApproval(projectRoot, id, (approval) => {
    assertApprovalCanTransition(approval, "rejected");
    approval.status = "rejected";
    approval.rejectedAt = new Date().toISOString();
    approval.rejectedBy = options.actor ?? "local";
    approval.reason = options.reason ?? approval.reason;
  });
}

export async function completeApproval(projectRoot, id, result) {
  return updateApproval(projectRoot, id, (approval) => {
    if (approval.status !== "approved") {
      throw new Error(`Approval ${id} must be approved before it can be completed.`);
    }

    approval.status = "completed";
    approval.completedAt = new Date().toISOString();
    approval.result = {
      status: result.status,
      exitCode: result.exitCode ?? null
    };
  });
}

async function loadApprovalStore(projectRoot) {
  const store = await readJson(approvalsPath(projectRoot), { version: 1, approvals: [] });

  if (store.version !== 1 || !Array.isArray(store.approvals)) {
    throw new Error("Invalid approvals store.");
  }

  return store;
}

async function saveApprovalStore(projectRoot, store) {
  await writeJson(approvalsPath(projectRoot), store);
}

async function updateApproval(projectRoot, id, mutate) {
  const store = await loadApprovalStore(projectRoot);
  const approval = store.approvals.find((item) => item.id === id);

  if (!approval) {
    throw new Error(`Approval not found: ${id}`);
  }

  mutate(approval);
  approval.updatedAt = new Date().toISOString();
  await saveApprovalStore(projectRoot, store);
  return approval;
}

function assertApprovalCanTransition(approval, nextStatus) {
  if (TERMINAL_STATUSES.has(approval.status)) {
    throw new Error(`Approval ${approval.id} is already ${approval.status}.`);
  }

  if (approval.status === "approved" && nextStatus !== "completed") {
    throw new Error(`Approval ${approval.id} is already approved.`);
  }
}
