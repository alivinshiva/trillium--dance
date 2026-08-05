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
- `computeAllScores()` — one full pass: reads approved submissions + `VideoAggregate` + `VideoRatingAggregate`, computes studio baselines, applies the minRatings gate, writes `feedScore`/`wilsonScore`/`feedScoreUpdatedAt` via `bulkWrite`.
- `startFeedScoreWorker()` — boot backfill (if scores stale > 15 min) + `setInterval` every 10 min. Started from `server.js`. Decoupled so it can be extracted to a separate process later.

### `showgrid-be/routes/feed.js` — the feed endpoint (`GET /api/feed`)
| Piece | Purpose |
|-------|---------|
| `buildViewerExclusions(viewerId)` | Video IDs to hide for a viewer: rated ones + past re-show limits. |
| `recordServe(submissions, viewerId)` | +1 `impressions` per serve + writes a `VideoView` per viewer. |
| `assembleFeed(windowSubs, freshSubs, limitNum)` | Freshness floor (25% slots for <48h uploads) + studio cap (2 per studio). |
| Route | Sorts: `latest` (createdAt), `oldest`, `top_rated` (wilsonScore), `trending` (feedScore + assembly). Trending assembly only applies when no `userId` filter. |

### `showgrid-be/routes/submissions.js` — leaderboard (the competition verdict)
Aggregation pipeline: `$lookup` ratingStats → `$addFields` `averageRating/ratingCount/wilsonScore` → `$match wilsonScore > 0` → `$sort wilsonScore:-1, averageRating:-1, ratingCount:-1, createdAt:-1` → `$limit`. Time- and exposure-independent.

### Schema additions
- `showgrid-be/models/Submission.js` — fields `feedScore`, `wilsonScore`, `feedScoreUpdatedAt`; indexes `{ feedScore: -1, createdAt: -1 }`, `{ wilsonScore: -1, createdAt: -1 }`.
- `showgrid-be/models/Interaction.js` — `VideoView { videoId, userId, seenAt }` (indexes on `{ userId, videoId }` and `{ userId, seenAt: -1 }`); `VideoAggregate.impressions`.

### `showgrid-be/server.js` — starts `startFeedScoreWorker()` after Mongo connects.

### `showgrid-landing/src/context/VideoContext.jsx` — `fetchFeed` appends `viewerId: user.id`.

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
| Trending assembly window | `limit × 3` | `routes/feed.js:143` |

---

## Data Flow (end to end)

```
[user scrolls feed]
   GET /api/feed?viewerId=X&sort=trending
      1. buildViewerExclusions(X)      rated ids + seen≥3 + seen<24h
      2. trending window (feedScore:-1) + fresh pool (<48h)
      3. assembleFeed: 25% fresh floor, then score-ranked, studio cap 2
      4. recordServe: impressions+1 per served video, VideoView per viewer

[worker, every 10 min]
   computeAllScores()
      aggregates -> eff per video -> studio baselines (30d) -> activeRaters
      -> minRatings gate -> bulkWrite feedScore/wilsonScore/feedScoreUpdatedAt

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

Not implemented yet (see FEED_ALGORITHM.md): challenge rotation, interaction rate-limiting, trust-weighted votes, `VideoView`-based "hide viewed", sub-challenges.
