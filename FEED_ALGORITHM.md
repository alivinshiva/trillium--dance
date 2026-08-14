# Feed Algorithm: Fair Play, Anti-Cheat, and "Hide Rated Videos" Design

> **Design doc ("why it works").** For the narrative (problems → journey → status) read `FEED_REPORT.md`; for the exact formulas, file map, and tunable knobs read `FEED_IMPLEMENTATION.md`.

## Goal

Two hard requirements for the trending/feed algorithm:

1. **Never reshow a video a user has already rated.**
2. **The algorithm must be fair and un-gameable** — it's the backbone of a competition platform where studios (not individuals) upload content. Any exploit is a cheat.

---

## Core Architectural Principle

> **The score decides the ranking (the competition verdict). The feed is just a delivery mechanism over that ranked pool.**

- **Score / Leaderboard:** global, identical for every viewer, manipulation-resistant. This is the *competition outcome*.
- **Feed:** pulls from the ranked pool, then applies per-viewer filters (hide rated) + diversity controls (freshness, studio cap, challenge rotation). Personalization must **never** touch the score itself, or studios can claim the competition is rigged per-viewer.

`ratedVideoIds` exclusion applies to the **feed only**, never to the Leaderboard page. The leaderboard is a public scoreboard; it must stay global.

---

## Requirement 1: Hide Already-Rated Videos

### Why this is easy (data already exists)

The rating system already stores every rating with a user identity:

- `VideoRating { videoId, userId, rating(1-5) }` with a **unique index** `{ videoId: 1, userId: 1 }` (`showgrid-be/models/Interaction.js:51`).
- A user has rated a video **if and only if** a `VideoRating` doc exists for `(userId, videoId)` — even if they later change their rating, the doc is updated, never deleted.

So "hide rated" = `_id NOT IN (user's rated videoIds)`. **No new schema needed.**

### Mechanism (query-time exclusion)

Add a `viewerId` query param to `GET /api/feed` (distinct from existing `userId`, which means "creator profile" at `showgrid-be/routes/feed.js:26`):

```js
// GET /api/feed?viewerId=u123&page=1&limit=10
if (viewerId) {
    const rated = await VideoRating.find({ userId: viewerId }).select('videoId').lean();
    filter._id = { $nin: rated.map(r => r.videoId) };
}
```

- Indexed on `{ videoId: 1, userId: 1 }` — the lookup is a single covered query per page.
- Correct with pagination: the filter applies **before** `skip/limit`, so rated videos never leak across pages.

### Session-cache caveat (important)

Because the feed is paginated, "videos I rated" must disappear on refresh. The client should:

1. Re-fetch the feed after **every successful rate** (invalidate the current feed so the rated video drops out immediately).
2. The server can cache an assembled per-viewer feed list (see Feed Assembly below) and invalidate it on rate.

### Extendability

The same mechanism extends to "hide viewed/skipped" later by writing a `VideoView` doc on display — phase 2, not required now.

---

## Re-Show Policy ("Publisher Boost") — the middle ground

> Hard-excluding *every* non-rated video after one showing kills engagement: user X saw video A once, got distracted, never rated it — and now A is dead for X even though it might be great. YouTube survives this by **pushing videos repeatedly** until the user acts. We play publisher too, but with a guardrail.

### Three interaction tiers per (viewer, video)

| Viewer's state with a video | Policy | Why |
|---|---|---|
| **Rated** it (explicit signal, up or down) | **Hard exclude forever** | Respect the explicit choice (Requirement 1) |
| **Viewed but never rated** (weak/no signal) | **Re-show, up to `K` times, with cooldown** | The "publisher boost" — a distracted user gets another chance |
| **Never seen** | **Show normally** | Fresh content flows |

### The re-show rules

```
K          = 3   (max total shows to the same viewer; tunable)
cooldown   = 48h (min gap between two shows of the same video to the same viewer)
```

- A `VideoView` doc records every serve: `{ videoId, userId, seenAt }`. Feed filter becomes:
  `exclude rated ids AND exclude videos where count(videoId, userId) >= K` — and re-show skips any video seen within the last `cooldown`.
- **Self-correcting:** every serve counts as an impression, so a video re-shown 3× to a user who ignores it has 3 impressions and ~0 engagement → its engagement *rate* collapses → it ranks lower everywhere. The algorithm can't inflate a video by over-showing it; over-showing is exactly what kills its rate. Same trade YouTube accepts.
- **No infinite dilution:** the `K` cap stops a video from being shown forever to an unresponsive user, so its rate isn't *unfairly* destroyed either — it just stops getting boosted.
- **Session freshness:** the cooldown guarantees a user never sees the same video twice in one session (that would feel like a bug).

