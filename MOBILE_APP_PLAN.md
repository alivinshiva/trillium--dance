# Mobile App Plan — iOS + Android

> Extends ShowGrid to native mobile. The backend and DB are **reused as-is** (with a hardening pass); the decision to make is client tech. Companion docs: `FEED_REPORT.md` / `UI_V2_REPORT.md` for how the web app works today, `MOBILE_SCREENS.md` for the screen-by-screen build checklist.

---

## Part 1: Client Tech Decision

### Options considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **React Native (Expo)** | Team already knows React; contexts/hooks/component patterns port over; one JS codebase for both platforms; OTA updates via EAS; official `@clerk/clerk-expo` SDK | Video perf needs care (`expo-video`, not `<video>`); new build toolchain (EAS Build) | ✅ **CHOSEN** |
| Flutter | Best-in-class smooth scroll/animations; single Dart codebase | Zero code reuse; new language + ecosystem for a React team | Rejected |
| Capacitor (wrap web app) | Ships in days — native WebView shell around `showgrid-landing` | Janky vertical-swipe video UX; store rejection risk for thin wrappers; poor gestures | MVP-only fallback |
| Native Swift + Kotlin | Max performance/control | 2 full apps, 2 languages, 2x maintenance | Not justified at current scale |

**Decision: Expo + React Native.** The product is ~80% one screen — the vertical video feed — which RN handles well with `FlashList` + `expo-video`. The existing REST API, Clerk auth, and paginated feed design carry over directly.

---

## Part 2: Backend & DB Challenges When Reusing Them

The backend *works* today, but it was co-designed with a web client that deploys instantly. Mobile breaks several of those assumptions.

### Challenge 1: Identity spoofing becomes a real vulnerability ⚠️ HIGHEST PRIORITY

The API trusts **client-supplied identity** everywhere:

- `viewerId` query param on `/api/feed` (feed exclusions, impressions, `VideoView` writes)
- `?userId=` on comment delete, sub-challenge votes, notifications stream

On the web this was merely obscure. On mobile, anyone can decompile the app or probe the API and **pass someone else's ID** — poisoning their view history, exclusions, and impression counts, or acting as them.

**Fix:** derive identity server-side from the Clerk session token (`requireAuth` middleware on protected routes). Ignore client-passed IDs entirely. Touches nearly every route in `showgrid-be/routes/`.

### Challenge 2: SSE → Push Notifications

The SSE hub (`utils/sse.js`) dies when a phone backgrounds the app — iOS suspends sockets aggressively. Foreground reconnect storms hammer the server.

**Fix:** keep SSE for foreground live updates; add **Expo Push Notifications (APNs/FCM)** as the real delivery channel. New backend work:

- Store push tokens per device on `User` (new `pushTokens[]` field)
- Build device-targeted payloads in `utils/notify.js` alongside persistence
- Handle token invalidation (uninstalls, token rotation)
- Deep-link routing from notification tap → screen

### Challenge 3: No API contract = every change breaks shipped apps

Web deploys instantly; mobile binaries live for months (plus App Store review delays). Today frontend/backend share implicit, unversioned assumptions.

**Fix:**

- Version the API (`/api/v2/...`) starting now
- Add `GET /config` returning a "minimum supported version" so old clients can be force-upgraded
- Contract rule going forward: **never remove/rename response fields — additive changes only**

### Challenge 4: Flaky networks corrupt scoring data ⚠️ SUBTLE BUT CORE

Mobile networks retry aggressively (timeouts, socket drops mid-scroll). `recordServe()` increments `impressions` + writes a `VideoView` on every feed fetch — retries **double-count impressions**, deflating engagement rates and distorting `feedScore`/trending. Same idempotency risk on likes/votes under retry.

**Fix:**

- Dedupe serves per `(viewer, video)` within a short window (e.g., 60s) before incrementing
- Make all write endpoints tolerate duplicate submissions (idempotency keys or natural unique indexes)

### Challenge 5: Single-instance limits arrive sooner

In-memory rate limiter (`utils/rateLimit.js`) and SSE hub are fine for one web deployment. Mobile multiplies concurrent connections (push registration, feed prefetching, reconnects). At 2+ instances both break silently.

