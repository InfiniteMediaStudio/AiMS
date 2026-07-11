import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { persistManagerRun } from "./manager-storage.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..");
const ROADMAP_PATH = resolve(ROOT, "src", "roadmap.json");

const ROUTES = [
  { agent: "Google", keywords: ["seo", "google", "ads", "keyword", "search console", "ga4"] },
  { agent: "Social", keywords: ["post", "content", "social", "caption", "instagram", "facebook", "linkedin"] },
  { agent: "Sales", keywords: ["lead", "proposal", "outreach", "sales", "crm", "pipeline"] },
  { agent: "Develop", keywords: ["code", "website", "app", "deploy", "bug", "github"] },
  { agent: "Design", keywords: ["design", "brand", "logo", "figma", "ui", "creative"] },
  { agent: "Video", keywords: ["video", "reel", "script", "storyboard", "edit"] },
  { agent: "Support", keywords: ["client", "support", "follow-up", "meeting", "summary"] },
  { agent: "QA", keywords: ["review", "check", "audit", "quality", "approve"] },
  { agent: "Accounts", keywords: ["invoice", "payment", "retainer", "subscription", "finance"] },
];

const APPROVAL_RULES = [
  { match: ["send", "email", "client"], reason: "Client-facing messages require human approval." },
  { match: ["publish", "post"], reason: "Publishing content requires human approval." },
  { match: ["budget", "ads", "spend"], reason: "Ad budget changes require owner approval." },
  { match: ["deploy", "production"], reason: "Production deploys require technical and business approval." },
  { match: ["edit", "production", "data"], reason: "Production client data edits require owner approval." },
];

export async function loadRoadmap() {
  const raw = await readFile(ROADMAP_PATH, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

export function buildManagerContext(roadmap) {
  const manager = roadmap.agents.find((agent) => agent.id === "manager");

  return {
    project: roadmap.meta.projectName,
    nextFocus: roadmap.meta.nextFocus,
    managerStatus: manager?.status,
    managerProgress: manager?.progress,
    taskLifecycle: roadmap.managerControlPlane.taskLifecycle,
    approvalMatrix: roadmap.managerControlPlane.approvalMatrix,
    runLogFields: roadmap.managerControlPlane.runLogFields,
    decidedScope: roadmap.decisions.filter((decision) => decision.status === "decided").map((decision) => decision.label),
    pendingScope: roadmap.decisions.filter((decision) => decision.status !== "decided").map((decision) => decision.label),
  };
}

export function createDryRunPlan(request, roadmap) {
  const lowerRequest = request.toLowerCase();
  const words = new Set(lowerRequest.match(/[a-z0-9]+/g) ?? []);
  const route = ROUTES.find((entry) => entry.keywords.some((keyword) => matchesKeyword(keyword, lowerRequest, words))) ?? {
    agent: "Manager",
  };
  const approvalRule = APPROVAL_RULES.find((rule) => rule.match.every((word) => lowerRequest.includes(word)));
  const context = buildManagerContext(roadmap);

  return {
    mode: "dry-run",
    request,
    routedAgent: route.agent,
    taskStatus: approvalRule ? "approval_required" : "triage",
    approvalRequired: Boolean(approvalRule),
    approvalReason: approvalRule?.reason ?? "Internal planning or draft work can proceed with logging.",
    nextAction: approvalRule
      ? "Create a draft, log the approval need, and wait for owner approval before execution."
      : "Create the task, route it to the suggested agent, and log the run for review.",
    checklist: [
      "Capture request and client context.",
      `Route to ${route.agent}.`,
      approvalRule ? "Add approval gate before any external action." : "Proceed as internal draft or planning work.",
      "Write a run log entry with status, decision, and next action.",
    ],
    roadmapNextFocus: context.nextFocus,
    context,
  };
}

function matchesKeyword(keyword, lowerRequest, words) {
  return keyword.includes(" ") || keyword.includes("-") ? lowerRequest.includes(keyword) : words.has(keyword);
}

export async function runManagerAgent({ request, dryRun = false, model = process.env.OPENAI_MODEL ?? "gpt-5-mini", persist = true }) {
  const roadmap = await loadRoadmap();

  if (dryRun) {
    return withPersistence(createDryRunPlan(request, roadmap), persist);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Use dry-run mode or add it to .env.local.");
  }

  const context = buildManagerContext(roadmap);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are the AiMS Manager Agent. Route agency tasks, enforce approval gates, and return concise JSON with routedAgent, taskStatus, approvalRequired, approvalReason, nextAction, and checklist.",
        },
        {
          role: "user",
          content: JSON.stringify({ request, context }),
        },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    const message = body?.error?.message ?? `OpenAI request failed with status ${response.status}`;
    throw new Error(message);
  }

  return withPersistence({
    mode: "live",
    request,
    model,
    responseId: body.id,
    outputText: body.output_text ?? extractOutputText(body),
    usage: body.usage,
  }, persist);
}

async function withPersistence(result, persist) {
  if (!persist) return result;
  const persistence = await persistManagerRun(result);
  return { ...result, persistence };
}

function extractOutputText(body) {
  return body.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n");
}
