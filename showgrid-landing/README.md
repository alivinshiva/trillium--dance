# ShowGrid — User Web App

Public-facing web app for the ShowGrid dance competition platform: TikTok-style vertical feed, challenges, A/B battles, leaderboard, ratings/comments, and upload flow.

Part of the monorepo — see the root `README.md` for setup, env vars, and full documentation index.

## Stack

React 19 + Vite, Tailwind CSS v3, React Router v7, Clerk auth (`@clerk/clerk-react`), PWA plugin. Talks to the main API in `../showgrid-be` (port 5001).

## Key source map

| Path | Purpose |
|------|---------|
| `src/components/Discovered.jsx` | Feed — vertical swipe, sort tabs, lazy video loading, comments drawer |
| `src/components/SubChallengeCard.jsx` | A/B battle card — split-screen duel, vote → locked |
| `src/components/Leaderboard.jsx` | Podium, Best Hook badge, challenge selector |
| `src/components/Dashboard.jsx` / `Profile.jsx` | Stats views (placeholders pending account model) |
| `src/context/VideoContext.jsx` | Feed state: fetchFeed, lazy URLs, comments, votes, leaderboard |
| `src/context/NotificationContext.jsx` | SSE notifications stream |
| `src/upload/` | 4-step upload flow |

Full component/route map and UI backlog: see `UI_V2_REPORT.md` at repo root.

## Env

Copy `.env.example` → `.env` and set `VITE_CLERK_PUBLISHABLE_KEY`.

## Run

```bash
npm install
npm run dev     # Vite dev server (5173)
npm run build   # production build
```

Full-stack dev from repo root: `./start-all.sh`
