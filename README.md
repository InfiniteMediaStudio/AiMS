# AiMS Roadmap

Aims means AI + IMS, Infinite Media Studio.

This repository starts with a visual roadmap UI for freezing requirements before core agent development begins.

## Local Development

```bash
npm.cmd install
npm.cmd run dev
```

## GitHub Pages

This app is configured to deploy from `main` with GitHub Actions.

```bash
npm.cmd run build
npm.cmd run github:push
```

After the first push, enable GitHub Pages for the repository using **Settings > Pages > Source: GitHub Actions** if GitHub does not enable it automatically.

## Cloud Development

The repository includes a GitHub Codespaces configuration in `.devcontainer/devcontainer.json`.
Open the private repository on GitHub, choose **Code > Codespaces > Create codespace on main**, then run:

```bash
npm run dev -- --host 0.0.0.0
```

Port `5173` is forwarded as the AiMS Roadmap preview. Port `8787` is reserved for the Manager Agent API.

## Vercel

Import this private GitHub repository into Vercel. The included `vercel.json` builds the Vite application with `npm run build` and publishes `dist`.

Do not place `OPENAI_API_KEY` in a `VITE_` variable or frontend code. Configure it only as a server-side environment variable after the hosted API boundary is implemented.

## Supabase

The Supabase project is connected to this GitHub repository. Database changes live in `supabase/migrations` and should be reviewed like application code.

The Vite frontend uses only the project URL and publishable key:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The initial schema provides a publicly readable `roadmap_documents` table and a private `manager_runs` audit table. Row Level Security blocks browser writes. Until a hosted `aims-roadmap` document exists, the application safely falls back to `src/roadmap.json`.

Never expose the Supabase secret key, service-role key, database password, connection string, or `OPENAI_API_KEY` through a `VITE_` variable.

## Cloud Rollout Order

1. Verify GitHub Codespaces.
2. Connect and deploy the frontend through Vercel.
3. Create the Supabase project and add versioned migrations.
4. Move Manager Agent operations behind a hosted API.
5. Add hold-to-talk voice with explicit confirmations for roadmap mutations.
6. Add audited scheduled and background work.

## First Requirement Freeze

- Agent roles and permissions
- MVP agent sequence
- Open-source-first technology choices
- Approval gates before publishing, sending, spending, or deploying
- Scheduled workflows for agency operations
