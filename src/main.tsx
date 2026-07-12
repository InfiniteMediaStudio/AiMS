import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import type { Root } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronDown,
  CircleDot,
  ClipboardList,
  CloudUpload,
  Info,
  LogIn,
  LogOut,
  Mic,
  Moon,
  Search,
  Send,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import {
  getRoadmapSession,
  createOnlineManagerRun,
  createRealtimeClientSecret,
  loadRoadmapDocument,
  loadOnlineManagerRuns,
  saveRoadmapDocument,
  signInRoadmapOwner,
  signOutRoadmapOwner,
  subscribeToRoadmapSession,
} from "./lib/supabase";
import "./styles.css";

type Theme = "dark" | "light";

type RealtimeEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

type VoiceSession = {
  peer: RTCPeerConnection;
  channel: RTCDataChannel;
  stream: MediaStream;
  audio: HTMLAudioElement;
  transcript: string;
  finishTimer?: number;
};

const consequentialCommand = /\b(send|publish|post|deploy|delete|remove|approve|schedule|email|message|pay|purchase|buy|change\s+(?:the\s+)?(?:budget|price)|edit\s+production)\b/i;

declare global {
  interface Window {
    __aimsRoot?: Root;
  }
}
type Status = "active" | "ready" | "in process" | "pending" | "blocked";
type Priority = "P0" | "P1" | "P2";

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
  status: Status;
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
  nextFocus?: boolean;
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
  sectionProgress: Record<"roles" | "authority" | "capabilities" | "tasks" | "priorities" | "guardrails" | "activity", number>;
};

type RoadmapData = {
  meta: { projectName: string; subtitle: string; version: string; currentState: string; nextFocus: string };
  stats: Array<{ label: string; value: string; detail: string }>;
  agents: Agent[];
  phases: Phase[];
  stack: StackItem[];
  decisions: Decision[];
  workRound: WorkRound;
  managerControlPlane: ManagerControlPlane;
};

const emptyRoadmap: RoadmapData = {
  meta: { projectName: "AiM", subtitle: "Roadmap", version: "", currentState: "", nextFocus: "" },
  stats: [], agents: [], phases: [], stack: [], decisions: [],
  workRound: { title: "Instructions", triggerModes: [], steps: [], lastCompleted: "" },
  managerControlPlane: { taskLifecycle: [], approvalMatrix: [], runLogFields: [], sectionProgress: { roles: 80, authority: 100, capabilities: 55, tasks: 75, priorities: 35, guardrails: 70, activity: 65 } },
};

function normalizeRoadmap(document: RoadmapData): RoadmapData {
  return {
    ...document,
    meta: { ...document.meta, projectName: "AiM" },
    phases: document.phases.map((phase) => {
      if (phase.number === "08") return { ...phase, progress: 100, status: "ready", nextFocus: false };
      if (phase.number === "09") return { ...phase, progress: 40, status: "active", nextFocus: true };
      return { ...phase, status: phase.status ?? (phase.nextFocus ? "active" : phase.progress === 100 ? "ready" : phase.progress > 0 ? "in process" : "pending") };
    }),
    workRound: { ...document.workRound, title: "Instructions" },
    managerControlPlane: {
      ...document.managerControlPlane,
      sectionProgress: { ...emptyRoadmap.managerControlPlane.sectionProgress, ...document.managerControlPlane?.sectionProgress },
    },
  };
}

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

function ManagerSection({
  title,
  subtitle,
  progress,
  open,
  onToggle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  progress: number;
  open: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`manager-panel ${className}`}>
      <button aria-expanded={open} className="manager-panel-toggle" onClick={onToggle} type="button">
        <span className="manager-panel-copy"><strong>{title}</strong><span>{subtitle}</span></span>
        <Pill className="tag-info">{progress}%</Pill>
        <ChevronDown className={`icon-muted ${open ? "rotate" : ""}`} />
      </button>
      {open ? <div className="manager-panel-body">{children}</div> : null}
    </section>
  );
}

