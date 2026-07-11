# AiMS Manager Agent

First local prototype for the AiMS Manager role. It routes agency requests, checks approval gates, and returns a structured next action.

## Commands

```bash
npm run manager:dry-run
npm run manager:test
npm run manager:eval
npm run manager:live
npm run manager:serve
```

`manager:dry-run` does not call OpenAI and is used for repeatable local testing.

`manager:test` verifies local routing and approval-gate behavior.

`manager:live` reads `OPENAI_API_KEY` from `.env.local` and calls the OpenAI Responses API from Node.

`manager:serve` starts a local HTTP service:

```bash
GET  http://127.0.0.1:4317/health
GET  http://127.0.0.1:4317/runs
GET  http://127.0.0.1:4317/tasks
POST http://127.0.0.1:4317/run
```

Example POST body:

```json
{
  "request": "Draft a LinkedIn post for a client campaign.",
  "dryRun": true
}
```

## Persistent local store

Every Manager Agent run now writes local JSON records to:

- `agents/manager/data/tasks.json`
- `agents/manager/data/runs.json`

The latest five runs are mirrored to `src/manager-runs.json` so the roadmap dashboard can show recent Manager activity without requiring the local HTTP service to be running.

## Routing and approval evals

`npm run manager:eval` runs the fixture set in `agents/manager/evals/routing-approval.json`. The cases cover routing targets, approval-required decisions, and expected task lifecycle status for common agency requests.

## Persistence decision

The local file store is the active prototype store. PostgreSQL + pgvector remains the selected production persistence direction once the local schema is stable enough to promote.