import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const DEFAULT_DATA_DIR = resolve(ROOT, "agents", "manager", "data");
const DEFAULT_DASHBOARD_RUNS_PATH = resolve(ROOT, "src", "manager-runs.json");
const MAX_DASHBOARD_RUNS = 5;

function getPaths() {
  const dataDir = process.env.AIMS_MANAGER_DATA_DIR ? resolve(process.env.AIMS_MANAGER_DATA_DIR) : DEFAULT_DATA_DIR;
  const dashboardRunsPath = process.env.AIMS_MANAGER_DASHBOARD_RUNS_PATH
    ? resolve(process.env.AIMS_MANAGER_DASHBOARD_RUNS_PATH)
    : DEFAULT_DASHBOARD_RUNS_PATH;

  return {
    dataDir,
    tasksPath: resolve(dataDir, "tasks.json"),
    runsPath: resolve(dataDir, "runs.json"),
    dashboardRunsPath,
  };
}

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createId(prefix, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${suffix}`;
}

function normalizeResult(result) {
  const output = result.outputText ? parseOutputText(result.outputText) : {};
  const routedAgent = result.routedAgent ?? output.routedAgent ?? "Manager";
  const taskStatus = result.taskStatus ?? output.taskStatus ?? (result.mode === "live" ? "done" : "triage");
  const approvalRequired = Boolean(result.approvalRequired ?? output.approvalRequired ?? false);
  const nextAction = result.nextAction ?? output.nextAction ?? "Review the run output and decide the next task action.";

  return {
    routedAgent,
    taskStatus,
    approvalRequired,
    approvalReason: result.approvalReason ?? output.approvalReason ?? "No approval reason returned.",
    nextAction,
  };
}

function parseOutputText(outputText) {
  try {
    return JSON.parse(outputText);
  } catch {
    return {};
  }
}

export async function loadManagerStore() {
  const paths = getPaths();
  const [tasks, runs] = await Promise.all([readJson(paths.tasksPath, []), readJson(paths.runsPath, [])]);
  return { tasks, runs, paths };
}

export async function persistManagerRun(result) {
  const paths = getPaths();
  const now = new Date().toISOString();
  const normalized = normalizeResult(result);
  const store = await loadManagerStore();
  const taskId = createId("task");
  const runId = createId("run");

  const task = {
    task_id: taskId,
    request: result.request,
    agent: normalized.routedAgent,
    status: normalized.taskStatus,
    approval_required: normalized.approvalRequired,
    next_action: normalized.nextAction,
    created_at: now,
    updated_at: now,
    latest_run_id: runId,
  };

  const run = {
    run_id: runId,
    task_id: taskId,
    request: result.request,
    agent: normalized.routedAgent,
    status: normalized.taskStatus,
    tools_used: result.mode === "live" ? ["OpenAI Responses API"] : ["Dry-run router", "Approval rules"],
    approval_required: normalized.approvalRequired,
    decision: normalized.approvalRequired ? "approval_required" : "logged",
    output_link: null,
    next_action: normalized.nextAction,
    timestamp: now,
    mode: result.mode,
  };

  const tasks = [task, ...store.tasks];
  const runs = [run, ...store.runs];

  await Promise.all([writeJson(paths.tasksPath, tasks), writeJson(paths.runsPath, runs), writeDashboardRuns(paths.dashboardRunsPath, runs)]);

  return {
    taskId,
    runId,
    taskCount: tasks.length,
    runCount: runs.length,
  };
}

async function writeDashboardRuns(path, runs) {
  const latestRuns = runs.slice(0, MAX_DASHBOARD_RUNS).map((run) => ({
    run_id: run.run_id,
    request: run.request,
    agent: run.agent,
    status: run.status,
    approval_required: run.approval_required,
    decision: run.decision,
    next_action: run.next_action,
    timestamp: run.timestamp,
    mode: run.mode,
  }));

  await writeJson(path, latestRuns);
}
