# UI V2: Changes, Fixes & Status

> The algo (`FEED_REPORT.md`) is done. This is the frontend: what changed, what's fixed, what works, what's left.

---

## Part 1: What Changed (v1 → v2)

### v1 (before)

- **Feed:** `GET /api/submissions` dumped the *entire* approved database to the client on mount, re-polled every 10 seconds.
- **Sorting:** chronological only. No tabs, no trending, no personalization.
- **Likes/ratings:** `VideoInteraction.jsx` star-rating popup (now orphaned).
- **Comments:** embedded in `Submission.comments` array — no independent collection.
- **Notifications:** `GET /api/notifications` polled every 30 seconds.
- **No sub-challenges, no For You, no lazy loading, no viewer exclusion.**

### v2 (after)

Every change below is a real commit on `master`:

| Commit | What changed |
|--------|-------------|
| `40b2dca` | **Fair-play feed algorithm** — Wilson ranking + trending score on `Submission.feedScore` |
| `22a628e` | **Trending tab + rate limiting** — 3 sort tabs (Latest/Top/Trending) + `rateLimit.js` (120/hr/user) |
| `70b4223` | **Trust-weighted ratings** — `User.js` model, `trust.js`, worker `syncUserTrust`, weighted aggregation |
| `960704f` | **Round-robin challenge rotation** — `assembleFeed()` groups by challenge, one per pass |
| `24f2335` | **Sub-challenges** — A/B hook battles with worker pairings, votes, feed interleave |
| `23330e1` | **Sub-challenge UI** — `SubChallengeCard.jsx` split-screen duel card in feed |
| `eb1086d` | **Best Hook badge** — leaderboard shows studio with highest closed-battle win rate |
| `3084a31` | **For You tab** — tag-affinity reorder of scored pool (signed-in only) |
| `ca1840d` | **SSE notifications** — `EventSource` on `/notifications/stream`, replaces 30s poll |
| `40be95a` | **Comment consolidation** — `VideoComment` collection, `parentId` threading support |
| `fe026cc` | **Lazy video loading** — feed returns metadata, URLs fetched on-demand via `/submissions/urls` |
| `ab32515` | **Bug fixes** — `for_you` crash, dynamic battle text, dead links, fake stats removed |

---

## Part 2: Bugs Fixed (this session)

### Bug 1: `for_you` const mutation (would crash at runtime)

**File:** `showgrid-be/routes/feed.js:295`

The `sort` parameter was destructured as `const` from `req.query`, then reassigned (`sort = 'trending'`) as a fallback when `viewerId` is missing. This throws a runtime error for any unauthenticated For You request.

**Fix:** Extract `sort` from the destructuring and declare as `let sort = req.query.sort || 'latest'`.

### Bug 2: Hardcoded battle question text

**File:** `showgrid-landing/src/components/SubChallengeCard.jsx:77`

The sub-challenge header always read "Which hook is stronger?" regardless of the actual `sc.type` (`hook` | `transition` | `ending`).

**Fix:** Added a `BATTLE_QUESTIONS` map keyed by type with a fallback: `BATTLE_QUESTIONS[sc.type] || 'Which is stronger?'`.

### Bug 3: Dead `#settings` nav links

**Files:** `Profile.jsx:172`, `Dashboard.jsx:52`

Both sidebars linked to `#settings` (a non-existent anchor). Clicking scrolled to page top with no feedback.

**Fix:** Replaced `<a href="#settings">` with `<span>` styled as disabled (`text-white/30 cursor-not-allowed`) with a "Coming soon" `title` attribute.

### Bug 4: Hardcoded fake stats

**Files:** `Dashboard.jsx`, `Profile.jsx`

