insert into public.roadmap_documents (slug, document, version)
values (
  'aims-roadmap',
  $aims_roadmap${
  "meta": {
    "projectName": "AiMS",
    "subtitle": "Roadmap",
    "version": "Requirements v0.3",
    "currentState": "Cloud-first development is active. Vercel production is live, Supabase migrations are applying successfully, and the current roadmap is being promoted into hosted database storage.",
    "nextFocus": "Deploy and verify the first hosted aims-roadmap document, then add an authenticated server API for controlled roadmap updates."
  },
  "stats": [
    {
      "label": "Overall",
      "value": "26%",
      "detail": "The dashboard and Manager Agent local MVP exist, and the cloud rollout has started with GitHub as source of truth plus Codespaces and Vercel repository configuration. Hosted data, voice, and background execution remain pending."
    },
    {
      "label": "Agents",
      "value": "10",
      "detail": "Ten agent roles are mapped as requirements, not implemented services."
    },
    {
      "label": "Ready",
      "value": "3",
      "detail": "The roadmap dashboard, Manager Agent local MVP, and Manager routing/approval eval suite are ready for review."
    },
    {
      "label": "Decision Items",
      "value": "8",
      "detail": "These decisions should be frozen before core development begins. API billing/quota is now tracked because live OpenAI calls reached the API but were rejected by current quota."
    }
  ],
  "agents": [
    {
      "id": "manager",
      "agentName": "Aims Captain",
      "name": "Manager",
      "owner": "Core System",
      "icon": "Workflow",
      "purpose": "Central dispatcher for requests, routing, approvals, schedules, and operational visibility.",
      "compact": "Routes work and controls approvals.",
      "tools": [
        "Task DB",
        "Calendar",
        "CRM",
        "Approval queue"
      ],
      "requirements": [
        "Task lifecycle frozen",
        "Approval matrix frozen",
        "Run log shape frozen",
        "Client context lookup",
        "Escalation rules"
      ],
      "todos": [
        "Run live OpenAI smoke test after billing/quota is unblocked",
        "Add run-log dashboard filters for agent, status, and approval state",
        "Promote file-store schema to PostgreSQL when production begins"
      ],
      "risks": [
        "Live OpenAI validation is blocked until API billing/quota is fixed",
        "Do not connect publishing or client-write tools until approvals are tested in live mode"
      ],
      "progress": 72,
      "status": "ready",
      "statusAction": "Local Manager MVP is ready. Next blocker: enable API billing/quota and run the live OpenAI smoke test.",
      "priority": "P0",
      "nextFocus": false
    },
    {
      "id": "development",
      "agentName": "CodePilot",
      "name": "Develop",
      "owner": "Delivery",
      "icon": "Code2",
      "purpose": "Builds web/app work, writes tests, opens pull requests, and prepares deployments.",
      "compact": "Code, review, test, PR, deploy handoff.",
      "tools": [
        "GitHub",
        "Codex",
        "Browser tests",
        "Deployment CLI"
      ],
      "requirements": [
        "Repo access",
        "Coding conventions",
        "Test command registry",
        "Deployment approval gate"
      ],
      "todos": [
        "Verify the Codespaces development container",
        "Connect the private repository to Vercel and verify production deployment",
        "Create the Supabase project and versioned migrations"
      ],
      "risks": [
        "Production changes without review",
        "Client repo credentials must stay isolated"
      ],
      "progress": 28,
      "status": "in process",
      "statusAction": "Active next focus: finish Supabase integration and move roadmap state into hosted storage.",
      "priority": "P0",
      "nextFocus": true
    },
    {
      "id": "design",
      "agentName": "BrandSmith",
      "name": "Design",
      "owner": "Creative",
      "icon": "Palette",
      "purpose": "Produces UI directions, brand systems, campaign visuals, and handoff-ready creative briefs.",
      "compact": "Brand, UI, layouts, creative systems.",
      "tools": [
        "Figma-ready exports",
        "Image generation",
        "Asset library",
        "Brand memory"
      ],
      "requirements": [
        "Brand voice files",
        "Design token format",
        "Asset naming rules",
        "Review states"
      ],
      "todos": [
        "Define brand kit schema",
        "Create creative brief template",
        "Set visual QA rubric"
      ],
      "risks": [
        "Off-brand outputs",
        "Unlicensed assets entering client work"
      ],
      "progress": 4,
      "status": "pending",
      "statusAction": "Freeze the client brand kit schema after the Manager Agent requirements are stable.",
      "priority": "P1",
      "nextFocus": false
    },
    {
      "id": "video",
      "agentName": "ReelForge",
      "name": "Video",
      "owner": "Creative",
      "icon": "Film",
      "purpose": "Plans short-form and campaign video scripts, storyboards, captions, and edit briefs.",
      "compact": "Scripts, hooks, storyboards, captions.",
      "tools": [
        "Drive media",
        "Shot lists",
        "Caption library",
        "Storyboard templates"
      ],
      "requirements": [
        "Video formats",
        "Brand-safe claim rules",
        "Media storage paths",
        "Approval checkpoints"
      ],
      "todos": [
        "Define storyboard format",
        "Create caption variants",
        "List required source assets"
      ],
      "risks": [
        "Wrong claims in ad scripts",
        "Missing permissions for client media"
      ],
      "progress": 2,
      "status": "pending",
      "statusAction": "Keep planned until creative asset and approval structures are defined.",
      "priority": "P2",
      "nextFocus": false
    },
    {
      "id": "google-market",
      "agentName": "RankPilot",
      "name": "Google",
      "owner": "Growth",
      "icon": "BarChart3",
      "purpose": "Handles SEO, Google Ads planning, keyword strategy, landing-page checks, and performance reports.",
      "compact": "SEO, Ads, keywords, analytics reports.",
      "tools": [
        "GA4",
        "Search Console",
        "Google Ads exports",
        "Sheets import"
      ],
      "requirements": [
        "Analytics access",
        "Campaign budget rules",
        "Keyword taxonomy",
        "Report cadence"
      ],
      "todos": [
        "Choose reporting metrics",
        "Define budget-change approval",
        "Map client properties"
      ],
      "risks": [
        "Ad spend changes need strict permission",
        "Analytics data can be noisy or delayed"
      ],
      "progress": 3,
      "status": "pending",
      "statusAction": "Start with read-only reporting before any ad budget action is allowed.",
      "priority": "P1",
      "nextFocus": false
    },
    {
      "id": "social-market",
      "agentName": "SocialSpark",
      "name": "Social",
      "owner": "Growth",
      "icon": "Megaphone",
      "purpose": "Creates platform-specific calendars, posts, hooks, campaigns, and approval-ready drafts.",
      "compact": "Content calendar and post drafts.",
      "tools": [
        "Meta",
        "LinkedIn",
        "Scheduler",
        "Brand voice memory"
      ],
      "requirements": [
        "Platform list",
        "Posting cadence",
        "Approval workflow",
        "Voice rules"
      ],
      "todos": [
        "Build content calendar schema",
        "Define post status flow",
        "Create caption rubric"
      ],
      "risks": [
        "Publishing without approval",
        "Tone mismatch across clients"
      ],
      "progress": 6,
      "status": "pending",
      "statusAction": "Prepare as the first specialist after Manager because it gives fast agency value.",
      "priority": "P0",
      "nextFocus": false
    },
    {
      "id": "sales",
      "agentName": "DealFlow",
      "name": "Sales",
      "owner": "Revenue",
      "icon": "HandCoins",
      "purpose": "Researches leads, drafts outreach, prepares proposals, and keeps pipeline records current.",
      "compact": "Lead research, outreach, proposals.",
      "tools": [
        "CRM",
        "Email drafts",
        "Proposal templates",
        "Calendar"
      ],
      "requirements": [
        "ICP definitions",
        "Offer library",
        "Follow-up rules",
        "CRM fields"
      ],
      "todos": [
        "Freeze CRM choice",
        "Create proposal data model",
        "Define email approval rule"
      ],
      "risks": [
        "Outbound messages need approval",
        "Lead data must be sourced responsibly"
      ],
      "progress": 5,
      "status": "pending",
      "statusAction": "Choose the first CRM and map required pipeline fields.",
      "priority": "P0",
      "nextFocus": false
    },
    {
      "id": "support",
      "agentName": "TrustGuard",
      "name": "Support",
      "owner": "Client Success",
      "icon": "ShieldCheck",
      "purpose": "Handles client follow-ups, weekly summaries, support requests, and account health signals.",
      "compact": "Client support, follow-ups, reports.",
      "tools": [
        "Client notes",
        "Support inbox",
        "Reports",
        "Calendar"
      ],
      "requirements": [
        "Support request lifecycle",
        "Client health status",
        "Weekly summary template",
        "Escalation rules"
      ],
      "todos": [
        "Define client support statuses",
        "Create weekly support report outline",
        "Map escalation triggers"
      ],
      "risks": [
        "Client-facing messages need approval",
        "Support issues can hide delivery risks"
      ],
      "progress": 3,
      "status": "pending",
      "statusAction": "Define support lifecycle after Manager task states are connected.",
      "priority": "P1",
      "nextFocus": false
    },
    {
      "id": "qa",
      "agentName": "ProofLock",
      "name": "QA",
      "owner": "Control",
      "icon": "ShieldCheck",
      "purpose": "Reviews output quality, factual accuracy, brand fit, permissions, and publish readiness.",
      "compact": "Final checks and risk control.",
      "tools": [
        "Checklists",
        "Audit logs",
        "Policy rules",
        "Eval cases"
      ],
      "requirements": [
        "Review rubrics",
        "Forbidden actions",
        "Audit log schema",
        "Eval suite"
      ],
      "todos": [
        "Define universal QA checklist",
        "Create blocked-action registry",
        "Add eval cases"
      ],
      "risks": [
        "Weak governance makes every other agent unsafe",
        "Review rules can become too vague"
      ],
      "progress": 5,
      "status": "pending",
      "statusAction": "Create the first cross-agent QA checklist before any publishing tools are connected.",
      "priority": "P0",
      "nextFocus": false
    },
    {
      "id": "accounts",
      "agentName": "LedgerFlow",
      "name": "Accounts",
      "owner": "Finance",
      "icon": "HandCoins",
      "purpose": "Tracks invoices, retainers, subscriptions, payment follow-ups, and project profitability notes.",
      "compact": "Invoices, payments, finance tracking.",
      "tools": [
        "Invoice records",
        "Payment reminders",
        "Subscription list",
        "Profitability notes"
      ],
      "requirements": [
        "Invoice status flow",
        "Payment reminder rules",
        "Subscription tracker",
        "Finance approval boundaries"
      ],
      "todos": [
        "Define invoice statuses",
        "Create payment reminder template",
        "Map monthly account summary"
      ],
      "risks": [
        "Financial messages require approval",
        "Sensitive payment data must stay protected"
      ],
      "progress": 2,
      "status": "pending",
      "statusAction": "Define accounting workflow after core CRM and client records are selected.",
      "priority": "P2",
      "nextFocus": false
    }
  ],
  "phases": [
    {
      "number": "01",
      "title": "Requirement Freeze",
      "mode": "freeze",
      "progress": 58,
      "summary": "Turn this dashboard into the shared source for roadmap, requirements, tasks, and decisions. Manager Agent lifecycle, approval rules, local persistence shape, and routing/approval eval expectations are now frozen.",
      "todo": "Keep new scope behind Decisions Board before specialist agents are built.",
      "statusAction": "Next: keep decisions tight while moving into specialist MVP work."
    },
    {
      "number": "02",
      "title": "Independent Core",
      "mode": "build",
      "progress": 26,
      "summary": "Build owned backend, database, scheduler, queue, and file/memory foundations. Manager Agent service endpoints, file-backed task/run persistence, and dashboard run mirroring are implemented.",
      "todo": "Promote the local file schema to PostgreSQL when production storage begins.",
      "statusAction": "Production persistence direction is PostgreSQL + pgvector after the local file-store schema is proven."
    },
    {
      "number": "03",
      "title": "Agent MVP",
      "mode": "build",
      "progress": 24,
      "summary": "Ship Manager, Social Market, and Sales agents with tool calls and approval gates. Manager local MVP is ready; Social and Sales remain pending.",
      "todo": "Run live Manager smoke test when quota is unblocked, then start Social Agent MVP.",
      "statusAction": "Manager is locally ready; next specialist candidate is Social."
    },
    {
      "number": "04",
      "title": "Delivery Agents",
      "mode": "scale",
      "progress": 0,
      "summary": "Add Development, Design, Video, and Google Market workflows after the control layer works.",
      "todo": "Define safe tool permissions per specialist.",
      "statusAction": "Start after MVP agents are reliable."
    },
    {
      "number": "05",
      "title": "Agency OS",
      "mode": "scale",
      "progress": 0,
      "summary": "Unify dashboards, reports, costs, schedules, evals, and role-based access.",
      "todo": "Create production hardening checklist.",
      "statusAction": "Start after core workflows are proven."
    },
    {
      "number": "06",
      "title": "Cloud Workspace",
      "mode": "build",
      "progress": 75,
      "summary": "The existing private GitHub repository is the source of truth, Codespaces configuration is present, CI validates cloud changes, and Vercel production deployment is working at https://ai-ms.vercel.app/.",
      "todo": "Verify Codespaces from GitHub and complete Supabase integration before moving application state online.",
      "statusAction": "Vercel deployment is live; Supabase is the active cloud setup step."
    },
    {
      "number": "07",
      "title": "Hosted Roadmap Data",
      "mode": "build",
      "progress": 78,
      "summary": "Supabase is connected to GitHub, secured schema migrations apply successfully, and the frontend supports hosted roadmap loading with a safe bundled fallback. The initial hosted roadmap seed is ready for deployment.",
      "todo": "Deploy the initial aims-roadmap document and verify the production frontend reads it from Supabase.",
      "statusAction": "Hosted seed migration is ready; production verification is next."
    },
    {
      "number": "08",
      "title": "Online Manager API",
      "mode": "build",
      "progress": 5,
      "summary": "Move Manager Agent requests behind a hosted server API so reports and approved roadmap commands work without localhost.",
      "todo": "Choose the Vercel Functions boundary, configure server-only secrets, and connect Manager runs to Supabase.",
      "statusAction": "Starts after hosted roadmap data and environment secrets are available."
    },
    {
      "number": "09",
      "title": "Hold-to-Talk Voice",
      "mode": "build",
      "progress": 5,
      "summary": "Add a press-and-hold microphone control, live transcript, spoken status reports, structured roadmap commands, and confirmations for consequential actions.",
      "todo": "Implement a short-lived Realtime session endpoint and the browser microphone interaction after the hosted Manager API is available.",
      "statusAction": "OpenAI project target is selected; repository-local secret placement still needs approval."
    },
    {
      "number": "10",
      "title": "Background Work",
      "mode": "scale",
      "progress": 0,
      "summary": "Run bounded cloud tasks, scheduled status reports, CI checks, and approved maintenance while the owner's laptop is offline.",
      "todo": "Define safe scheduled jobs and connect GitHub Actions or Codex cloud tasks with audit logs and approval gates.",
      "statusAction": "Starts after online state, authentication, and command approvals are proven."
    }
  ],
  "stack": [
    {
      "name": "React + Tailwind",
      "status": "active",
      "progress": 100,
      "next": "Use this dashboard as the requirements surface."
    },
    {
      "name": "OpenAI Responses API",
      "status": "in process",
      "progress": 20,
      "next": "Manager Agent live mode is coded, but live output remains blocked until API quota or billing is enabled."
    },
    {
      "name": "PostgreSQL + pgvector",
      "status": "ready",
      "progress": 20,
      "next": "Selected production persistence direction after the local file-backed task/run schema is validated."
    },
    {
      "name": "Redis or open-source queue",
      "status": "pending",
      "progress": 0,
      "next": "Add for scheduled and background agent jobs."
    },
    {
      "name": "Docker",
      "status": "pending",
      "progress": 0,
      "next": "Use for local database and service orchestration."
    },
    {
      "name": "GitHub + Codex",
      "status": "active",
      "progress": 78,
      "next": "Private repository is selected; use Codespaces and the work-round flow for cloud development."
    },
    {
      "name": "Vercel",
      "status": "active",
      "progress": 100,
      "next": "Production deployment is live at https://ai-ms.vercel.app/ and follows the connected GitHub repository."
    },
    {
      "name": "Supabase",
      "status": "in process",
      "progress": 78,
      "next": "Deploy and verify the hosted aims-roadmap document, then add authenticated write operations."
    },
    {
      "name": "OpenAI Realtime API",
      "status": "in process",
      "progress": 5,
      "next": "Add hold-to-talk after the hosted Manager API and server-only secret configuration are available."
    }
  ],
  "workRound": {
    "title": "Codex Work Round",
    "triggerModes": [
      "Direct request: complete the requested roadmap or implementation task, even if it changes scope.",
      "Next focus request: find the active nextFocus item, complete the highest-priority work it implies, then update roadmap state."
    ],
    "steps": [
      "Read roadmap.json and current repository state.",
      "Identify next focus by nextFocus=true, priority, statusAction, and Decisions Board state.",
      "Implement the smallest useful work package.",
      "Run build and browser checks until clean.",
      "Update agent progress, phase progress, status, decisions, and the nextFocus item.",
      "Commit and push to GitHub for deployment."
    ],
    "lastCompleted": "Verified the Supabase production migration workflow and prepared the current roadmap as the first versioned hosted aims-roadmap document."
  },
  "managerControlPlane": {
    "taskLifecycle": [
      "intake",
      "triage",
      "assigned",
      "drafting",
      "review",
      "approval_required",
      "approved",
      "scheduled",
      "done",
      "blocked",
      "archived"
    ],
    "approvalMatrix": [
      {
        "action": "Send client email",
        "approval": "Required",
        "approver": "Business owner or assigned account lead"
      },
      {
        "action": "Publish social content",
        "approval": "Required",
        "approver": "Business owner or client-approved content lead"
      },
      {
        "action": "Change ad budget",
        "approval": "Required",
        "approver": "Business owner only"
      },
      {
        "action": "Deploy website or app",
        "approval": "Required",
        "approver": "Technical owner plus business owner"
      },
      {
        "action": "Edit production client data",
        "approval": "Required",
        "approver": "Business owner"
      },
      {
        "action": "Create drafts, reports, briefs, or internal tasks",
        "approval": "Not required",
        "approver": "System can proceed and log"
      }
    ],
    "runLogFields": [
      "run_id",
      "request",
      "agent",
      "status",
      "tools_used",
      "approval_required",
      "decision",
      "output_link",
      "next_action",
      "timestamp"
    ]
  },
  "decisions": [
    {
      "label": "CRM choice",
      "status": "pending",
      "detail": "Pending. Choose the first CRM target before Sales Agent implementation. Recommended low-dependency path: start with a simple internal pipeline table, then connect HubSpot, Zoho, or Pipedrive only if needed."
    },
    {
      "label": "MVP agent order",
      "status": "decided",
      "detail": "Decided. Build order starts with Agency Manager, then Social Market and Sales. This gives routing, approvals, content planning, and lead workflow before deeper integrations."
    },
    {
      "label": "Approval roles",
      "status": "decided",
      "detail": "Decided for MVP. Client email, publishing, ad budget changes, deployment, and production data edits require human approval. Drafts, reports, briefs, and internal task creation may proceed with logs."
    },
    {
      "label": "Client file schema",
      "status": "pending",
      "detail": "Pending. Define the required client knowledge folders: brand, offers, services, assets, reports, meetings, approvals, and credentials references."
    },
    {
      "label": "Backend language",
      "status": "decided",
      "detail": "Decided. Use Node first because this machine already has Node and the roadmap dashboard is Vite/React. The Manager Agent can call the OpenAI Responses API directly now; Python/FastAPI can be added later only if a specialist workflow needs it."
    },
    {
      "label": "Weekly reports",
      "status": "pending",
      "detail": "Pending. Decide the first recurring report format: client summary, active tasks, wins, blockers, next-week plan, and metrics snapshot."
    },
    {
      "label": "API billing quota",
      "status": "pending",
      "detail": "Pending. Live OpenAI smoke test reached the API but returned a current quota/billing error. Enable API billing or adjust usage limits before live agent runs can complete."
    },
    {
      "label": "Production persistence",
      "status": "decided",
      "detail": "Decided. Use PostgreSQL + pgvector as the production persistence backend after the local file-backed task and run-log schema is validated. Keep the JSON file store as the local prototype and dashboard mirror."
    }
  ]
}$aims_roadmap$::jsonb,
  1
)
on conflict (slug) do update
set document = excluded.document,
    version = public.roadmap_documents.version + 1;