**Fix:** Redis for the limiter; push replaces most SSE traffic. Already flagged in `FEED_REPORT.md` Part 6 — mobile is what forces it.

### Challenge 6: Video delivery economics 💰 BIGGEST LIFT

Raw MP4 delivery is tolerable on desktop wifi; on cellular it burns user data, and 4K camera-roll uploads choke the ingest path.

**Fix (progressive):**

- Playback: HLS transcoding with adaptive bitrate
- Upload: direct-to-storage signed URLs (S3/Cloudinary), resumable upload protocol (tus) for large camera files

This can start with MP4 + progressive improvement — don't block the app launch on it.

### Challenge 7: Smaller items

| Issue | Impact | Fix |
|-------|--------|-----|
| Token storage | localStorage-equivalent insecure on mobile | Keychain/Keystore via `@clerk/clerk-expo` (handled by SDK) |
| Account deletion | Apple hard-requires it; endpoint doesn't exist | `DELETE /users/me` + data cleanup |
| HTTP caching | No ETag/Cache-Control today; mobile pays full bandwidth every time | Add ETag/Cache-Control on read-heavy endpoints |
| Leaderboard aggregation per request | Fast mobile scrolling = heavy Mongo load | Cache leaderboard result (short TTL) |
| Half-loaded pages / pagination drift | Retries can skip/duplicate pages across assembly windows | Client-side tolerance; server dedupe from Challenge 4 |
| CORS / Clerk allowed origins | Web-centric config | Add Expo app scheme + Clerk allowed origins |

---

## Part 3: Recommended Sequence