Multiple stat cards showed fabricated data (rank #42, score 12,850, 94% retention, Mumbai rank #2, 78% contribution, 98%/85%/92% skill bars, fake quotes).

**Fix:** Replaced all values with "—" placeholders and context-appropriate messages ("Stats will appear after your first rated performance"). No user sees misleading numbers anymore.

---

## Part 3: Current UI State — What Works

### Feed (`Discovered.jsx`)

- **TikTok-style vertical full-screen swipe** — one video at a time, touch swipe (mobile) / scroll wheel (desktop).
- **4 sort tabs:** Latest | Top | Trending | For You (signed-in only).
- **Lazy URL loading:** feed returns metadata (`-videoUrl`); URLs fetched on-demand via `GET /submissions/urls?ids=a,b,c` for `currentIndex-1` through `currentIndex+2`. Spinner overlay while loading.
- **Viewer exclusion:** rated + seen-over-K videos don't reshow. Passes `viewerId` to `/api/feed`.
- **Sub-challenge interleaving:** ~1 battle card per 10 video slots, rendered via `SubChallengeCard`.
- **Bottom-left info overlay:** challenge title, `@username`, studio name, auto-toggling song/city ticker.

### A/B Battles (`SubChallengeCard.jsx`)

- **Split-screen duel:** top half = video A, bottom half = video B, "VS" divider.
- **Auto-play muted loop** for both videos simultaneously.
- **Vote → locked:** tap a side to vote. Chosen side gets pink overlay + "Voted" badge. Re-voting blocked.
- **Dynamic question:** reads `sc.type` to show correct prompt (hook / transition / ending).

### Comments

- **Preset-only:** users tap a colored pill (green/positive, yellow/neutral, purple/negative) → posted as a real comment.
- **No free-text input** (backend supports it, frontend doesn't expose it).
- **One comment per user** enforced server-side.
- **Presets** come from challenge `presetComments` or global fallback (`parseComments.js`).
- **No threading UI** despite backend `parentId` support.

### Likes & Rating

- **Heart toggle** (like/unlike) with optimistic update. Owner excluded.
- **Multi-parameter rating sliders** (e.g., Energy, Choreo, Sync) from `challengeId.ratingParameters`. Range 1–5, debounced 1s submit. Weighted average → `POST /api/interactions/rate`.

### Leaderboard (`Leaderboard.jsx`)

- **Challenge selector** dropdown.
- **Best Hook badge:** studio with highest closed-battle win rate, shown as a prominent card.
- **Top 3 podium:** 1st (center, crown), 2nd, 3rd with avatar, name, city, score.
- **Full list (4+):** rank, dancer, city, rating. Current user highlighted.
- **Per-user ranking** (not per-video) by Wilson score.

### Notifications (`NotificationContext.jsx` + `NotificationPanel.jsx`)

- **SSE stream** via `EventSource` on `/notifications/stream?userId=...`.
- **Deduped + prepended** to state. Slide-out panel with mark-as-read (individual + bulk).
- **Real-time:** new notifications appear without refresh.

### Navigation

| Location | Tabs |
|----------|------|
| Desktop top navbar | DISCOVER, CHALLENGES, LEADERBOARD, bell, My Profile |
| Mobile bottom bar | Feed, Battles, Rank, Profile |
| Desktop sidebar (Profile/Dashboard) | Feed, Challenges, Leaderboard, My Profile, Notifications, Settings (disabled), Sign Out |

### Routes

| Path | Component | Auth |
|------|-----------|------|
| `/` | Landing page | No |
| `/discovered` | Discovered (feed) | Yes |
| `/discovered/feed/:id` | Discovered (specific video) | No (but navigation gated) |
| `/challenges` | Challenges list | No |
| `/challenges/:id/details` | Challenge details | No |
| `/leaderboard` | Leaderboard | No |
| `/leaderboard/:id` | Leaderboard (challenge) | No |
| `/profile` | Profile | Yes |
| `/dashboard` | Dashboard | Yes |
| `/upload` | Upload step 1 | No |
| `/challenges/:id/upload/step-2` | Upload step 2 | Yes |
| `/challenges/:id/upload/step-3` | Upload step 3 | Yes |
| `/challenges/:id/upload/step-4` | Upload final | Yes |

---

## Part 4: Not Yet Done / Backlog

### Must Fix

| Item | Why |
|------|-----|
| **Tags invisible after upload** | Users select tags during upload but never see them in feed, leaderboard, or profile. Tags only power the backend For You algorithm. |
| **No free-text comment input** | Backend supports any body text, but frontend only exposes preset pills. Users can't write their own feedback. |
| **Dashboard/Profile stats need real APIs** | Currently showing "—" placeholders. Needs `GET /api/users/:id/stats` or similar to pull real data. |

### Should Fix

| Item | Why |
|------|-----|
| **No double-tap-to-like** | TikTok-standard gesture. Current like is icon-only. |
| **No comment threading UI** | Backend supports `parentId` for replies, but UI only shows top-level. |
| **Comment pagination** | Backend supports `after` cursor, frontend fetches all at once. |
| **VIEW NATIONAL LEADERBOARD button** (`Profile.jsx:291`) | No `onClick` handler — does nothing when clicked. |
| **No real-time feed/leaderboard** | Only notifications use SSE. New videos don't appear until next page load. |

### Nice to Have

| Item | Why |
|------|-----|
| **Tag-based discovery** | Filter or search by hashtag. Tags exist on challenges/submissions but aren't exposed in UI. |
| **Settings page** | Both sidebars have disabled "Settings" placeholder. |
| **Upload step 2 audio player** | Seek bar shows fixed "0:20–1:00", rewind/forward/download buttons do nothing. |
| **Upload step 3 Mastery Analysis** | Blurred chart with lock overlay — purely decorative, data is hardcoded. |

### Dead Code to Clean

| File | Why |
|------|-----|
| `VideoInteraction.jsx` | Orphaned legacy component (star-rating popup). Never imported anywhere. |
| `FeaturedChallenge.jsx` | Orphaned component (challenge view with countdown). Never imported anywhere. |

---

## Part 5: File Map

### Frontend (`showgrid-landing/src/`)

| File | Purpose |
|------|---------|
| `App.jsx` | Route definitions, auth wrappers |
| `components/Discovered.jsx` | Feed — vertical swipe, sort tabs, lazy loading, comments drawer, rating sliders |
| `components/SubChallengeCard.jsx` | A/B battle card — split-screen duel, vote → locked |
| `components/Leaderboard.jsx` | Leaderboard — podium, Best Hook badge, challenge selector |
| `components/Dashboard.jsx` | Creator/Fan dashboard — stats (placeholders), skill bars (placeholders) |
| `components/Profile.jsx` | User profile — videos grid, City Pride (placeholder), stats (placeholders) |
| `components/NotificationPanel.jsx` | Slide-out notification panel |
| `components/Navbar.jsx` | Desktop top nav + mobile bottom bar |
| `components/ChallengeDetails.jsx` | Challenge detail view |
| `components/Challenges.jsx` | Challenge list page |
| `components/upload/UploadFinal.jsx` | Upload step 4 — tag selection (max 10) |
| `context/VideoContext.jsx` | Feed state, `fetchFeed`, `getVideoUrls` (lazy), `getComments`, `addComment`, `voteSubChallenge`, `getLeaderboard`, `getBestHook` |
| `context/NotificationContext.jsx` | SSE `EventSource` on `/notifications/stream`, dedup + state |

### Backend (`showgrid-be/`)

| File | Purpose |
|------|---------|
| `routes/feed.js` | `GET /api/feed` — paginated, sorted, assembled feed with viewer exclusion |
| `routes/interactions.js` | Like, rate, comment, share endpoints |
| `routes/notifications.js` | `GET /api/notifications/stream` — SSE endpoint |
| `routes/subChallenges.js` | Sub-challenge CRUD + vote endpoint |
| `routes/submissions.js` | Submission CRUD + lazy URL endpoint + leaderboard |
| `models/Submission.js` | `feedScore`, `wilsonScore`, `feedScoreUpdatedAt` fields |
| `models/SubChallenge.js` | Types: `hook`/`transition`/`ending`, vote counts, status |
| `models/Interaction.js` | `VideoAggregate` (impressions, likes, comments, shares) |
| `utils/feedScore.js` | `computeScore()`, `computeEngagementEff()`, `wilson()` |
| `utils/trust.js` | `computeTrust()` for weighted ratings |
| `utils/rateLimit.js` | 120 actions/hr/user, 429 on exceed |
| `utils/sse.js` | SSE helper for notification stream |
| `workers/feedScores.js` | 10-min recompute job for all `feedScore`/`wilsonScore` |
| `workers/subChallenges.js` | Worker for pairing sub-challenges + closing battles |