### How YouTube counts impressions (the reference model)

YouTube Analytics defines an **impression as a thumbnail serve**: each time the video's thumbnail is shown in a visible feed (Home, Suggested, Search, etc.) it counts — the same video pushed on Home *and* again in the suggestions of another video counts as **two impressions**, even for the same viewer. YouTube does **not** dedupe by user. What makes this fair is that ranking uses **rates**, not raw counts:

```
impressions (serve count)  →  CTR = clicks / impressions   →  watch time  →  rank
```

We mirror that exactly: impressions are serve-counted, and our `engagementEff` is rate-based (Requirement 2). Because the feed controls how often a video is served, raw counts would just measure the algorithm's own favoritism; the *rate* measures the video. Answer to your question: yes, every push — home + suggestions + repeat pushes — is an impression, and the engagement *rate* (not the total) is what decides who wins.

> Note the tension this creates with our competition fairness goal: YouTube's model lets the algorithm over-expose popular videos (rich-get-richer). Our **rate-based scoring + `K` cap + freshness floor** deliberately counter that — a video gets a fair, finite number of chances with each user, then must win on per-impression quality.

---

## Requirement 2: Fair-Play Trending Score

### Threat model (what we're defending against)

| # | Attack | Outcome if unblocked |
|---|--------|----------------------|
| T1 | Studio creates fake accounts to 5★ their own video | Vote-stuffing tops the chart |
| T2 | Fake accounts 1★ rival studios | Sabotage kills competitors |
| T3 | Coordinated burst of likes/comments in 1 hour ("buy a spike") | Fake trending |
| T4 | Studio floods the feed with many uploads | Feed domination |
| T5 | Studio reverse-engineers formula, optimizes against the "answer key" | Arms race, unfair advantage |

### The score formula (v2: impression-normalized, time-independent verdict)

The earliest draft was `score = velocity × decay` (engagement ÷ hours since creation). Two flaws in that draft are fixed here:

1. Raw engagement counts reward **exposure, not quality** (rich-get-richer). Rank by **engagement rate per impression** instead.
2. The `engagement / hours_since_creation` denominator means a 1-hour-old video with 3 likes beats a 5-day video with 100 likes. **Remove the time denominator from scoring entirely** — time-fairness is handled by the verdict/trending split below.

```
# new field: VideoAggregate.impressions  (incremented on feed serve, deduped per viewer)

wilsonRating    = wilson_lower_bound(ratingCount, ratingAverage)          // blocks T1, T2
rateLikes       = likes    / max(impressions, 1)                          // engagement RATE
rateComments    = comments / max(impressions, 1)                          // engagement RATE
rateShares      = shares   / max(impressions, 1)                          // engagement RATE
engagementEff   = log1p(rateLikes) + 1.5·log1p(rateComments) + 3·log1p(rateShares)
exposureTrust   = log1p(impressions)                                      // counters tiny-sample noise
decay           = 1 / (1 + ageHours/24)^1.5                               // recency, DISCOVERY only
boost           = 1 + log1p(engagementEff / studioAvgEngEff30d)           // small-studio protection

score = wilsonRating × engagementEff × exposureTrust × decay × boost
        (0 if ratingCount < minRatings)
```

Each term kills a specific attack:

