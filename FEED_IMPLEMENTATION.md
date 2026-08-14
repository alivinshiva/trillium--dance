# Feed Implementation Reference (Trending + Ranking)

Reference for the implemented feed algorithm — what each file does, the exact formulas, and where to change every knob. Update this doc whenever you tweak the algorithm.

---

## File Map

### `showgrid-be/utils/feedScore.js` — pure scoring math (no DB access)
| Export | Purpose |
|--------|---------|
| `wilson(count, average, z=1.96)` | Wilson lower bound for a 1–5 rating scale, rescaled to 1–5. Anti-vote-stuffing. |
| `dynamicMinRatings(activeRaters)` | Scale-aware eligibility gate. |
| `recencyDecay(ageHours)` | Recency decay multiplier. |
| `computeEngagementEff({likes, comments, shares, impressions})` | Per-impression engagement rate, log-scaled and weighted. |
| `computeScore({...})` | Full `feedScore` + `wilsonScore` for one submission. Returns `{ score, wilsonScore, engagementEff }`. |

### `showgrid-be/workers/feedScores.js` — the recompute worker
- `syncUserTrust()` — refreshes `User.trust` for every rater (account age proxied by first rating, rating history, agreement with crowd consensus) and upserts missing `User` docs. Runs once per pass.
- `getWeightedRatings()` — `weightedCount = Σ trust`, `weightedAverage = Σ(rating·trust)/weightedCount` per video (a 20-account 5★ ring counts as ~4 weighted votes, not 20).
- `computeAllScores()` — one full pass: reads approved submissions + `VideoAggregate` + `VideoRatingAggregate`, syncs trust, computes weighted ratings + studio baselines, applies the minRatings gate (raw count), writes `feedScore`/`wilsonScore`/`feedScoreUpdatedAt` via `bulkWrite`.
- `startFeedScoreWorker()` — boot backfill (if scores stale > 15 min) + `setInterval` every 10 min. Started from `server.js`. Decoupled so it can be extracted to a separate process later.

### `showgrid-be/routes/feed.js` — the feed endpoint (`GET /api/feed`)
| Piece | Purpose |
|-------|---------|
| `buildViewerExclusions(viewerId)` | Video IDs to hide for a viewer: rated ones + past re-show limits. |
| `recordServe(submissions, viewerId)` | +1 `impressions` per serve + writes a `VideoView` per viewer. |
| `assembleFeed(windowSubs, freshSubs, limitNum)` | Freshness floor (25% slots for <48h uploads) + studio cap (2 per studio) + **challenge round-robin** (groups by challenge, pops one per pass, so no challenge dominates or sits adjacent to itself). Deterministic within a worker window. |
| Route | Sorts: `latest` (createdAt), `oldest`, `top_rated` (wilsonScore), `trending` (feedScore + assembly). Trending assembly only applies when no `userId` filter. |

### `showgrid-be/routes/submissions.js` — leaderboard (the competition verdict)
Aggregation pipeline: `$lookup` ratingStats → `$addFields` `averageRating/ratingCount/wilsonScore` → `$match wilsonScore > 0` → `$sort wilsonScore:-1, averageRating:-1, ratingCount:-1, createdAt:-1` → `$limit`. Time- and exposure-independent.

### Schema additions
- `showgrid-be/models/Submission.js` — fields `feedScore`, `wilsonScore`, `feedScoreUpdatedAt`; indexes `{ feedScore: -1, createdAt: -1 }`, `{ wilsonScore: -1, createdAt: -1 }`.
- `showgrid-be/models/Interaction.js` — `VideoView { videoId, userId, seenAt }` (indexes on `{ userId, videoId }` and `{ userId, seenAt: -1 }`); `VideoAggregate.impressions`.
- `showgrid-be/models/User.js` — `_id` = Clerk userId; `trust { score, accountAge, history, agreement, flags }`; `stats.*`; `lastRateLimitedAt`. Index on `trust.score`. Upserted on `/rate` (`routes/interactions.js`) and by `syncUserTrust`.

### `showgrid-be/utils/trust.js` — pure trust math (no DB access)
`computeTrust({ accountAgeDays, ratingCount, agreement })` → `{ score, accountAge, history, agreement }`. Weights: age 0.35, history 0.35, agreement 0.3; floor `TRUST_FLOOR` (0.2). Constants: `AGE_FULL_DAYS` 30, `HISTORY_FULL` 20.

### `showgrid-be/server.js` — starts `startFeedScoreWorker()` after Mongo connects.

### `showgrid-be/utils/rateLimit.js` — in-memory interaction rate limiter (120 actions/hr/user, 429 on exceed). Applied to like/rate/comment/share in `routes/interactions.js`. On 429 it fire-and-forgets `User.lastRateLimitedAt` (reserved trust flag). Env: `INTERACTION_RATE_LIMIT`. Single-instance only — swap for Redis when running 2+ API instances.

