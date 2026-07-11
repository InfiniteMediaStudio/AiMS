import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import type { Root } from "react-dom/client";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronDown,
  CircleDot,
  ClipboardList,
  Info,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import roadmap from "./roadmap.json";
import managerRunsData from "./manager-runs.json";
import { loadRoadmapDocument } from "./lib/supabase";
import "./styles.css";

type Theme = "dark" | "light";

declare global {
  interface Window {
    __aimsRoot?: Root;
  }
}
type Status = "active" | "ready" | "in process" | "pending" | "blocked";
type Priority = "P0" | "P1" | "P2";
type Mode = "freeze" | "build" | "scale";

type Agent = {
  id: string;
  name: string;
  owner: string;
  icon: string;
  purpose: string;
  compact: string;
  tools: string[];
  requirements: string[];
  todos: string[];
  risks: string[];
  progress: number;
  status: Status;
  statusAction: string;
  priority: Priority;
  nextFocus: boolean;
};

type Phase = {
  number: string;
  title: string;
  mode: Mode;
  progress: number;
  summary: string;
  todo: string;
  statusAction: string;
  nextFocus?: boolean;
};

type StackItem = {
  name: string;
  status: Status;
  progress: number;
  next: string;
};

type Decision = {
  label: string;
  status: "pending" | "suggested" | "decided";
  detail: string;
};

type ManagerRun = {
  run_id: string;
  request: string;
  agent: string;
  status: string;
  approval_required: boolean;
  decision: string;
  next_action: string;
  timestamp: string;
  mode: string;
};

type WorkRound = {
  title: string;
  triggerModes: string[];
  steps: string[];
  lastCompleted: string;
};

type ManagerControlPlane = {
  taskLifecycle: string[];
  approvalMatrix: Array<{
    action: string;
    approval: string;
    approver: string;
  }>;
  runLogFields: string[];
};

type RoadmapData = typeof roadmap;

const managerRuns = managerRunsData as ManagerRun[];

