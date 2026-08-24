# Mobile Screens Spec — Inventory, Contents, Navigation

> Stage-1 design doc for the Expo app (see `MOBILE_APP_PLAN.md`). Defines every screen, what's in it, its states, its API calls, and how screens link. This is the checklist to build against — update it as reality teaches better answers.
>
> **Design rule of the project:** structure upfront (this doc), pixels on the go (build → screenshot on device → fix). Hi-fi mockups only where noted ★.

---

## Part 1: Navigation Architecture

```
ROOT STACK
├── Splash / AuthGate ──────────── routes to Auth or MainTabs based on Clerk session
├── AuthStack
│   ├── Sign In                   (Clerk hosted UI first)
│   └── Sign Up
├── MAIN TABS (5)
│   ├── 1 FeedTab      → FeedScreen            ★ hero screen
│   ├── 2 ChallengesTab→ ChallengesScreen
│   ├── 3 BattlesTab   → BattlesScreen → BattleViewScreen (push)
│   ├── 4 RankTab      → LeaderboardScreen
│   └── 5 ProfileTab   → ProfileScreen → SettingsScreen (push, later)
├── UploadStack (modal stack over tabs)
│   └── Step1 → Step2 → Step3 → Step4 → Done(→Feed)
└── GLOBAL MODALS / SHEETS (over any tab)
    ├── NotificationsPanel        (slide-over)
    ├── RateSheet                 (bottom sheet, Feed)
    ├── CommentsSheet             (bottom sheet, Feed)
    └── ShareSheet                (native OS sheet)
```

### Link map (how everything connects)

| From | Action | To |
|------|--------|----|
| AuthGate | signed out | Sign In |
| Sign In/Up | success | Feed |
| Feed | tab bar | any of 5 tabs |
| Feed | challenge name tap | Challenge Details |
| Feed | `★ Rate` | RateSheet |
| Feed | comment icon | CommentsSheet |
| Feed battle slide | vote / "see all" | BattlesTab |
| Challenges list | card tap | Challenge Details |
| Challenge Details | Upload CTA | Upload Step 1 (auth-gated) |
| Upload Step 4 | submit success | Feed (top of Latest, own video) |
| Battles list | battle card | Battle View |
| Leaderboard | studio row | Profile (public view, later) |
| Anywhere | bell icon | NotificationsPanel |
| Push notification | tap | deep link target (Part 4) |

---

## Part 2: Screen Inventory

| # | Screen | Type | Auth | Priority | Web equivalent |
|---|--------|------|------|----------|----------------|
| S01 | Splash / AuthGate | screen | no | P0 | — |
| S02 | Sign In / Sign Up | screen | no | P0 | `SignInPage.jsx` / `SignUpPage.jsx` |
| S03 | **Feed** ★ | full-screen swipe | no* | P0 | `Discovered.jsx` |
| S04 | RateSheet | bottom sheet | yes | P0 | rating sliders in `Discovered.jsx` |
| S05 | CommentsSheet | bottom sheet | yes | P0 | comments drawer |
| S06 | Battle Slide | feed state | no | P1 | `SubChallengeCard.jsx` |
| S07 | Battles List | screen | no | P1 | battles feed section |
| S08 | Battle View | screen | no | P1 | same component as S06 |
| S09 | Challenges List | screen | no | P1 | `Challenges.jsx` |
| S10 | Challenge Details | screen | no | P1 | `ChallengeDetails.jsx` |
| S11 | Upload Steps 1–4 ★ | modal stack | yes | P2 | `upload/*` |
| S12 | Leaderboard | screen | no | P1 | `Leaderboard.jsx` |
| S13 | Profile | screen | mixed | P2 | `Profile.jsx` |
| S14 | Notifications Panel | modal | yes | P2 | `NotificationPanel.jsx` |
| S15 | Settings | screen | yes | later | (disabled placeholder today) |

\* Feed is browsable signed-out (like web); For You tab and interactions require sign-in.

**Global state conventions** (apply to every screen, stated once):
- **Loading:** skeleton/spinner overlay; never blank white.
- **Empty:** friendly message + one action button (e.g., "No battles yet — check the feed").
- **Error:** inline retry banner; never crash. All API calls get timeout + one silent retry.
- **Offline:** persistent top banner "You're offline", cached content shown read-only.

---

## Part 3: Screen-by-Screen Specs

### S01 — Splash / AuthGate
- **Contents:** logo, silent session check (`@clerk/clerk-expo` token cache).
- **States:** has session → MainTabs; none → AuthStack (never shows a visible splash > 300ms).
- **API:** none.

### S02 — Sign In / Sign Up
- **Contents:** Clerk hosted UI (drop-in component). Logo header. Later: custom-branded screens.
- **Links:** success → Feed. No guest-blocking anywhere else (browse-first like web).
- **API:** Clerk handles all.

### S03 — Feed ★ hero
- **Contents:** vertical paging FlashList, 1 video per screen, muted-autoplay current only; sort pills (Latest/Top/Trending/For You — For You signed-in only); right rail (like+count, comment+count, rate, share); info stack (@user · studio, challenge · song/city ticker, collapsed tag row); progress bar; battle slides interleaved ~1/10 (S06); double-tap = like.
- **Data:** lazy URL prefetch window prev/current/+2 via `/submissions/urls`; feed metadata only (no videoUrl in list payload).
- **States:** end-of-feed indicator; pull-to-refresh resets to page 1; signed-out For You hidden.
- **API:** `GET /api/feed?page&limit=10&sort=&viewerId=` *(post-C1 hardening: identity from auth token)*; `GET /api/submissions/urls?ids=`; `POST /api/interactions/like`; `POST /api/interactions/rate` (S04).
- **Links:** challenge name → S10; rate → S04; comment → S05; share → native sheet.