### `showgrid-landing/src/context/VideoContext.jsx` — `fetchFeed` appends `viewerId: user.id`.
### `showgrid-landing/src/components/Discovered.jsx` — sort tabs: Latest | Top | Trending.
### `showgrid-landing/src/components/SubChallengeCard.jsx` — full-slide A/B battle card (muted looped previews, vote → locked live results).

---

## Sub-Challenges (A/B hook battles)

### `showgrid-be/models/SubChallenge.js` — `{ challengeId, type, videoAId, videoBId, segmentA/B, status: active|closed, votesA, votesB, winnerId, endsAt }`; indexes on `{status, endsAt}` and `{status, videoAId/BId}`.

### `showgrid-be/models/Interaction.js` — `SubChallengeVote { subChallengeId, userId, choice: A|B }` with **unique** index `{subChallengeId, userId}` (idempotent votes).

### `showgrid-be/workers/subChallenges.js` — 10-min worker (started from `server.js`):
- `closeExpired()` — closes active battles on **20 votes OR 48h** (majority wins; ties → no winner).
- `generatePairs()` / `buildPairs()` (pure) — new pairs: same challenge, both `wilsonScore > 0`, `|wilson − wilson| ≤ 0.8`, never same studio, max 3 concurrent battles per video, no duplicate active pairs, type rotation `hook → transition → ending`.
- Knobs: `VOTE_THRESHOLD` 20, `CHALLENGE_LIFETIME_MS` 48h, `SCORE_PARITY` 0.8, `CONCURRENT_CAP_PER_VIDEO` 3, `NEW_PAIRS_PER_RUN` 10.

### `showgrid-be/routes/subChallenges.js`
- `GET /next?userId=&challengeId=&limit=&skip=` — active, unvoted battles, oldest first.
- `POST /vote` — rate-limited, idempotent (unique index); returns `{ votesA, votesB, choice, alreadyVoted }`.

### Feed interleave (`routes/feed.js`)
- `getUnvotedSubChallenges()` + `interleaveSubChallenges()` — ~1 card per 10 trending slots; page-offset skip rotates cards across pages; cards are `{ type: 'sub_challenge', subChallenge }` and don't touch studio-cap/freshness-floor/recordServe.

---

## Formulas (exactly as implemented)

### Engagement efficiency (per impression, log-scaled, weighted)
```
imp       = max(impressions, 1)
eff       = log1p(likes/imp)  +  1.5 · log1p(comments/imp)  +  3 · log1p(shares/imp)
```
Shares weigh most (intent to distribute), comments next, likes least.

### Wilson lower bound (rating quality, anti vote-stuffing)
```
p      = clamp((average − 1) / 4, 0, 1)      // map 1..5 stars -> 0..1
n      = ratingCount
z      = 1.96                                // 95% confidence
denom  = 1 + z²/n
center = p + z²/(2n)
margin = z · sqrt( p(1−p)/n + z²/(4n²) )
lower  = (center − margin) / denom
wilson = 1 + clamp(lower, 0, 1) · 4          // map back to 1..5
```
Few ratings → wide interval → low lower bound → can't top the chart on fake votes.

### Rater trust (weighted votes)
```
accountAge   = clamp01(accountAgeDays / 30)          // proxied by first rating if User doc was upserted
history      = clamp01(ratingCount / 20)
agreement    = clamp01(#ratings within ±1 of video avg / ratingCount)
trust        = clamp01(0.35·accountAge + 0.35·history + 0.3·agreement), floored at 0.2
```

### Trust-weighted Wilson (wilsonScore & wilson term of feedScore)
```
weightedCount   = Σ trust(user) over all ratings
weightedAverage = Σ (rating · trust) / weightedCount
wilson          = wilson(weightedCount, weightedAverage)     // same formula as above
```
Raw `ratingCount` still gates eligibility and feeds display stats; only the wilson term is weighted. Verified: 20 × trust-0.2 5★ votes → `weightedCount=4` → wilson 3.04, below 20 real votes → 4.36; even 40 ring votes (3.70) lose to 20 real ones.

### Recency decay
```
decay = 1 / (1 + ageHours / 24)^1.5          // ageHours = hours since upload
```

### Studio boost (small-studio protection: beat your own average)
```
studioBaseline = mean eff of the studio's uploads in the last 30 days   (by studioName || userId)
globalBaseline = mean eff across all studios in the last 30 days        (fallback when studio has no history)
boost = studioBaseline > 0 ? 1 + log1p(eff / studioBaseline) : 1
```

### Exposure trust (counters tiny-sample noise)
```
exposureTrust = log1p(max(impressions, 1))
```

