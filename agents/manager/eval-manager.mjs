import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDryRunPlan, loadRoadmap } from "./manager-agent.mjs";

const evalPath = resolve(import.meta.dirname, "evals", "routing-approval.json");
const cases = JSON.parse((await readFile(evalPath, "utf8")).replace(/^\uFEFF/, ""));
const roadmap = await loadRoadmap();
const results = [];

for (const testCase of cases) {
  const plan = createDryRunPlan(testCase.request, roadmap);
  const actual = {
    routedAgent: plan.routedAgent,
    approvalRequired: plan.approvalRequired,
    taskStatus: plan.taskStatus,
  };

  try {
    assert.equal(plan.routedAgent, testCase.expectedAgent);
    assert.equal(plan.approvalRequired, testCase.approvalRequired);
    assert.equal(plan.taskStatus, testCase.taskStatus);
    results.push({ name: testCase.name, ok: true, actual });
  } catch (error) {
    results.push({ name: testCase.name, ok: false, actual, error: error.message });
  }
}

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(JSON.stringify({ ok: false, failed, results }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, total: results.length, results }, null, 2));
}