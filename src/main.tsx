import React, { useState } from "react";
import ReactDOM from "react-dom/client";
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
import "./styles.css";

type Theme = "dark" | "light";
type Status = "active" | "ready" | "in process" | "pending" | "blocked";
type Priority = "P0" | "P1" | "P2";
type Mode = "freeze" | "build" | "scale";

type Agent = {
  id: string;
  agentName: string;
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

const agents = roadmap.agents as Agent[];
const phases = roadmap.phases as Phase[];
const stack = roadmap.stack as StackItem[];
const decisions = roadmap.decisions as Decision[];

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

const priorityClasses: Record<Priority, string> = {
  P0: "tag-danger",
  P1: "tag-warning",
  P2: "tag-info",
};

const priorityTips: Record<Priority, string> = {
  P0: "Critical priority. Required for the MVP control layer or safe first launch.",
  P1: "High priority. Build after P0 foundations are stable.",
  P2: "Planned priority. Keep defined, but do not build before the core system is proven.",
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
  const [theme, setTheme] = useState<Theme>("dark");
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

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
              <h1 className="heading">{roadmap.meta.projectName}</h1>
              <p className="text-muted">{roadmap.meta.subtitle}</p>
            </div>
            <InfoTip text={roadmap.meta.currentState} align="left" />
          </div>
          <div className="toolbar">
            <Pill className="tag-success">{roadmap.meta.version}</Pill>
            <Pill className="tag-danger" tip={roadmap.meta.nextFocus}>
              <Search className="icon-tiny" />
            </Pill>
            <button className="button" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))} type="button">
              {theme === "dark" ? <Sun className="icon-small" /> : <Moon className="icon-small" />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <section className="card stats-grid">
          {roadmap.stats.map((stat) => (
            <div key={stat.label} className="stat">
              <span className="stat-value">{stat.value}</span>
              <span className="label truncate">{stat.label}</span>
              <InfoTip text={stat.detail} align="left" />
            </div>
          ))}
        </section>

        <section className="card">
          <div className="section-header">
            <div className="section-title">
              <h2 className="heading">Aims Agents</h2>
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
              <span>Agent</span>
              <span>Role</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Progress</span>
              <span />
            </div>
            {agents.map((agent) => {
              const isOpen = expandedAgents.includes(agent.id);
              return (
                <article key={agent.id} className="list-item">
                  <button className="row-button agent-row" onClick={() => toggleAgent(agent.id)} type="button">
                    <span className="agent-name">{agent.agentName}</span>
                    <span className="role-cell">
                      <span className="truncate">{agent.name}</span>
                      <InfoTip text={`${agent.compact} ${agent.purpose}`} align="left" />
                      {agent.nextFocus ? (
                        <Pill className="tag-danger tag-icon" tip={agent.statusAction}>
                          <Search className="icon-tiny" />
                        </Pill>
                      ) : null}
                    </span>
                    <Pill className={statusClasses[agent.status]} tip={agent.statusAction}>
                      {agent.status}
                    </Pill>
                    <Pill className={priorityClasses[agent.priority]} tip={priorityTips[agent.priority]}>
                      {agent.priority}
                    </Pill>
                    <span className="progress-cell">
                      <span className="count">{agent.progress}%</span>
                      <ProgressBar value={agent.progress} />
                    </span>
                    <ChevronDown className={`icon-muted ${isOpen ? "rotate" : ""}`} />
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
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="main-grid">
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                <h2 className="heading">Roadmap Phases</h2>
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
                <span>No</span>
                <span>Phase</span>
                <span>Status</span>
                <span>Progress</span>
                <span />
              </div>
              {phases.map((phase) => {
                const isOpen = expandedPhases.includes(phase.number);
                return (
                  <article key={phase.number} className="list-item">
                    <button className="row-button phase-row" onClick={() => togglePhase(phase.number)} type="button">
                      <span className="heading text-muted">{phase.number}</span>
                      <span className="truncate">{phase.title}</span>
                      <Pill className={modeClasses[phase.mode]} tip={phase.statusAction}>
                        {phase.mode}
                      </Pill>
                      <span className="progress-cell">
                        <span className="count">{phase.progress}%</span>
                        <ProgressBar value={phase.progress} />
                      </span>
                      <ChevronDown className={`icon-muted ${isOpen ? "rotate" : ""}`} />
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
          </div>

          <aside className="side-grid">
            <div className="card pad">
              <div className="detail-heading stack-heading">
                <h2 className="heading">Independent Stack</h2>
                <InfoTip text="Each stack item now carries its actual setup status. Only the current frontend layer is active today." />
              </div>
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
            </div>
          </aside>
        </section>

        <section className="card pad">
          <div className="decision-header">
            <div className="detail-heading">
              <h2 className="heading">Decisions Board</h2>
            </div>
            <InfoTip text="This is our scope-control board: suggested items are recommendations, decided items are committed scope, and pending scope items need more discussion." />
          </div>
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
        </section>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