function App() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData>(emptyRoadmap);
  const [roadmapLoaded, setRoadmapLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [expandedAgents, setExpandedAgents] = useState<string[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [stackOpen, setStackOpen] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(false);
  const [workRoundOpen, setWorkRoundOpen] = useState(false);
  const [managerSectionsOpen, setManagerSectionsOpen] = useState<string[]>([]);
  const [hostedVersion, setHostedVersion] = useState<number | null>(null);
  const [ownerSession, setOwnerSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerMessage, setOwnerMessage] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [managerRuns, setManagerRuns] = useState<ManagerRun[]>([]);
  const [managerRequest, setManagerRequest] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const voiceSessionRef = useRef<VoiceSession | null>(null);
  const voiceStopRequestedRef = useRef(false);

  const agents = roadmapData.agents as Agent[];
  const phases = roadmapData.phases as Phase[];
  const stack = roadmapData.stack as StackItem[];
  const decisions = roadmapData.decisions as Decision[];
  const workRound = roadmapData.workRound as WorkRound;
  const managerControlPlane: ManagerControlPlane = {
    ...emptyRoadmap.managerControlPlane,
    ...roadmapData.managerControlPlane,
    sectionProgress: {
      ...emptyRoadmap.managerControlPlane.sectionProgress,
      ...roadmapData.managerControlPlane?.sectionProgress,
    },
  };
  const agentCompletion = averageProgress(agents.map((agent) => agent.progress));
  const phaseCompletion = averageProgress(phases.map((phase) => phase.progress));
  const stackCompletion = averageProgress(stack.map((item) => item.progress));
  const statusMeanings: Array<{ status: Status; meaning: string }> = [
    { status: "active", meaning: "Ready and working, or currently has a task to do." },
    { status: "ready", meaning: "Ready to work, but idle or without an assigned task." },
    { status: "in process", meaning: "Being constructed, built, or prepared for work." },
    { status: "pending", meaning: "Not currently being built; waiting or on hold." },
  ];

  useEffect(() => {
    if (!ownerSession) return;
    let active = true;

    setRoadmapLoaded(false);
    loadRoadmapDocument<RoadmapData>(ownerSession.access_token).then((hostedRoadmap) => {
      if (active) {
        setRoadmapData(normalizeRoadmap(hostedRoadmap.document));
        setHostedVersion(hostedRoadmap.version);
        setRoadmapLoaded(true);
      }
    }).catch((error) => {
      if (active) setOwnerMessage(error instanceof Error ? error.message : "Secure roadmap could not be loaded.");
    });

    return () => {
      active = false;
    };
  }, [ownerSession]);

  useEffect(() => {
    getRoadmapSession().then((session) => {
      setOwnerSession(session);
      setAuthChecked(true);
    });
    return subscribeToRoadmapSession((session) => {
      setOwnerSession(session);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!ownerSession) return;
    loadOnlineManagerRuns<ManagerRun>(ownerSession.access_token)
      .then(setManagerRuns)
      .catch((error) => setOwnerMessage(error instanceof Error ? error.message : "Manager runs could not be loaded."));
  }, [ownerSession]);

  const signInOwner = async (event: React.FormEvent) => {
    event.preventDefault();
    setOwnerBusy(true);
    setOwnerMessage("");
    try {
      await signInRoadmapOwner(ownerEmail.trim(), ownerPassword);
      setOwnerPassword("");
      setOwnerMessage("Admin sign-in successful.");
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : "Sign-in link could not be sent.");
    } finally {
      setOwnerBusy(false);
    }
  };

  const saveRoadmapOnline = async () => {
    if (!ownerSession || hostedVersion === null) return;
    setOwnerBusy(true);
    setOwnerMessage("");
    try {
      const saved = await saveRoadmapDocument(roadmapData, hostedVersion, ownerSession.access_token);
      setHostedVersion(saved.version);
      setOwnerMessage(`Roadmap saved online as version ${saved.version}.`);
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : "Roadmap could not be saved.");
    } finally {
      setOwnerBusy(false);
    }
  };

  const runManagerDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ownerSession) return;
    if (confirmationRequired && !window.confirm("This command may cause an external or production change. Confirm that you want the Manager to route it through the normal approval workflow.")) {
      setOwnerMessage("Consequential command was not sent. Edit it or confirm when you are ready.");
      return;
    }
    setOwnerBusy(true);
    setOwnerMessage("");
    try {
      const run = await createOnlineManagerRun<ManagerRun>(managerRequest.trim(), ownerSession.access_token);
      setManagerRuns((current) => [run, ...current.filter((item) => item.run_id !== run.run_id)].slice(0, 20));
      setManagerRequest("");
      setConfirmationRequired(false);
      setOwnerMessage(`Manager routed the request to ${run.agent}; status: ${run.status}.`);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Request routed to ${run.agent}. Status ${run.status.replace(/_/g, " ")}.`));
      }
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : "Manager request could not be created.");
    } finally {
      setOwnerBusy(false);
    }
  };

  const allAgentsOpen = expandedAgents.length === agents.length;
  const allPhasesOpen = expandedPhases.length === phases.length;

  const toggleAgent = (id: string) => {
    setExpandedAgents((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const togglePhase = (number: string) => {
    setExpandedPhases((current) => (current.includes(number) ? current.filter((item) => item !== number) : [...current, number]));
  };

  const closeVoiceSession = (message?: string) => {
    const session = voiceSessionRef.current;
    if (session) {
      if (session.finishTimer) window.clearTimeout(session.finishTimer);
      session.stream.getTracks().forEach((track) => track.stop());
      session.channel.close();
      session.peer.close();
      session.audio.pause();
      session.audio.srcObject = null;
      voiceSessionRef.current = null;
    }
    setVoiceListening(false);
    if (message) setOwnerMessage(message);
  };

  const acceptVoiceTranscript = (transcript: string) => {
    const command = transcript.trim();
    if (!command) {
      closeVoiceSession("No speech was detected. Hold the button and try again, or type your command.");
      return;
    }
    setManagerRequest(command);
    const needsConfirmation = consequentialCommand.test(command);
    setConfirmationRequired(needsConfirmation);
    closeVoiceSession(needsConfirmation
      ? "Voice command transcribed. Review it carefully; explicit confirmation is required before sending."
      : "Voice command transcribed. Review it, then send when ready.");
  };

  const startVoiceCommand = async () => {
    if (!ownerSession || voiceListening) return;
    voiceStopRequestedRef.current = false;
    setManagerRequest("");
    setConfirmationRequired(false);
    setVoiceListening(true);
    setOwnerMessage("Opening a secure Realtime voice session…");

    try {
      const realtimeSecret = await createRealtimeClientSecret(ownerSession.access_token);
      if (!realtimeSecret.value) throw new Error("The Realtime API did not return a client secret.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (voiceStopRequestedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        setVoiceListening(false);
        return;
      }

      const peer = new RTCPeerConnection();
      const audio = new Audio();
      audio.autoplay = true;
      peer.ontrack = (event) => { audio.srcObject = event.streams[0]; };
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const channel = peer.createDataChannel("oai-events");
      const session: VoiceSession = { peer, channel, stream, audio, transcript: "" };
      voiceSessionRef.current = session;

      channel.onopen = () => {
        if (voiceStopRequestedRef.current) channel.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        else setOwnerMessage("Secure Realtime session connected. Listening while you hold the button.");
      };
      channel.onmessage = (message) => {
        const realtimeEvent = JSON.parse(message.data) as RealtimeEvent;
        if (realtimeEvent.type === "conversation.item.input_audio_transcription.delta" && realtimeEvent.delta) {
          session.transcript += realtimeEvent.delta;
          setManagerRequest(session.transcript.trimStart());
        }
        if (realtimeEvent.type === "conversation.item.input_audio_transcription.completed") acceptVoiceTranscript(realtimeEvent.transcript ?? session.transcript);
        if (realtimeEvent.type === "error") closeVoiceSession(realtimeEvent.error?.message ?? "Realtime voice transcription failed.");
      };
      channel.onerror = () => closeVoiceSession("The secure Realtime voice connection failed. Try again or type your command.");
      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(peer.connectionState)) closeVoiceSession("The Realtime voice connection was interrupted.");
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const answerResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { authorization: `Bearer ${realtimeSecret.value}`, "content-type": "application/sdp" },
        body: offer.sdp,
      });
      const answerBody = await answerResponse.text();
      if (!answerResponse.ok) {
        let detail = `OpenAI returned HTTP ${answerResponse.status}.`;
        try {
          const payload = JSON.parse(answerBody) as { error?: { message?: string } };
          if (payload.error?.message) detail = payload.error.message;
        } catch {
          // Keep the status-only message when the upstream response is not JSON.
        }
        throw new Error(`The secure Realtime WebRTC call could not be established: ${detail}`);
      }
      await peer.setRemoteDescription({ type: "answer", sdp: answerBody });
    } catch (error) {
      closeVoiceSession(error instanceof Error ? error.message : "Realtime voice session could not be created.");
    }
  };

  const stopVoiceCommand = () => {
    voiceStopRequestedRef.current = true;
    const session = voiceSessionRef.current;
    if (!session) return;
    session.stream.getAudioTracks().forEach((track) => { track.enabled = false; });
    if (session.channel.readyState === "open") session.channel.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    setOwnerMessage("Finishing the Realtime transcript…");
    session.finishTimer = window.setTimeout(() => acceptVoiceTranscript(session.transcript), 5000);
  };

  const toggleManagerSection = (section: string) => {
    setManagerSectionsOpen((current) => current.includes(section)
      ? current.filter((item) => item !== section)
      : [...current, section]);
  };

  if (!authChecked) {
    return <main data-theme={theme} className="app-shell auth-shell"><div className="auth-loading">Checking secure session…</div></main>;
  }

  if (!ownerSession) {
    return (
      <main data-theme={theme} className="app-shell auth-shell">
        <section className="auth-card card" aria-labelledby="roadmap-login-title">
          <div className="auth-brand"><span>AiM</span><Pill className="tag-info">Private</Pill></div>
          <div><h1 className="heading" id="roadmap-login-title">Sign in to the roadmap</h1><p className="text-muted">Authentication is required before any roadmap or Manager information is shown.</p></div>
          <form className="admin-login-form" onSubmit={signInOwner}>
            <label className="admin-field"><span>Email</span><input autoComplete="username" className="owner-input" onChange={(event) => setOwnerEmail(event.target.value)} required type="email" value={ownerEmail} /></label>
            <label className="admin-field"><span>Password</span><input autoComplete="current-password" className="owner-input" onChange={(event) => setOwnerPassword(event.target.value)} required type="password" value={ownerPassword} /></label>
            <button className="owner-button auth-submit" disabled={ownerBusy} type="submit"><LogIn className="icon-small" />{ownerBusy ? "Signing in…" : "Enter secure roadmap"}</button>
          </form>
          {ownerMessage ? <span className="owner-message" role="alert">{ownerMessage}</span> : null}
        </section>
      </main>
    );
  }

  if (!roadmapLoaded) {
    return <main data-theme={theme} className="app-shell auth-shell"><div className="auth-loading">Loading secure roadmap…{ownerMessage ? ` ${ownerMessage}` : ""}</div></main>;
  }

  return (
    <main data-theme={theme} className="app-shell">
      <div className="page">
        <header className="card header-card">
          <div className="title-group">
            <h1 className="heading">{roadmapData.meta.projectName} Roadmap</h1>
          </div>
          <div className="toolbar">
            <button
              aria-label={ownerSession ? "Open admin account" : "Admin login"}
              className={`icon-button ${ownerSession ? "icon-button-active" : ""}`}
              onClick={() => {
                setOwnerMessage("");
                setOwnerModalOpen(true);
              }}
              type="button"
            >
              <UserRound className="icon-small" />
            </button>
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

        <section className="card command-bar" aria-label="Owner command bar">
          <form className="command-form" onSubmit={runManagerDraft}>
            <label className="command-field">
              <span className="sr-only">Command the Manager</span>
              <textarea className="command-input" maxLength={4000} onChange={(event) => {
                setManagerRequest(event.target.value);
                setConfirmationRequired(consequentialCommand.test(event.target.value));
              }} placeholder="Write a command for your Manager…" required rows={1} value={managerRequest} />
            </label>
            <button aria-label="Send command" className="command-send" disabled={ownerBusy || voiceListening || !managerRequest.trim()} type="submit"><Send className="icon-small" /><span>{ownerBusy ? "Working…" : confirmationRequired ? "Confirm & run" : "Send"}</span></button>
            <button aria-label="Hold to talk" className={`command-talk ${voiceListening ? "command-talk-active" : ""}`} disabled={ownerBusy} onPointerDown={startVoiceCommand} onPointerLeave={stopVoiceCommand} onPointerUp={stopVoiceCommand} type="button"><Mic className="icon-small" /><span>{voiceListening ? "Listening…" : "Hold to talk"}</span></button>
          </form>
          <div className="command-meta"><span className="text-muted">Signed in as {ownerSession.user.email}</span>{ownerMessage ? <span className="owner-message" role="status">{ownerMessage}</span> : <span className="text-muted">Commands are routed through the Manager approval system.</span>}</div>
        </section>

        {ownerModalOpen ? (
          <div className="admin-modal-backdrop" role="presentation">
            <section aria-labelledby="admin-login-title" aria-modal="true" className="admin-modal card" role="dialog">
              <div className="admin-modal-header">
                <div className="owner-copy">
                  <h2 className="heading" id="admin-login-title">Admin Access</h2>
                  <span className="text-muted">
                    {ownerSession?.user.email ?? "Sign in with the admin account stored securely in Supabase Auth."}
                  </span>
                </div>
                <IconButton label="Close admin login" onClick={() => setOwnerModalOpen(false)}>
                  <X className="icon-small" />
                </IconButton>
              </div>
              {ownerSession ? (
                <>
                  <div className="owner-actions">
                    <button className="owner-button" disabled={ownerBusy || hostedVersion === null} onClick={saveRoadmapOnline} type="button">
                      <CloudUpload className="icon-small" />
                      Save online
                    </button>
                    <button
                      className="owner-button owner-button-muted"
                      disabled={ownerBusy}
                      onClick={async () => {
                        await signOutRoadmapOwner();
                        setOwnerModalOpen(false);
                      }}
                      type="button"
                    >
                      <LogOut className="icon-small" />
                      Sign out
                    </button>
                  </div>
                  <form className="admin-login-form" onSubmit={runManagerDraft}>
                    <label className="admin-field">
                      <span>Manager request</span>
                      <textarea
                        className="owner-input owner-textarea"
                        maxLength={4000}
                        onChange={(event) => {
                          setManagerRequest(event.target.value);
                          setConfirmationRequired(consequentialCommand.test(event.target.value));
                        }}
                        placeholder="Create an internal task draft…"
                        required
                        value={managerRequest}
                      />
                    </label>
                    <div className="owner-actions">
                      <button className="owner-button" disabled={ownerBusy || voiceListening || !managerRequest.trim()} type="submit">
                        <Send className="icon-small" />
                        {ownerBusy ? "Working…" : confirmationRequired ? "Confirm & run" : "Run safe draft"}
                      </button>
                      <button
                        aria-label="Hold to talk"
                        className={`owner-button owner-button-muted ${voiceListening ? "icon-button-active" : ""}`}
                        disabled={ownerBusy}
                        onPointerDown={startVoiceCommand}
                        onPointerLeave={stopVoiceCommand}
                        onPointerUp={stopVoiceCommand}
                        type="button"
                      >
                        <Mic className="icon-small" />
                        {voiceListening ? "Listening…" : "Hold to talk"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <form className="admin-login-form" onSubmit={signInOwner}>
                  <label className="admin-field">
                    <span>Email</span>
                    <input
                      autoComplete="username"
                      className="owner-input"
                      onChange={(event) => setOwnerEmail(event.target.value)}
                      required
                      type="email"
                      value={ownerEmail}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Password</span>
                    <input
                      autoComplete="current-password"
                      className="owner-input"
                      onChange={(event) => setOwnerPassword(event.target.value)}
                      required
                      type="password"
                      value={ownerPassword}
                    />
                  </label>
                  <button className="owner-button" disabled={ownerBusy} type="submit">
                    <LogIn className="icon-small" />
                    Sign in as admin
                  </button>
                </form>
              )}
              {ownerMessage ? <span className="owner-message">{ownerMessage}</span> : null}
            </section>
          </div>
        ) : null}

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
              <h2 className="heading">AiM Team</h2>
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
                      {agent.nextFocus ? (
                        <Pill className="tag-danger tag-icon" tip={agent.statusAction}><Search className="icon-tiny" /></Pill>
                      ) : null}
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
                    agent.id === "manager" ? (
                      <div className="manager-command-center">
                        <section className="manager-hero">
                          <div className="manager-identity">
                            <div>
                              <div className="manager-title-line">
                                <h3 className="heading">Team Lead Agent</h3>
                                <Pill className={statusClasses[agent.status]}>{agent.status}</Pill>
                              </div>
                              <p className="manager-purpose">{agent.purpose}</p>
                              <span className="text-muted">Authority owner: {agent.owner}</span>
                            </div>
                          </div>
                          <div className="manager-metrics">
                            <div><strong>{agent.progress}%</strong><span>Operational readiness</span></div>
                            <div><strong>{agent.tools.length}</strong><span>Action capabilities</span></div>
                            <div><strong>{managerControlPlane.approvalMatrix.length}</strong><span>Authority rules</span></div>
                            <div><strong>{managerRuns.length}</strong><span>Recorded activities</span></div>
                          </div>
                        </section>

                        <div className="manager-grid">
                          <ManagerSection title="Role & responsibilities" subtitle="What the Team Lead owns" progress={managerControlPlane.sectionProgress.roles} open={managerSectionsOpen.includes("roles")} onToggle={() => toggleManagerSection("roles")}>
                            <ul className="manager-list">
                              {agent.requirements.map((item) => <li key={item}><CheckCircle2 className="icon-small text-mint" /><span>{item}</span></li>)}
                            </ul>
                          </ManagerSection>

                          <ManagerSection className="manager-panel-wide" title="Authority & approval boundaries" subtitle="Independent actions and human approval limits" progress={managerControlPlane.sectionProgress.authority} open={managerSectionsOpen.includes("authority")} onToggle={() => toggleManagerSection("authority")}>
                            <div className="authority-table">
                              <div className="authority-head"><span>Action</span><span>Authority</span><span>Approver</span></div>
                              {managerControlPlane.approvalMatrix.map((rule) => (
                                <div key={rule.action} className="authority-row">
                                  <span>{rule.action}</span>
                                  <Pill className={rule.approval === "Required" ? "tag-warning" : "tag-success"}>{rule.approval}</Pill>
                                  <span className="text-muted">{rule.approver}</span>
                                </div>
                              ))}
                            </div>
                          </ManagerSection>

                          <ManagerSection title="Action capabilities" subtitle="Systems the Manager can coordinate" progress={managerControlPlane.sectionProgress.capabilities} open={managerSectionsOpen.includes("capabilities")} onToggle={() => toggleManagerSection("capabilities")}>
                            <div className="capability-grid">
                              {agent.tools.map((tool) => <div key={tool} className="capability-item"><CheckCircle2 className="icon-small text-mint" /><span>{tool}</span></div>)}
                            </div>
                          </ManagerSection>

                          <ManagerSection className="manager-panel-full" title="Task management flow" subtitle="Controlled stages for every task" progress={managerControlPlane.sectionProgress.tasks} open={managerSectionsOpen.includes("tasks")} onToggle={() => toggleManagerSection("tasks")}>
                            <ol className="lifecycle-flow">
                              {managerControlPlane.taskLifecycle.map((state, stateIndex) => <li key={state}><span>{String(stateIndex + 1).padStart(2, "0")}</span><strong>{state.replace(/_/g, " ")}</strong></li>)}
                            </ol>
                          </ManagerSection>

                          <ManagerSection title="Current priorities" subtitle="Work that should happen next" progress={managerControlPlane.sectionProgress.priorities} open={managerSectionsOpen.includes("priorities")} onToggle={() => toggleManagerSection("priorities")}>
                            <ul className="manager-list">{agent.todos.map((todo) => <li key={todo}><CheckCircle2 className="icon-small text-mint" /><span>{todo}</span></li>)}</ul>
                          </ManagerSection>

                          <ManagerSection title="Guardrails & risks" subtitle="Conditions that limit Manager action" progress={managerControlPlane.sectionProgress.guardrails} open={managerSectionsOpen.includes("guardrails")} onToggle={() => toggleManagerSection("guardrails")}>
                            <ul className="manager-list risk-list">{agent.risks.map((risk) => <li key={risk}><ShieldCheck className="icon-small text-coral" /><span>{risk}</span></li>)}</ul>
                          </ManagerSection>

                          <ManagerSection className="manager-panel-full" title="Recent activity" subtitle={`${managerRuns.length} routed runs, decisions, and next actions`} progress={managerControlPlane.sectionProgress.activity} open={managerSectionsOpen.includes("activity")} onToggle={() => toggleManagerSection("activity")}>
                            <div className="activity-list">
                              {managerRuns.length > 0 ? managerRuns.map((run) => (
                                <article key={run.run_id} className="activity-row">
                                  <div className="activity-main"><strong>{run.request}</strong><span>{run.decision}</span><span className="text-muted">Next: {run.next_action}</span></div>
                                  <div className="activity-meta"><Pill className="tag-neutral">{run.agent}</Pill><Pill className={runStatusClass(run.status)}>{run.status}</Pill><Pill className={run.approval_required ? "tag-warning" : "tag-success"}>{run.approval_required ? "approval needed" : "no approval"}</Pill><span className="text-muted">{formatRunTime(run.timestamp)}</span></div>
                                </article>
                              )) : <div className="run-empty">No Manager activity recorded yet.</div>}
                            </div>
                          </ManagerSection>
                        </div>
                      </div>
                    ) : (
                      <div className="detail-grid">
                        <div><div className="detail-heading"><CircleDot className="icon-small text-mint" /><h3 className="heading">Requirements</h3></div><div className="tag-list">{agent.requirements.map((item) => <span key={item} className="tag tag-neutral">{item}</span>)}</div></div>
                        <div><div className="detail-heading"><ClipboardList className="icon-small text-saffron" /><h3 className="heading">Todo</h3></div><ul className="stack-list">{agent.todos.map((todo) => <li key={todo} className="list-line"><CheckCircle2 className="icon-small text-mint" /><span>{todo}</span></li>)}</ul></div>
                        <div><div className="detail-heading"><ShieldCheck className="icon-small text-coral" /><h3 className="heading">Tools and Risks</h3></div><div className="tag-list">{agent.tools.map((tool) => <span key={tool} className="tag tag-neutral">{tool}</span>)}</div><ul className="stack-list compact">{agent.risks.map((risk) => <li key={risk} className="text-muted">{risk}</li>)}</ul></div>
                      </div>
                    )
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="card">
            <div className="section-header">
              <div className="section-title">
                <h2 className="heading">Progress Steps</h2>
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
                      <Pill className={statusClasses[phase.status]} tip={phase.statusAction}>
                        {phase.status}
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
                  <h2 className="heading">Tech Stack</h2>
                  <Pill className="tag-info">{stackCompletion}% total</Pill>
                  <InfoTip text="Each stack item now carries its actual setup status. Only the current frontend layer is active today." />
                </div>
                <IconButton label={stackOpen ? "Collapse Tech Stack" : "Expand Tech Stack"} onClick={() => setStackOpen((open) => !open)}>
                  <ChevronDown className={`icon-small ${stackOpen ? "rotate" : ""}`} />
                </IconButton>
              </div>
              {stackOpen ? (
                <div className="stack-list">
                  {stack.map((item) => (
                    <div key={item.name} className="stack-row">
                      <span className="truncate">{item.name}</span>
                      {item.nextFocus ? <Pill className="tag-danger tag-icon" tip={item.next}><Search className="icon-tiny" /></Pill> : null}
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
              <h2 className="heading">{workRound.title}</h2>
              <InfoTip text={workRound.lastCompleted} />
            </div>
            <IconButton label={workRoundOpen ? "Collapse Instructions" : "Expand Instructions"} onClick={() => setWorkRoundOpen((open) => !open)}>
              <ChevronDown className={`icon-small ${workRoundOpen ? "rotate" : ""}`} />
            </IconButton>
          </div>
          {workRoundOpen ? (
            <div className="instructions-content">
              <div className="status-legend-block">
                <span className="text-muted">Status meanings</span>
                <div className="status-legend">
                  {statusMeanings.map((item) => (
                    <div key={item.status} className="status-meaning">
                      <Pill className={statusClasses[item.status]}>{item.status}</Pill>
                      <span className="text-muted">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="work-flow">
                <div>
                  <span className="text-muted">Triggers</span>
                  <ul className="stack-list compact">
                    {workRound.triggerModes.map((mode) => <li key={mode} className="text-muted">{mode}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-muted">Steps</span>
                  <ol className="work-steps">
                    {workRound.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
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