1. **Backend hardening pass** (Challenges 1–4 first — they're correctness/security issues *even for the web app*): server-side auth identity, API versioning skeleton, serve dedupe, account deletion.
2. **Expo scaffold + Clerk login**
3. **Feed screen** (vertical swipe, sort tabs, lazy URL prefetch via `GET /submissions/urls`) ← the hard part; do it early
4. Rating sliders / likes / comments drawer
5. Sub-challenge A/B battle card
6. Leaderboard + profile
7. Push notifications (Challenge 2 work lands here)
8. Upload flow (camera/gallery → resumable upload)
9. EAS Build → TestFlight / Play Internal testing

Estimate for step 1: ~1–2 weeks. Step 6 (video pipeline) is the long pole if HLS is attempted pre-launch.

---

## Part 4: Hardening Checklist

- [ ] **C1:** `requireAuth` middleware; strip all client-supplied identity params (`viewerId`, `userId`) from protected routes
- [ ] **C3:** `/api/v2/` prefix + `GET /config` min-version endpoint
- [ ] **C4:** serve dedupe window `(viewer, video)` before impression/view writes
- [ ] **C4:** audit write endpoints for retry-idempotency (votes already safe via unique index)
- [ ] **Apple:** account deletion endpoint + privacy manifest
- [ ] **Perf:** ETag/Cache-Control on feed/comments/leaderboard reads
- [ ] **Perf:** short-TTL cache on leaderboard aggregation
- [ ] **C2 (later):** push tokens on `User`, Expo Push send path in `utils/notify.js`
- [ ] **C5 (later):** Redis rate limiter when instances > 1
- [ ] **C6 (later):** HLS transcode pipeline + resumable uploads

---

## Part 5: Mobile UI Spec

> Screen size is the constraint: only the most-used features get permanent pixels; everything else opens on demand. The web app's mobile layout (`UI_V2_REPORT.md`: bottom bar Feed/Battles/Rank/Profile, top sort tabs) is the blueprint — make it native-quality, don't redesign.

### Design principles

1. **Progressive disclosure** — rank features by frequency of use:

| Tier | Features | Home |
|------|----------|------|
| Always visible | Video, swipe, like, comments entry, creator/challenge info | Overlay + rails |
| One tap away | Rating sliders, tags, share, full challenge info | Bottom sheets |
| Hidden entirely | Leaderboard, profile, settings | Separate tabs |

2. **Copy established patterns** — TikTok/Reels taught users the gestures already; don't invent.
3. **Design at iPhone SE size (375×667pt)** — if it fits there, it scales up. Never the reverse.

### Feed screen (the core screen)

```
┌──────────────────────────┐
│ Latest Top Trending •4U  │ ← compact pills, translucent, over video
│                          │
│                          │
│     VIDEO (full-bleed)   │
│                          │
│               ┌────────┐ │
│               │ ♥ 12k  │ │ ← right action rail
│               │ 💬 340 │ │   like / comment /
│               │ ★ Rate │ │   rate / share
│               │ ↗      │ │
│               └────────┘ │
│ @dancer · Studio Name    │ ← 2-line info stack
│ Challenge · ♪ Song…      │   (ticker rotates city)
│ #hook #urban +6          │ ← collapsed tag row, tap expands
│ ▁▁▁▁▁▁▁▁▂▁▁▁             │ ← thin progress bar
│ [Feed] [Battles] [Rank] [Profile] │ ← bottom tab bar
└──────────────────────────┘
```

- Sort tabs: translucent pills floating over video (desktop sidebar does NOT port).
- Rating sliders NEVER live on the main screen — they'd eat ~40% of it. `Rate` → bottom sheet with challenge sliders + submit.
- Comments → draggable bottom sheet (`@gorhom/bottom-sheet`); preset pills are thumb-friendly as-is.
- Tags/info stack: tap expands caption area in place (TikTok pattern).

### Gestures (define explicitly or they conflict)

| Gesture | Action |
|---|---|
| Vertical swipe | Next/prev video |
| Double-tap | Like (web backlog item — ship day one) |
| Single tap | Pause/play |
| Tap ♥ icon | Like |
| Horizontal swipe | Reserved (nothing) |

### Sub-challenge battle card

Already a full-slide split A/B — maps ~1:1 from `SubChallengeCard.jsx`. Vote buttons move above the safe-area inset.

```
┌──────────────────────────┐
│ ⚔ HOOK BATTLE · ends 23h │
├──────────────────────────┤
│   VIDEO A (muted loop)   │
│   @studioA               │
│           VS             │
│   VIDEO B (muted loop)   │
│   @studioB               │
├──────────────────────────┤
│ Which hook is stronger?  │
│ [   Vote A   ][ Vote B ] │
└──────────────────────────┘
```

After vote: locked — chosen side gets overlay + "Voted" badge, live counts (same behavior as web).

### Leaderboard

Vertical scroll replaces the desktop podium grid; Best Hook badge card sits above the list.

```
┌──────────────────────────┐
│ ← Leaderboard            │
│ [ Challenge selector ▾ ] │
│ ┌──────────────────────┐ │
│ │ 🔥 BEST HOOK · 78% WR │ │
│ │ Studio X · 12W–4L     │ │
│ └──────────────────────┘ │
│        🥇 @winner        │
│    🥈 @second  🥉 @third │
│ ──────────────────────── │
│ #4 @dancer · City · 4.6  │
│ #5 ...                   │
│ (current user highlighted)
└──────────────────────────┘
```

### Upload flow

Web's 4 steps compress to mobile-native flow with a step header + progress bar:

```
Step 1: Record in-app OR pick from camera roll
        (native picker — no custom UI)
Step 2: Preview + trim segment (hook window later)
Step 3: Details form — studioName, tags (max 10 pills)
Step 4: Review + submit → resumable upload progress %
```

- Background upload continues if user navigates away (native advantage).
- Large files → signed URLs / tus (Challenge 6).

### Small screens & safe areas (where apps feel cheap)

1. Safe areas everywhere via `react-native-safe-area-context` — notch/status bar top, home-indicator bottom; tab bar and action rail respect both.
2. Dynamic Type: OS font scaling for text (info stack), fixed-size controls so layout never breaks.
3. Portrait lock only — kills half the edge cases.
4. Test matrix minimum: iPhone SE (smallest), a Pro Max (largest), one small Android (e.g., Pixel 8a).

### Web → RN component mapping

| Web (`showgrid-landing/src`) | Mobile |
|---|---|
| `Discovered.jsx` overlay + sidebar | Full-bleed player + overlay + rails |
| Rating popup / sliders | `RateBottomSheet` |
| Comments drawer | `@gorhom/bottom-sheet` |
| Mobile bottom navbar | React Navigation bottom tabs (same 4 items) |
| `SubChallengeCard.jsx` | Near-direct port |
| `Leaderboard.jsx` podium | Scroll list + compact podium header |
| Upload steps 1–4 | Native picker → trim → form → submit |