- **`wilsonRating`** — the *lower bound of the 95% confidence interval*, not the raw average. A video with 2 fake 5★ ratings has a huge confidence interval → a very low lower bound → can't rank. It must accumulate many *real* votes to climb. (Same technique Reddit uses for comments; Evan Miller's article is the canonical reference.) Because Wilson works on **proportions**, it also protects the impression-based rates below from small-sample noise.
- **Engagement rates, not raw counts** — `rateLikes/rateComments/rateShares` are *per impression*. A video shown 5× with 40 likes (8 likes/show) now beats one shown 100× with 70 likes (0.7/show). Raw counts would reward the over-exposed video. This kills the rich-get-richer loop: the algorithm controls impressions, so raw engagement just measures how much the algorithm *already* favored a video.
- **`exposureTrust`** — pure rates favor a 1-impression 1-like video (100% rate = meaningless). `log1p(impressions)` scales the rate by how much evidence we have. Balances "don't reward noise" vs "don't reward exposure."
- **`minRatings` (e.g., 5)** — videos below the threshold are **ineligible** for trending/leaderboard entirely (still visible in Latest). Combined with Wilson, a studio needs a large fake account farm to matter, which dramatically raises detection risk. Keep it modest so late-challenge uploaders aren't locked out.
- **`log1p(...)` scaling** — log transforms cap the power of raw counts. A 1000-like video is only ~3× a 10-like video, not 100×. Small studios stay competitive (Reddit/HN both do this).
- **`boost`** — *beat-your-own-average*: normalize a video's engagement efficiency against its studio's 30-day average. A dominant studio gets `boost ≈ 1` (they're near their baseline); an unknown studio that produces a hit gets a large boost. This is the single most effective small-studio/fairness lever.
- **`maxScoreCeiling`** (optional) — a hard cap so no single video can mathematically crowd out everything else.

#### Worked example (your original numbers, corrected)

> Both videos must obey the hard rule **engagement ≤ impressions** (a video can't earn more likes than times it was shown — that was the old example's bug). A's impression count is corrected 5→50; B is your original numbers unchanged. This shows the algorithm's *honest* behavior: per-impression quality is near-identical here, so the popular video rightly wins — but by far less than its exposure advantage.

Video A (new upload): 50 impressions, 40 likes, 20 comments, 8 shares → rates **0.80 / 0.40 / 0.16**
Video B (popular video): 100 impressions, 70 likes, 40 comments, 20 shares → rates **0.70 / 0.40 / 0.20**

```
A: engagementEff = log1p(0.80) + 1.5·log1p(0.40) + 3·log1p(0.16) = 0.59 + 0.50 + 0.45 = 1.54
B: engagementEff = log1p(0.70) + 1.5·log1p(0.40) + 3·log1p(0.20) = 0.53 + 0.50 + 0.55 = 1.58

exposureTrust: A = log1p(50) = 3.93   |   B = log1p(100) = 4.62
```

A and B are nearly equal per impression (eff 1.54 vs 1.58), so the race comes down to exposure — **B wins overall** (1.58×4.62 = 7.30 vs 1.54×3.93 = 6.05). But note the margin: B has 2× the exposure yet wins by only ~21%, because `exposureTrust` is a log, not a multiplier — a 2× exposure advantage adds just 1.17× to the score. Raw counts would have crowned B by 1.75× (70 likes vs 40). So: when quality is *close*, popularity decides; when quality is genuinely better, it wins (the earlier lesson). Popularity can't bury a better video.

### Time fairness: early vs late uploaders

**Two rules, split by concern:**

1. **Leaderboard = the competition verdict → time-independent.** It sorts by `wilsonRating` (average + confidence + minRatings). No engagement, no age. Uploading early earns more ratings → more *confidence*, but the average is not inflated by time — that's legitimate earned advantage, not a penalty. A late uploader wins if their average is genuinely higher; they just need enough votes to clear the Wilson bar (hence a modest `minRatings`, ~5).
2. **Trending = discovery → recency decay is a feature, not a bug.** The decay term `1/(1+age/24)^1.5` applies identically to every video relative to *its own* upload time — equal treatment, no bias. New content surfacing is exactly what discovery is for. Trending is **not** the competition verdict, so a late uploader getting a short recency window doesn't rig the competition.

The old draft's `engagement / hours_since_creation` was the real offender (rewards recency *and* raw exposure simultaneously). v2 removes the time denominator entirely; recency lives only in the `decay` term, quality lives only in `wilsonRating`, and efficiency lives only in the impression rates. Early and late uploaders are now compared on the same axes.

Optional stricter rule (not recommended for v1): within a single challenge, base decay on **challenge start** rather than upload time, so all challengers share an identical elapsed window. Skip unless a specific challenge shows an abuse pattern.

### Trust-weighted votes (implemented)

Wilson assumes ratings are honest. The next tier of defense (Google's `Leas` / lockstep detection, at your scale a simple version) weights each rating by rater trust:

```
trust(user) = f(accountAge, interactionCount, agreementWithConsensus)
```

- A brand-new account's rating counts ~0.2; a long-history rater whose votes match the community consensus counts ~1.0.
- **Weighted aggregation:** `weightedCount = Σ trust(user)`, `weightedAverage = Σ (rating · trust) / weightedCount` — these replace the raw count/average inside `wilson()` only. The **raw** rating count still gates eligibility (a ring still enters trending, but at floor score, where it can't rank).
- **Agreement** = fraction of the user's ratings within ±1 of each video's average (crowd consensus), computed in the worker via `$lookup` on `VideoRatingAggregate`.
- **Account age** is proxied by the user's first rating `createdAt` when the `User` doc was created by upsert (`models/User.js`, `routes/interactions.js` on `/rate`). The 10-min worker (`syncUserTrust`) backfills and refreshes all raters every cycle.
- **Rate-limit hits persist** to `User.lastRateLimitedAt` (fire-and-forget from `utils/rateLimit.js`) — a future flag for lockstep detection. Currently informational only; `trust.flags` is reserved for it.
- Verified: 20 × trust-0.2 five-stars → `weightedCount=4` → wilson 3.04, vs 20 real votes → 4.36. Even 40 ring votes (weightedCount=8) still rank below 20 real votes (3.70 < 4.36).

### Exposure fairness (protects the ecosystem, not just scores)

From the earlier research findings:

1. **Freshness floor** — reserve ~25% of feed slots for uploads < 48h old, unconditionally. This is the TikTok "seed audience" principle: new content must get initial exposure regardless of score, or nothing new ever surfaces.
2. **Studio cap** — max 2 videos from one studio per 20 shown.
3. **Challenge rotation (implemented)** — `assembleFeed` groups the trending pool by challenge (fresh-first within each group) and round-robins: one candidate per challenge per pass. The freshest challenge leads; adjacent feed items can't be the same challenge; with C active challenges a single one is naturally bounded to ~1/C of the page. Single-challenge feeds fall back to plain score order.

### Operational rules (Kaggle / Reddit lessons)

- **Keep weights private.** Never expose score breakdowns to studios. Only show relative movement, never the formula or the term values. If studios can see the answer key, they optimize against it (T5).
- **Ghost-flag, don't announce.** When a manipulation pattern is detected, silently de-prioritize the accounts. Announcing detection teaches cheaters the rules.
- **Rate limiting** on interactions per user per hour (simple: cap likes/rates/comments at e.g. 120/hr per user). Cheap, kills most bot behavior.

---

## Performance: Precompute the Rank, Serve the Filter

### The split (industry-standard pattern)

> **Expensive ranking is done offline in batches. Serving does only lightweight per-user filtering over precomputed ranks.**

Everything that depends on the whole dataset (Wilson, engagement rates, decay, boost) becomes a **precomputed, indexed field**. Each request just reads the precomputed rank and applies cheap per-user filters. We never recompute the ranking per user request.

### Layer 1 — Worker: precompute (before the user opens the app)

- `workers/feedScores.js` — an in-process timer (`setInterval`, no new dependency) that runs every 10 min and recomputes two indexed fields for every approved submission:
  - `wilsonScore` — Wilson lower bound + minRatings gate (the **competition verdict** → leaderboard sort).
  - `feedScore` — the full trending score (what the feed sorts by).
- Reads only the two aggregate collections (`VideoAggregate`, `VideoRatingAggregate`) that are already maintained incrementally on every interaction (`interactions.js`). No scanning of raw ratings.
- **Full recompute, not incremental:** decay depends on continuous age, so incremental would go stale. A full pass over 50K docs is a few seconds in Mongo — trivial at our scale (Reddit does exactly this). Use `bulkWrite`.
- **Boot backfill:** on server start, if `feedScoreUpdatedAt` is stale (> 15 min), run the job once. This handles Render sleeping the instance — scores refresh when the app wakes.
- Later lever (only if a full pass gets slow): recompute only submissions whose aggregates changed, and store the non-decay component separately so decay can be applied at read time.

### Layer 2 — Feed route: serve (on-the-go, but cheap)

```
GET /api/feed?viewerId=...&page=1&limit=10
1. ratedIds   = VideoRating.find({ userId: viewerId })              // indexed, covered
2. seenIds    = VideoView where seenCount >= K or within cooldown   // indexed
3. pool       = Submission.find({ status:'approved',
                                  feedScore:{$gt:0},
                                  _id:{$nin:[...ratedIds], $nin:[...seenIds]} })
                    .sort({ feedScore: -1 }).limit(window)          // INDEXED sort
4. assemble   = in-memory: freshness floor + studio cap + challenge rotation
5. page       = slice of assembled list + pagination metadata
```

Steps 1–2 are single indexed lookups. Step 3 is the only "query" and it's an indexed sort (O(log n) + returned rows). Step 4 is in-memory over ≤ 100 rows. Total ≈ 5–15 ms — **no per-user computation, no per-user cache needed.**

### Caching (v1: none per-user; later: top-pool only)

- **No per-viewer cache in v1.** The rated/seen exclusions are applied fresh per request via indexed `$nin`, so "rated video disappears immediately" works with **zero invalidation logic** — nothing to invalidate.
- **Optional single-object cache:** the *global* ranked pool (top 500) in one in-memory variable, refreshed on the 10-min recompute. One object, ~0 memory, makes step 3 a memory read.
- **Redis only when multi-instance:** if we later run 2+ API instances, move that one cache into Redis (one key, 10-min TTL). Nothing else changes.

### Should this be a separate service? (No — not yet)

| Factor | Monolith + in-process worker (now) | Separate feed service |
|---|---|---|
| Deploy | 1 app (already on Render) | 2 services, 2 envs, new API boundary |
| Latency | 0 extra (in-process) | +1 network hop per feed call |
| Score freshness | same | same |
| When to switch | — | Feed query CPU spikes, 2+ API instances, or worker blocks requests |

Rule: **keep it a module, not a process.** `workers/feedScores.js` is self-contained and decoupled from request handling. When the day comes (CPU contention or multiple instances), running it as a separate process is a one-line script change (`npm run worker`), zero logic changes.

### How other platforms do it (and what to copy)

| Platform | Ranking | Serving |
|---|---|---|
| **Reddit** | Cron recomputes "hot" score, writes indexed field | Indexed sort. ← **COPY THIS** |
| Instagram | Separate feed-ranking service, offline pipeline | Push (fan-out) for small bases, pull (rank-on-read) for large; Redis caches |
| Twitter/X | Offline scoring, fan-out-on-write | Redis timeline service |
| YouTube/TikTok | Offline-trained ML rankers | Light candidate gen + real-time rerank, huge caches |

**Copy Reddit.** Our score is a closed-form formula over aggregates, not an ML model — exactly Reddit's shape. Instagram/Twitter's fan-out and TikTok/YouTube's ML are optimizations for 100M-user scale and complexity we don't have. Their one transferable idea is the **offline-rank / online-filter split**, which Layer 1/Layer 2 already implement.

---

## Feed Assembly (combining both requirements)

Server-side, per viewer:

```
1. RANK      score-ranked pool of eligible approved videos (minRatings met)   [global, cacheable]
2. FILTER    remove viewer's ratedVideoIds (viewerId)                          [Requirement 1]
3. ASSEMBLE  freshness floor (25% <48h) + studio cap (2/20) + challenge rotation  [Requirement 2]
4. PAGE      return limit-size slice with pagination metadata
```

Pagination caveat: assembly (3) is not a pure sort, so naive `skip/limit` breaks. Fix: fetch a **window** (e.g., `limit × 5`) from the indexed sort, assemble the diverse list in-memory, then slice. Pages stay consistent within the 10-min recompute window (scores are stable, order is stable); the re-show policy also tolerates a rare repeat across pages. No per-viewer cache needed.

---

## Cold Start (20 users, day one)

With ~20 users and ~30 approved videos, the two things that could kill the feed are a too-strict `minRatings` gate and tiny rating counts. How each concern is handled:

- **`minRatings` is scale-aware, not fixed.** A hard gate of 5 means *nothing* ranks when 20 users exist. Make it dynamic: `minRatings = min(5, max(2, round(activeRaters / 10)))` → gate = 2 at 20 users, reaches 5 at ~50 raters and stays. Anti-cheat holds (a studio must fake ~10% of *real* raters to matter), and the feed isn't starved.
- **Wilson handles tiny samples natively.** A video with 1–2 ratings gets a wide confidence interval → a conservative (low) score → it ranks, just not at the top. Nothing is excluded by Wilson itself; low-count videos are *shrink-wrapped*, not hidden.
- **Latest tab always works.** Chronological, no gate, no score — it's the guaranteed-content tab for cold start.
- **Freshness floor + re-show policy keep the pool alive.** The 25% freshness floor guarantees recent uploads surface; the re-show policy (K=3, cooldown 24h) means with few videos, users re-see content after the cooldown — which *regenerates* the feed without new uploads and drives the ratings the scores need.
- **Graceful emptiness.** If the eligible pool is smaller than the page, the route returns what exists with `hasMore: false` — never a broken/empty state mid-feed.

> With 20 users, the platform looks mostly like **Latest + freshness + re-show**, with trending gradually taking over as ratings accumulate. That's correct — a trending score with 20 data points is noise; the algorithm's job at cold start is to *collect* ratings, not to be precise.

---

## Content Drought (long challenges, all uploads at once)

A 4-week challenge where every studio uploads in week 1 means zero new *uploads* in weeks 2–4. The score can't fix that — it ranks what exists. Layers of defense, weakest to strongest:

1. **Re-show policy** — users re-see (and re-engage) content after the 24h cooldown, up to K=3. Extends the feed's useful life without new content.
2. **Re-engagement boost** — a video that gets new likes/comments/ratings late in its life sees its engagement *rate* rise → it re-ranks. Old content that keeps getting discussed stays visible (this is what Reddit's decay+velocity does).
3. **Challenge structure** — stagger upload deadlines (rolling phases: "Open Hook Week", "Full Routine Week", "Showcase Week"), or use short rolling challenges instead of one long one. Product lever, not an algorithm one.
4. **Generated content (sub-challenges)** — the real fix, below. Pairings of existing videos are *infinite supply*: no upload needed, engagement keeps flowing, and it's a short decision loop that keeps users on the app between uploads.

---

## Sub-Challenges (implemented): generated content that never runs dry

Your hook-vs-hook idea is the strongest anti-drought lever because it converts *existing* uploads into a **new, self-generating content type**.

### Concept
Same challenge, two studios, one narrow question: **"Which hook (opening N seconds) is better?"** Users pick A or B. A 5-second decision, O(n²) possible pairings — the feed can generate matchups endlessly from the videos it already has.

### Why it works for engagement + fairness
- **Infinite supply:** every pair of videos in a challenge is a new matchup. No drought ever.
- **Micro-stickiness:** the A/B decision loop keeps users engaged during upload dry spells — it's the "short take" that prevents boredom between long videos.
- **Fair competition:** both studios compete on the *same* measure (hook of the same challenge); pair similar-scoring videos so it's never a mismatch.
- **Scoped, not competing with the main score:** sub-challenge results do **not** touch the main `feedScore`/leaderboard (keeps the official competition clean). They feed a separate "Best Hook" studio badge = bragging rights = more engagement.

### Data model
```
SubChallenge {
  _id, challengeId,
  type: 'hook' | 'transition' | 'ending' | ...,
  videoAId, videoBId,            // never A === B (studio)
  segmentA: { startSec, endSec }, segmentB: { startSec, endSec },  // v1: first 8s
  status: 'active' | 'closed',
  winnerId, createdAt, endsAt
}
SubChallengeVote { subChallengeId, userId, choice: 'A' | 'B', createdAt }
  → unique index (subChallengeId, userId); aggregates votesA/votesB
```

### Pairing rules (fairness + freshness)
- Same challenge only; pair videos with **similar wilson score** (`|wilson − wilson| ≤ 0.8` in `workers/subChallenges.js`).
- Both videos must be **proven**: `wilsonScore > 0` (already cleared the minRatings gate) so voters have a real signal.
- Don't pair the same studio against itself; rotate `type` (hook/transition/ending) to avoid monotony; max **3 concurrent battles per video**; never re-pair an existing active matchup.
- Track which matchups a viewer has already voted on (`SubChallengeVote`), exclude them from that viewer's future feeds — the same "already-engaged" rule as Requirement 1.
- Segment defaults to the first 8 seconds in v1 (frontend plays the muted looped hook); later let studios define their hook window at upload time.

### Feed integration
Sub-challenge cards are a **generated item type** in Feed Assembly — the server marks `item.type = 'sub_challenge'` and interleaves ~1 per 10 slots (like YouTube interleaves Shorts). They do **not** consume studio-cap or freshness-floor slots; they're an interleave, not a rank. Scoring them is separate (win-rate + vote volume), not part of the video ranking.

### What's built (v1)
1. `SubChallenge` + `SubChallengeVote` models (`models/SubChallenge.js`, `models/Interaction.js`) — unique index on `(subChallengeId, userId)`.
2. `workers/subChallenges.js` — 10-min worker: **closes** battles on 20 votes OR 48h (majority wins, ties discarded), then **generates** new pairs (same challenge, both `wilsonScore > 0`, `|wilson − wilson| ≤ 0.8`, never same studio, max 3 concurrent battles per video, no duplicate active pairs, hook/transition/ending type rotation).
3. `routes/subChallenges.js` — `GET /next` (active unvoted, oldest first, per-viewer) + `POST /vote` (rate-limited, idempotent).
4. Feed interleave in `routes/feed.js` — ~1 sub-challenge card per 10 trending slots (page-offset skips so cards rotate across pages); cards don't consume studio-cap/freshness-floor slots and never block the video feed.
5. Frontend — `SubChallengeCard.jsx` full-slide A/B player (muted looped previews, vote → locked results with live counts), guarded `Discovered.jsx` so video-only effects/overlays skip sub-challenge slides.
6. **"Best Hook" badge** — `GET /sub-challenges/best-hook` ranks studios from closed battles by `hookScore = winRate · log1p(battles)` (0 below 3 battles, so a 2-win fluke can't win); badge card rendered on the leaderboard page alongside the podium.

---

## "For You" personalized feed (delivery-layer personalization)

**Principle holds:** `feedScore` is global and manipulation-resistant; personalization happens only in the delivery layer as an **additive reorder of the scored pool** — a video can only be pulled *up*, never invented, and the boost is multiplicative on top of the real score.

- **Signal:** tag affinity from explicit positive interactions — ratings ≥ 4★ (weight `rating − 2`), likes (1), shares (2, strongest intent). Each interacted video maps to its challenge's `tags`; tag weights accumulate.
- **Score:** `personalized = feedScore × (1 + AFFINITY_BOOST × overlap)` where `overlap` = fraction of the video's challenge tags the user has shown affinity for (`AFFINITY_BOOST` default 0.5). Tiebreak `createdAt` desc.
- **Window:** top `limit × 6` scored candidates (deeper than trending's ×3 so relevant-but-lower videos can surface).
- **Guards kept:** same eligibility (approved, not-viewed, not-rated via `buildViewerExclusions`), studio cap (2), sub-challenge interleave, `recordServe` impressions.
- **Cold start:** no affinity profile (or signed out) → falls back to plain trending; the tab is shown only to signed-in users.
- **Anti-cheat:** affinity comes from explicit positive signals only; views/impressions don't feed it, so serve-flooding can't personalize your feed.

### What's built (v1)
1. `buildTagAffinity(viewerId)` in `routes/feed.js` — parallel rating/like/share queries → submission → challenge tags → weighted `Map<tag, weight>`.
2. `rankForYou(windowSubs, affinity, limitNum)` — pure/exported reorder (overlap boost + studio cap + score tiebreak).
3. `GET /api/feed?sort=for_you&viewerId=` — `for_you` falls back to `trending` when no viewer; window `limit×6`.
4. Frontend — "For You" sort tab in `Discovered.jsx` (desktop sidebar + mobile top tabs), rendered only when signed in.

---

## API & Schema Changes

| File | Change |
|------|--------|
| `showgrid-be/models/Submission.js` | **Add `feedScore`, `wilsonScore`, `feedScoreUpdatedAt`** (all indexed) |
| `showgrid-be/utils/feedScore.js` | **CREATE** — pure `wilson()` + `computeScore()` functions |
| `showgrid-be/workers/feedScores.js` | **CREATE** — 10-min recompute job + boot backfill, `bulkWrite` |
| `showgrid-be/server.js` | Start worker (idempotent guard) |
| `showgrid-be/routes/feed.js` | Add `viewerId` param → `$nin` filters (rated + re-show cap); `sort=trending` → indexed `feedScore` sort; **increment `impressions` per serve**; in-memory assembly (freshness floor + studio cap + challenge rotation) |
| `showgrid-be/routes/submissions.js` | Leaderboard pipeline → indexed `wilsonScore` sort (time/exposure-independent verdict) |
| `showgrid-be/routes/interactions.js` | Add per-user interaction rate limit; (future) write view events |
| `showgrid-be/models/Interaction.js` | **Add `impressions` to `VideoAggregate`** (default 0, incremented per feed serve); **add `VideoView { videoId, userId, seenAt }`** for re-show cap + cooldown (indexed `{ userId: 1, videoId: 1 }`); trust fields |
| `showgrid-landing/src/context/VideoContext.jsx` | Pass `viewerId` to `/api/feed`; re-fetch feed after rate |
| `showgrid-landing/src/components/Discovered.jsx` | Keep `viewerId` in feed fetch; no other UI change |

---

## Implementation Plan (ordered, one commit each)

> **Phase A = correct + no perf risk at current scale. Phase B = the precompute worker. Phase C = hardening.**
> This is the **algorithm** plan. The full product journey (feed endpoint, polling removal, notifications, comments, lazy loading — with commits) is in `FEED_REPORT.md` → Part 2. All items below are done.

### Phase A: behavior
- [x] **1. Add `viewerId` rated-video exclusion** to `/api/feed` (query-time `$nin`). Test: rate a video → refresh feed → video gone, not re-fetched across pages.
- [x] **2. Add `impressions` tracking** to `VideoAggregate`; increment once per serve (YouTube model, no user dedup) so rates below are meaningful.
- [x] **3. Add re-show policy:** `VideoView` collection, `K`-cap + `cooldown` filter (exclude rated AND seen ≥ K AND seen within cooldown).
- [x] **10. Client:** pass `viewerId` to `/api/feed` (done as part of Phase A so the feature is live end-to-end).

### Phase B: precompute worker (the performance answer)
- [x] **4. Schema:** add `feedScore`, `wilsonScore`, `feedScoreUpdatedAt` (indexed) to `Submission`.
- [x] **5. `utils/feedScore.js`:** pure `wilson()` + `computeScore()` (unit-testable, no deps).
- [x] **6. `workers/feedScores.js`:** 10-min recompute job (all approved, reads aggregates only, `bulkWrite`) + boot backfill if stale.
- [x] **7. Start worker from `server.js`** (kept decoupled, one-line script to extract later).
- [x] **8. `sort=trending`** → indexed `feedScore` sort; `sort=top_rated` → `wilsonScore` sort; **leaderboard** → indexed `wilsonScore` sort (time-independent verdict), `$match wilsonScore > 0` gate.

### Phase C: hardening
- [x] **9. Feed assembly:** **freshness floor + studio cap + challenge round-robin implemented** in `assembleFeed()` (window-fetch, in-memory, no per-viewer cache, deterministic within a worker window). Fresh-floor subs lead their challenge group; each pass pops one candidate per challenge so a single challenge can't dominate or sit adjacent to itself.
- [x] **11. Rate limiting** on interactions — `utils/rateLimit.js` (120 actions/hr/user, env `INTERACTION_RATE_LIMIT`, in-memory, 429 on exceed), applied to like/rate/comment/share.
- [x] **12. User model + trust-weighted votes** — `models/User.js`, `utils/trust.js` (`computeTrust`), worker `syncUserTrust` + weighted aggregation feeding `wilson()`; rate upsert on `/rate`; rate-limit hits persisted as a reserved flag.
- [x] **13. "For You" personalized feed** — `sort=for_you` reorders the scored pool by tag affinity (additive boost, score untouched); cold-start falls back to trending; signed-in tab in `Discovered.jsx`.

### Scale triggers (defer all until needed)
- Feed query consistently > 100 ms → add global top-pool in-memory cache.
- 2+ API instances → move that one cache to Redis.
- Worker CPU contention / blocks requests → run `workers/feedScores.js` as a separate process (`npm run worker`) — already decoupled, one-line script change.
- Full recompute pass too slow (way past 50K subs) → incremental recompute + Redis.

---

## Open Questions (need your call)

1. **`minRatings` threshold** — **RESOLVED: dynamic.** `min(5, max(2, round(activeRaters / 10)))` so cold start isn't starved but the anti-cheat gate still caps at 5. Confirm the ratio.
2. **Wilson vs. Bayesian average** — Wilson (needs only count+avg, no prior) vs. Bayesian (mean-regularized, smoother, slightly more code). Recommend Wilson for simplicity.
3. **`studioAvgVelocity30d` window** — 30 days OK, or use all-time to stabilize early on?
4. **Hide "viewed" too?** — **RESOLVED by Re-Show Policy:** viewed-but-not-rated videos are *re-shown* (K=3, 48h cooldown), not hidden. Only rated videos are hard-excluded. If a "skip" signal is added later, treat it like a rating (hard exclude).
5. **Should the freshness floor also apply to the Leaderboard tab**, or only the feed? (Recommend: only feed — leaderboard stays score-pure.)
6. **Impression dedup policy** — **RESOLVED: serve-counted** (YouTube model), no user dedup. Re-show cap + cooldown (defaults `K=3`, 48h) are the guardrails — tune them to taste.