### Final scores
```
feedScore    = wilson · eff · exposureTrust · decay · boost
wilsonScore  = wilson                                    // leaderboard = rating quality only

IF ratingCount < minRatings:  feedScore = 0, wilsonScore = 0   (ineligible)
```

### Dynamic eligibility gate
```
minRatings = min(5, max(2, round(activeRaters / 10)))
activeRaters = count of distinct users who have ever rated
```

---

## All Tunable Knobs (where to change)

| Knob | Default | Location |
|------|---------|----------|
| Re-show cap `K` | 3 | `RE_SHOW_CAP` env, or `routes/feed.js:12` |
| Re-show cooldown | 24 h | `RE_SHOW_COOLDOWN_HOURS` env, or `routes/feed.js:13` |
| Freshness floor window | 48 h | `FRESH_WINDOW_MS`, `routes/feed.js:16` |
| Freshness floor share | 25% of page | `assembleFeed`, `routes/feed.js:93` |
| Studio cap | 2 per studio | `STUDIO_CAP`, `routes/feed.js:17` |
| Recency decay shape | 24 h half-life, power 1.5 | `DECAY_HOURS`, `DECAY_EXP`, `utils/feedScore.js:6-7` |
| Engagement weights | likes 1, comments 1.5, shares 3 | `computeEngagementEff`, `utils/feedScore.js:36` |
| Wilson confidence | z = 1.96 | `wilson()`, `utils/feedScore.js:16` |
| Min-ratings gate | `min(5, max(2, round(raters/10)))` | `MIN_RATINGS_CAP/FLOOR`, `RATINGS_DIVISOR`, `utils/feedScore.js:9-11` |
| Studio baseline window | 30 days | `BASELINE_WINDOW_MS`, `workers/feedScores.js:13` |
| Recompute interval | 10 min | `RECOMPUTE_INTERVAL_MS`, `workers/feedScores.js:10` |
| Boot backfill staleness | 15 min | `STALE_AFTER_MS`, `workers/feedScores.js:11` |
| Interaction rate limit | 120 actions/hr/user | `INTERACTION_RATE_LIMIT` env, or `utils/rateLimit.js:5` |
| Trust floor | 0.2 | `TRUST_FLOOR`, `utils/trust.js` |
| Trust age ramp | 30 days to full credit | `AGE_FULL_DAYS`, `utils/trust.js` |
| Trust history ramp | 20 ratings to full credit | `HISTORY_FULL`, `utils/trust.js` |
| Trust weights | age .35 / history .35 / agreement .3 | `W_AGE`/`W_HISTORY`/`W_AGREEMENT`, `utils/trust.js` |
| Agreement window | ±1 star | `AGREEMENT_WINDOW`, `workers/feedScores.js` |
| Trending assembly window | `limit × 3` | `routes/feed.js:143` |
| Challenge rotation | round-robin, 1/pass per challenge | `assembleFeed`, `routes/feed.js:76` |

---

## Data Flow (end to end)

```
[user scrolls feed]
   GET /api/feed?viewerId=X&sort=trending
      1. buildViewerExclusions(X)      rated ids + seen≥3 + seen<24h
      2. trending window (feedScore:-1) + fresh pool (<48h)
      3. assembleFeed: 25% fresh floor -> challenge round-robin -> studio cap 2
      4. recordServe: impressions+1 per served video, VideoView per viewer

[worker, every 10 min]
   computeAllScores()
      syncUserTrust: rating groups + agreement -> trust per user (upsert missing User docs)
      getWeightedRatings: weightedCount/weightedAverage per video
      aggregates -> eff per video -> studio baselines (30d) -> activeRaters
      -> minRatings gate (raw count) -> bulkWrite feedScore/wilsonScore/feedScoreUpdatedAt

[leaderboard]
   GET /api/submissions/leaderboard
      wilsonScore:-1 (0s excluded) -> the competition verdict
```

---

## Change Examples (to prove the doc is enough)

- **Make trending reward comments more:** raise `1.5` → `2` in `computeEngagementEff` (`utils/feedScore.js`).
- **Show each video to a viewer more times:** raise `RE_SHOW_CAP` (`routes/feed.js`) or via env.
- **Let more fresh content surface:** raise the 25% floor or the 48 h window.
- **Tighter competition gate:** raise `MIN_RATINGS_CAP` (e.g., 10) — note it slows small-studio entry.
- **Fresher scores:** lower `RECOMPUTE_INTERVAL_MS` (each run is a full pass; keep ≥ 5 min).

- **Weaken vote-stuffing further:** lower `TRUST_FLOOR`, raise `HISTORY_FULL` (need more history for full trust), or bump the agreement weight.

Not implemented yet (see FEED_ALGORITHM.md): `VideoView`-based "hide viewed", "Best Hook" studio badge on the leaderboard.