function averageProgress(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

const statusClasses: Record<Status, string> = {
  active: "tag-success",
  ready: "tag-info",
  "in process": "tag-warning",
  pending: "tag-muted",
  blocked: "tag-danger",
};

const modeClasses: Record<Mode, string> = {
  freeze: "tag-danger",
  build: "tag-warning",
  scale: "tag-success",
};

const decisionClasses: Record<Decision["status"], string> = {
  pending: "tag-muted",
  suggested: "tag-info",
  decided: "tag-success",
};

const decisionGroups: Array<{
  status: Decision["status"];
  title: string;
  note: string;
}> = [
  {
    status: "suggested",
    title: "Suggested",
    note: "My recommended direction. Needs your approval before it becomes project scope.",
  },
  {
    status: "decided",
    title: "Decided",
    note: "Approved direction. These items become part of the working scope.",
  },
  {
    status: "pending",
    title: "Pending Scope",
    note: "Open discussion. These items are not committed scope yet.",
  },
];

function InfoTip({ text, align = "right" }: { text: string; align?: "left" | "right" }) {
  return (
    <span className="tip-wrap group">
      <Info className="icon-muted" />
      <span className={`tooltip ${align === "left" ? "tooltip-left" : "tooltip-right"}`}>{text}</span>
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function Pill({
  children,
  className = "",
  tip,
}: {
  children: React.ReactNode;
  className?: string;
  tip?: string;
}) {
  return (
    <span className="tag-wrap group">
      <span className={`tag ${className}`}>{children}</span>
      {tip ? <span className="tag-tooltip">{tip}</span> : null}
    </span>
  );
}

function runStatusClass(status: string) {
  if (["done", "logged", "triage"].includes(status)) return "tag-success";
  if (status === "approval_required") return "tag-warning";
  if (status === "blocked") return "tag-danger";
  return "tag-info";
}

function formatRunTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button aria-label={label} className="icon-button" onClick={onClick} type="button">
      {children}
    </button>
  );
}

function App() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData>(roadmap);
  const [theme, setTheme] = useState<Theme>("dark");
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [stackOpen, setStackOpen] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(false);
  const [managerRunsOpen, setManagerRunsOpen] = useState(false);
  const [workRoundOpen, setWorkRoundOpen] = useState(false);

  const agents = roadmapData.agents as Agent[];
  const phases = roadmapData.phases as Phase[];
  const stack = roadmapData.stack as StackItem[];
  const decisions = roadmapData.decisions as Decision[];
  const workRound = roadmapData.workRound as WorkRound;
  const managerControlPlane = roadmapData.managerControlPlane as ManagerControlPlane;
  const agentCompletion = averageProgress(agents.map((agent) => agent.progress));
  const phaseCompletion = averageProgress(phases.map((phase) => phase.progress));
  const stackCompletion = averageProgress(stack.map((item) => item.progress));

  useEffect(() => {
    let active = true;

    loadRoadmapDocument<RoadmapData>("aims-roadmap").then((hostedRoadmap) => {
      if (active && hostedRoadmap) setRoadmapData(hostedRoadmap);
    });

    return () => {
      active = false;
    };
  }, []);

  const allAgentsOpen = expandedAgents.length === agents.length;
  const allPhasesOpen = expandedPhases.length === phases.length;

  const toggleAgent = (id: string) => {
    setExpandedAgents((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const togglePhase = (number: string) => {
    setExpandedPhases((current) => (current.includes(number) ? current.filter((item) => item !== number) : [...current, number]));
  };

  return (
    <main data-theme={theme} className="app-shell">
      <div className="page">
        <header className="card header-card">
          <div className="title-group">
            <span className="brand-mark">
              <Sparkles className="icon" />
            </span>
            <div>
              <h1 className="heading">{roadmapData.meta.projectName}</h1>
              <p className="text-muted">{roadmapData.meta.subtitle}</p>
            </div>
            <InfoTip text={roadmapData.meta.currentState} align="left" />
          </div>
          <div className="toolbar">
            <button
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="icon-button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              type="button"
            >
              {theme === "dark" ? <Sun className="icon-small" /> : <Moon className="icon-small" />}
            </button>
          </div>
        </header>

        <section className="card stats-grid">
          {roadmapData.stats.map((stat) => (
            <div key={stat.label} className="stat">
              <span className="stat-label">
                <span className="label truncate">{stat.label}</span>
                <InfoTip text={stat.detail} align="left" />
              </span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="section-header">
            <div className="section-title">
              <h2 className="heading">Aims Agents</h2>
              <Pill className="tag-info">{agentCompletion}% total</Pill>
            </div>
            <div className="toolbar">
              <InfoTip text="Each row keeps one-line operational data. The agent info icon carries the extra tagline and context. Status tags show my suggested next action on hover." />
              <IconButton
                label={allAgentsOpen ? "Collapse all agents" : "Expand all agents"}
                onClick={() => setExpandedAgents(allAgentsOpen ? [] : agents.map((agent) => agent.id))}
              >
                {allAgentsOpen ? <ChevronsDownUp className="icon-small" /> : <ChevronsUpDown className="icon-small" />}
              </IconButton>
            </div>
          </div>

          <div className="list">
            <div className="table-head agent-head">
              <span>Role</span>
              <span>Status</span>
              <span>Count</span>
              <span />
            </div>
            {agents.map((agent, index) => {
              const isOpen = expandedAgents.includes(agent.id);
              return (
                <article key={agent.id} className="list-item">
                  <button className="row-button agent-row" onClick={() => toggleAgent(agent.id)} type="button">
                    <span className="role-cell">
                      <span className="heading text-muted">{String(index + 1).padStart(2, "0")}</span>
                      <span className="truncate">{agent.name}</span>
                      <InfoTip text={`${agent.compact} ${agent.purpose}`} align="left" />
                    </span>
                    <Pill className={statusClasses[agent.status]} tip={agent.statusAction}>
                      {agent.status}
                    </Pill>
                    <span className="count">{agent.progress}%</span>
                    <ChevronDown className={`icon-muted ${isOpen ? "rotate" : ""}`} />
                    <span className="phase-progress-bar">
                      <ProgressBar value={agent.progress} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="detail-grid">
                      <div>
                        <div className="detail-heading">
                          <CircleDot className="icon-small text-mint" />
                          <h3 className="heading">Requirements</h3>
                        </div>
                        <div className="tag-list">
                          {agent.requirements.map((item) => (
                            <span key={item} className="tag tag-neutral">
                              {item}
                            </span>
                          ))}
                        </div>
                        {agent.id === "manager" ? (
                          <div className="control-panel">
                            <span className="text-muted">Lifecycle</span>
                            <div className="tag-list">
                              {managerControlPlane.taskLifecycle.map((state) => (
                                <span key={state} className="tag tag-neutral">
                                  {state}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <div className="detail-heading">
                          <ClipboardList className="icon-small text-saffron" />
                          <h3 className="heading">Todo</h3>
                        </div>
                        <ul className="stack-list">
                          {agent.todos.map((todo) => (
                            <li key={todo} className="list-line">
                              <CheckCircle2 className="icon-small text-mint" />
                              <span>{todo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="detail-heading">
                          <ShieldCheck className="icon-small text-coral" />
                          <h3 className="heading">Tools and Risks</h3>
                        </div>
                        <div className="tag-list">
                          {agent.tools.map((tool) => (
                            <span key={tool} className="tag tag-neutral">
                              {tool}
                            </span>
                          ))}
                        </div>
                        <ul className="stack-list compact">
                          {agent.risks.map((risk) => (
                            <li key={risk} className="text-muted">
                              {risk}
                            </li>
                          ))}
                        </ul>
                        {agent.id === "manager" ? (
                          <div className="control-panel">
                            <span className="text-muted">Run log</span>
                            <div className="tag-list">
                              {managerControlPlane.runLogFields.map((field) => (
                                <span key={field} className="tag tag-neutral">
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="card">
            <div className="section-header">
              <div className="section-title">
                <h2 className="heading">Roadmap Phases</h2>
                <Pill className="tag-info">{phaseCompletion}% total</Pill>
              </div>
              <div className="toolbar">
                <InfoTip text="Phases are compact by default. Hover status tags for my suggested next action, or expand rows for the working summary." />
                <IconButton
                  label={allPhasesOpen ? "Collapse all phases" : "Expand all phases"}
                  onClick={() => setExpandedPhases(allPhasesOpen ? [] : phases.map((phase) => phase.number))}
                >
                  {allPhasesOpen ? <ChevronsDownUp className="icon-small" /> : <ChevronsUpDown className="icon-small" />}
                </IconButton>
              </div>
            </div>
            <div className="list">
              <div className="table-head phase-head">
                <span>Phase</span>
                <span>Status</span>
                <span>Count</span>
                <span />
              </div>
              {phases.map((phase) => {
                const isOpen = expandedPhases.includes(phase.number);
                return (
                  <article key={phase.number} className="list-item">
                    <button className="row-button phase-row" onClick={() => togglePhase(phase.number)} type="button">
                      <span className="phase-title-cell">
                        <span className="heading text-muted">{phase.number}</span>
                        <span className="truncate">{phase.title}</span>
                        {phase.nextFocus ? (
                          <Pill className="tag-danger tag-icon" tip={phase.statusAction}>
                            <Search className="icon-tiny" />
                          </Pill>
                        ) : null}
                      </span>
                      <Pill className={modeClasses[phase.mode]} tip={phase.statusAction}>
                        {phase.mode}
                      </Pill>
                      <span className="count">{phase.progress}%</span>
                      <ChevronDown className={`icon-muted ${isOpen ? "rotate" : ""}`} />
                      <span className="phase-progress-bar">
                        <ProgressBar value={phase.progress} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="phase-detail">
                        <span>{phase.summary}</span>
                        <span className="text">{phase.todo}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
        </section>

        <section className="card pad">
              <div className="collapse-heading stack-heading">
                <div className="detail-heading">
                  <h2 className="heading">Independent Stack</h2>
                  <Pill className="tag-info">{stackCompletion}% total</Pill>
                  <InfoTip text="Each stack item now carries its actual setup status. Only the current frontend layer is active today." />
                </div>
                <IconButton label={stackOpen ? "Collapse Independent Stack" : "Expand Independent Stack"} onClick={() => setStackOpen((open) => !open)}>
                  <ChevronDown className={`icon-small ${stackOpen ? "rotate" : ""}`} />
                </IconButton>
              </div>
              {stackOpen ? (
                <div className="stack-list">
                  {stack.map((item) => (
                    <div key={item.name} className="stack-row">
                      <span className="truncate">{item.name}</span>
                      <Pill className={statusClasses[item.status]} tip={item.next}>
                        {item.status}
                      </Pill>
                      <span className="count">{item.progress}%</span>
                    </div>
                  ))}
                </div>
              ) : null}
        </section>

        <section className="card pad">
          <div className="collapse-heading stack-heading">
            <div className="detail-heading">
              <h2 className="heading">Decisions Board</h2>
              <InfoTip text="This is our scope-control board: suggested items are recommendations, decided items are committed scope, and pending scope items need more discussion." />
            </div>
            <IconButton label={decisionsOpen ? "Collapse Decisions Board" : "Expand Decisions Board"} onClick={() => setDecisionsOpen((open) => !open)}>
              <ChevronDown className={`icon-small ${decisionsOpen ? "rotate" : ""}`} />
            </IconButton>
          </div>
          {decisionsOpen ? (
            <div className="decision-board">
              {decisionGroups.map((group) => (
                <div key={group.status} className="decision-column">
                  <div className="decision-column-head">
                    <span>{group.title}</span>
                    <Pill className={decisionClasses[group.status]}>{decisions.filter((decision) => decision.status === group.status).length}</Pill>
                    <InfoTip text={group.note} />
                  </div>
                  <div className="decision-items">
                    {decisions
                      .filter((decision) => decision.status === group.status)
                      .map((decision) => (
                        <div key={decision.label} className="decision-item">
                          <span className="truncate">{decision.label}</span>
                          <InfoTip text={decision.detail} />
                        </div>
                      ))}
                    {decisions.filter((decision) => decision.status === group.status).length === 0 ? (
                      <div className="decision-empty">Nothing here yet.</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="card pad">
          <div className="collapse-heading stack-heading">
            <div className="detail-heading">
              <h2 className="heading">Latest Manager Runs</h2>
              <Pill className="tag-info">{managerRuns.length}</Pill>
              <InfoTip text="Latest Manager Agent runs mirrored from the persistent task and run-log store." />
            </div>
            <IconButton label={managerRunsOpen ? "Collapse Latest Manager Runs" : "Expand Latest Manager Runs"} onClick={() => setManagerRunsOpen((open) => !open)}>
              <ChevronDown className={`icon-small ${managerRunsOpen ? "rotate" : ""}`} />
            </IconButton>
          </div>
          {managerRunsOpen ? (
            <div className="run-list">
              {managerRuns.length > 0 ? (
                managerRuns.map((run) => (
                  <article key={run.run_id} className="run-row">
                    <div className="run-main">
                      <div className="run-title-line">
                        <span className="truncate">{run.request}</span>
                        <InfoTip text={run.next_action} />
                      </div>
                      <span className="text-muted truncate">{run.run_id}</span>
                    </div>
                    <Pill className="tag-neutral">{run.agent}</Pill>
                    <Pill className={runStatusClass(run.status)}>{run.status}</Pill>
                    <Pill className={run.approval_required ? "tag-warning" : "tag-success"}>
                      {run.approval_required ? "approval" : "logged"}
                    </Pill>
                    <span className="text-muted">{run.mode}</span>
                    <span className="text-muted">{formatRunTime(run.timestamp)}</span>
                  </article>
                ))
              ) : (
                <div className="run-empty">No Manager Agent runs logged yet.</div>
              )}
            </div>
          ) : null}
        </section>

        <section className="card pad">
          <div className="collapse-heading stack-heading">
            <div className="detail-heading">
              <h2 className="heading">{workRound.title}</h2>
              <InfoTip text={workRound.lastCompleted} />
            </div>
            <IconButton label={workRoundOpen ? "Collapse Codex Work Round" : "Expand Codex Work Round"} onClick={() => setWorkRoundOpen((open) => !open)}>
              <ChevronDown className={`icon-small ${workRoundOpen ? "rotate" : ""}`} />
            </IconButton>
          </div>
          {workRoundOpen ? (
            <div className="work-flow">
              <div>
                <span className="text-muted">Triggers</span>
                <ul className="stack-list compact">
                  {workRound.triggerModes.map((mode) => (
                    <li key={mode} className="text-muted">
                      {mode}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-muted">Round steps</span>
                <ol className="work-steps">
                  {workRound.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("AiMS root element was not found.");

const root = window.__aimsRoot ?? ReactDOM.createRoot(rootElement);
window.__aimsRoot = root;
root.render(<App />);
