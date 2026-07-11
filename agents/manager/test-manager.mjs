import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createDryRunPlan, loadRoadmap, runManagerAgent } from "./manager-agent.mjs";

const roadmap = await loadRoadmap();

const socialPlan = createDryRunPlan("Publish a social post for a client campaign.", roadmap);
assert.equal(socialPlan.routedAgent, "Social");
assert.equal(socialPlan.approvalRequired, true);
assert.equal(socialPlan.taskStatus, "approval_required");

const internalPlan = createDryRunPlan("Create an internal weekly client report draft.", roadmap);
assert.equal(internalPlan.routedAgent, "Support");
assert.equal(internalPlan.approvalRequired, false);
assert.equal(internalPlan.taskStatus, "triage");

const approvalWordPlan = createDryRunPlan("Create a weekly client summary draft and identify approval needs.", roadmap);
assert.equal(approvalWordPlan.routedAgent, "Support");
assert.equal(approvalWordPlan.approvalRequired, false);
const evalCases = JSON.parse(await readFile(resolve(import.meta.dirname, "evals", "routing-approval.json"), "utf8"));
for (const testCase of evalCases) {
  const plan = createDryRunPlan(testCase.request, roadmap);
  assert.equal(plan.routedAgent, testCase.expectedAgent, testCase.name);
  assert.equal(plan.approvalRequired, testCase.approvalRequired, testCase.name);
  assert.equal(plan.taskStatus, testCase.taskStatus, testCase.name);
}

const tempDir = await mkdtemp(resolve(tmpdir(), "aims-manager-test-"));
const dashboardRunsPath = resolve(tempDir, "manager-runs.json");
process.env.AIMS_MANAGER_DATA_DIR = tempDir;
process.env.AIMS_MANAGER_DASHBOARD_RUNS_PATH = dashboardRunsPath;

try {
  const persistedRun = await runManagerAgent({
    request: "Publish a social post for a client campaign.",
    dryRun: true,
  });
  assert.ok(persistedRun.persistence.taskId.startsWith("task_"));
  assert.ok(persistedRun.persistence.runId.startsWith("run_"));
  assert.equal(persistedRun.persistence.taskCount, 1);
  assert.equal(persistedRun.persistence.runCount, 1);

  const tasks = JSON.parse(await readFile(resolve(tempDir, "tasks.json"), "utf8"));
  const runs = JSON.parse(await readFile(resolve(tempDir, "runs.json"), "utf8"));
  const dashboardRuns = JSON.parse(await readFile(dashboardRunsPath, "utf8"));

  assert.equal(tasks[0].agent, "Social");
  assert.equal(tasks[0].status, "approval_required");
  assert.equal(runs[0].decision, "approval_required");
  assert.equal(dashboardRuns[0].agent, "Social");
} finally {
  delete process.env.AIMS_MANAGER_DATA_DIR;
  delete process.env.AIMS_MANAGER_DASHBOARD_RUNS_PATH;
  await rm(tempDir, { recursive: true, force: true });
}

console.log("manager agent tests passed");
