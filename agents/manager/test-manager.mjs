import assert from "node:assert/strict";
import { createDryRunPlan, loadRoadmap } from "./manager-agent.mjs";

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

console.log("manager agent tests passed");