### S04 — RateSheet
- **Contents:** challenge's `ratingParameters` sliders (1–5), live average preview, Submit button; debounced 1s auto-submit parity with web optional — v1: explicit Submit.
- **States:** already-rated → show submitted values, editable; submitting → spinner on button.
- **On submit:** invalidate + refetch feed so the rated video drops out (Requirement 1 parity).
- **API:** `POST /api/interactions/rate` `{ videoId, ratings }`.

### S05 — CommentsSheet
- **Contents:** draggable sheet; preset pill row (green/yellow/purple from challenge `presetComments`); list newest-first; long-press own comment → delete confirm.
- **States:** one-comment-per-user enforced server-side → composer hides after posting; empty state.
- **API:** `GET /api/interactions/comments/:videoId` (limit 20); `POST /api/interactions/comment`; `DELETE /api/interactions/comments/:commentId`.

### S06 — Battle Slide (inside Feed)
- **Contents:** split-screen A/B muted loops, VS divider, dynamic question by type (hook/transition/ending), Vote buttons above safe-area inset.
- **States:** pre-vote (both playable) → voted (chosen side overlay + badge, counts lock in, re-vote blocked); signed-out vote attempt → sign-in prompt sheet.
- **API:** `POST /api/sub-challenges/vote`.
- **Links:** "See all battles" → S07.

### S07 — Battles List
- **Contents:** active battles cards (A vs B thumbnails, question type, time left), oldest-unvoted first; segmented filter by challenge.
- **API:** `GET /api/sub-challenges/next?userId=&limit=&skip=`.
- **Links:** card → S08.

### S08 — Battle View
- **Contents:** same component as S06, full-screen standalone with back nav; closed battles show winner + final counts.
- **API:** same as S07/S06.

### S09 — Challenges List
- **Contents:** active challenge cards (cover, title, tag pills, countdown, participant count); past challenges section below.
- **API:** `GET /api/challenges`.
- **Links:** card → S10.

### S10 — Challenge Details
- **Contents:** hero media, description, tags, prize/winners section if any, leaderboard shortcut, prominent **Upload** CTA (hidden/diabled-signed-out → prompts auth), current user's submission status ("You've entered ✓").
- **API:** `GET /api/challenges/:id`; optional `GET /api/feed?challengeId=&sort=top_rated&limit=5` preview strip.
- **Links:** Upload CTA → S11; leaderboard shortcut → S12 (with challengeId).

### S11 — Upload Steps 1–4 ★ hi-fi design here
- **Flow:** Step1 record-in-app OR camera-roll pick (native pickers, zero custom chrome) → Step2 preview + trim → Step3 details form (studioName required, tags max 10 pills, challenge pinned from context) → Step4 review + submit with resumable progress %; background-upload continues if user leaves; success → Feed (Latest) with toast.
- **States:** interruption-safe (resume prompt), upload failure retry, oversized-file warning before start.
- **API:** multipart POST to submissions endpoint (multer-cloudinary); later: signed-URL/tus path (MOBILE_APP_PLAN Challenge 6).

### S12 — Leaderboard (Rank tab)
- **Contents:** challenge selector dropdown; Best Hook badge card (flame, W-L record, win rate); compact podium (1st center crown, 2nd, 3rd); scrollable ranked list (rank, dancer, city, score), current user highlighted; wilson-gated (`wilsonScore > 0`) like web.
- **API:** `GET /api/submissions/leaderboard?challengeId=`; `GET /api/sub-challenges/best-hook?challengeId=`.
- **Perf note:** client-caches last result per challenge (server TTL cache lands in hardening pass).

### S13 — Profile
- **Contents:** own profile — avatar, @handle, studio name, videos grid (tap → Feed pinned to that video), stats placeholders until account model resolves (`ACCOUNT_MODEL_QUESTIONS.md`); sign-out entry.
- **States:** signed-out visit → public profile lite (later; blocked by same account-model questions).
- **API:** `GET /api/feed?userId=&sort=latest` (creator profile mode, exists today).

### S14 — Notifications Panel
- **Contents:** slide-over list, unread dots, mark-read (single + bulk), SSE live-prepend while foregrounded; push covers backgrounded delivery (C2).
- **API:** seed `GET /api/notifications`; live `GET /api/notifications/stream` (SSE); mark-read endpoint as web.

### S15 — Settings (later)
- Account deletion (Apple-required — see hardening checklist), notification prefs, app version + force-update state from `GET /config`.

---

## Part 4: Deep Links & Push Routing

Scheme: `showgrid://` (+ universal links when domain is ready).

| URL | Target |
|-----|--------|
| `showgrid://feed/:videoId` | Feed pinned to video (web: `/discovered/feed/:id`) |
| `showgrid://challenges/:id` | Challenge Details |
| `showgrid://leaderboard/:challengeId` | Leaderboard filtered |
| `showgrid://battles/:subChallengeId` | Battle View |

Push payload contract: `{ deepLink, title, body }` — tap handler parses `deepLink` and navigates after auth gate resolves. Unknown link → Feed.

---

## Part 5: Build Order (maps to MOBILE_APP_PLAN Part 3)

1. S01, S02 (scaffold + auth)
2. **S03 + S04 + S05** (the hero loop: watch → rate → comment)
3. S06 (battle slide in feed)
4. S09, S10, S12 (browse surface: challenges, details, rank)
5. S07, S08 (battles tab)
6. S13, S14 (profile, notifications)
7. S11 (upload — needs resumable-upload decision first)
8. S15 (settings, deletion)

> Rule: each step ships usable value alone; nothing depends on something built later.
