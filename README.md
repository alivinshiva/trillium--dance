# ShowGrid

Dance competition platform: studios upload performance videos into challenges, fans rate and vote on them, and a fair-play algorithm ranks everything on a TikTok-style vertical feed and leaderboard.

- **Competition verdict** — trust-weighted Wilson lower bound of ratings (manipulation-resistant, time-independent)
- **Discovery feed** — precomputed trending score + per-viewer delivery (hide rated, freshness floor, studio cap, challenge rotation)
- **Generated content** — A/B sub-challenge battles (hook/transition/ending) so the feed never starves between uploads

---

## Repository Structure

```
.
├── showgrid-landing/   User web app (React + Vite) — feed, challenges, leaderboard, upload
├── showgrid-be/        Main API server (Express + MongoDB) — feed algorithm, interactions
├── admin/              Admin dashboard frontend (React + Vite)
├── be-admin/           Admin API server (Express + MongoDB) — challenges, submissions moderation
├── ai-rating/          Node script — AI video rating via Anthropic API
├── infra/              Terraform AWS deployment (ECS Fargate, ECR, S3, ALB, ACM) + DEPLOY.md
└── *.md                Project documentation (see Doc Index below)
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontends | React 19, Vite, Tailwind CSS, React Router v7, Clerk (`@clerk/clerk-react`), PWA plugin |
| APIs | Node.js, Express 5, Mongoose 9, Clerk Node SDK, Cloudinary, Multer |
| Database | MongoDB Atlas |
| Auth | Clerk (session-based, Clerk user id = Mongo `_id`) |
| Media | Cloudinary (video storage/transform) |
| AI | Anthropic SDK (`ai-rating` script, rating helpers in `showgrid-be`) |
| Infra | Terraform + AWS ECS Fargate, GitHub Actions CI/CD |

## Quickstart

Prerequisites: Node.js 18+, a MongoDB Atlas URI, a Clerk application, and a Cloudinary account.

```bash
# 1. Install dependencies for all four apps
./install-all.sh

# 2. Configure environment (copy examples, fill in real values)
cp showgrid-be/.env.example showgrid-be/.env
cp be-admin/.env.example     be-admin/.env
cp showgrid-landing/.env.example showgrid-landing/.env

# 3. Run everything (all 4 servers, Ctrl+C stops all)
./start-all.sh
```

### Environment variables

| App | File | Required vars |
|-----|------|---------------|
| `showgrid-be` | `.env.example` | `MONGO_URI`, `PORT=5001`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `ANTHROPIC_API_KEY` |
| `be-admin` | `.env.example` | `MONGO_URI`, `PORT=5000` |
| `showgrid-landing` | `.env.example` | `VITE_CLERK_PUBLISHABLE_KEY` |
| `admin` | — | none |

Default dev ports: `showgrid-be` 5001, `be-admin` 5000, both Vite frontends 5173 (+5174 for the second instance).

### Running apps individually

```bash
cd showgrid-landing && npm run dev        # user web app
cd showgrid-be && npm run dev             # main API (nodemon)
cd admin && npm run dev                   # admin frontend
cd be-admin && npm run dev                # admin API (nodemon)
node ai-rating/index.js <video.mp4>       # AI rating script
```

Deployment: see `infra/DEPLOY.md` (Terraform ECS Fargate pipeline, GitHub Actions workflow in `.github/deploy.yml`).

---

## Application Overview

### `showgrid-landing` — user web app

Vertical full-screen swipe feed (Latest / Top / Trending / For You tabs), multi-parameter rating sliders, preset-only comments, likes, A/B battle voting, leaderboard with Best Hook badge, SSE notifications, 4-step upload flow. Routes and component map live in `UI_V2_REPORT.md`.

### `showgrid-be` — main API

| Route file | Surface |
|------------|---------|
| `routes/feed.js` | `GET /api/feed` — paginated, sorted, assembled feed with viewer exclusions |
| `routes/submissions.js` | Submission CRUD, lazy URL endpoint (`/urls`), leaderboard |
| `routes/interactions.js` | Like, rate, comment, share (rate-limited) |
| `routes/subChallenges.js` | Battle CRUD, `/vote`, `/best-hook` |
| `routes/notifications.js` | SSE stream |
| `workers/feedScores.js` | 10-min score recompute worker |
| `workers/subChallenges.js` | Battle pairing/closing worker |

### `admin` + `be-admin` — moderation panel

Admin dashboard and its API for challenge management and submission moderation (`challenges.js`, `submissions.js` routes).

### `ai-rating` — AI video rating

Standalone script (`index.js` + `system_prompt.txt`) that sends video data to Claude via Anthropic SDK for automated performance scoring; related helpers also exist in `showgrid-be`.

---

## Documentation Index

| Doc | What it covers |
|-----|----------------|
| **This README** | Project map, setup, run instructions |
| `FEED_REPORT.md` | Feed narrative: problems → journey → what's solved → current status. Read first. |
| `FEED_ALGORITHM.md` | Feed design doc: core principle, threat model, score formula rationale ("why it works") |
| `FEED_IMPLEMENTATION.md` | Feed reference: exact formulas, every tunable knob, data flow ("where to change it") |
| `UI_V2_REPORT.md` | Frontend: v2 changes, bugs fixed, current UI state, backlog, file map |
| `ACCOUNT_MODEL_QUESTIONS.md` | Open questions blocking Studio vs Fan roles (stats API, dashboard wiring) |
| `MOBILE_APP_PLAN.md` | iOS/Android plan: Expo/RN decision, backend hardening challenges, mobile UI spec |
| `infra/DEPLOY.md` | AWS deployment guide |

> Convention: each major feature gets a narrative doc (`*_REPORT.md`) plus, where useful, a design doc and an implementation reference. Update docs in the same PR as code changes.
