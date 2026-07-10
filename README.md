# Aims Roadmap

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

## First Requirement Freeze

- Agent roles and permissions
- MVP agent sequence
- Open-source-first technology choices
- Approval gates before publishing, sending, spending, or deploying
- Scheduled workflows for agency operations
