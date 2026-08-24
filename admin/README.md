# ShowGrid Admin

Admin dashboard for the ShowGrid dance competition platform: challenge management and submission moderation.

Part of the monorepo — see the root `README.md` for setup, env vars, and full documentation index.

## What it does

- Create/edit challenges (rating parameters, tags, preset comments)
- Moderate submissions (approve / reject) — approval status gates the public feed (`showgrid-be` filters `status: 'approved'` at DB level)

## Stack

React 19 + Vite, Tailwind CSS v4, React Router v7. Talks to the companion API in `../be-admin` (port 5000).

## Run

```bash
npm install
npm run dev     # Vite dev server (5173 or 5174 if taken)
npm run build   # production build
```

Full-stack dev from repo root: `./start-all.sh`
