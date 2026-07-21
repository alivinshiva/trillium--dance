# Discovery Feed: Current Logic, Limitations & Improvement Plan

## Current Architecture

```
[MongoDB] --GET /api/submissions--> [VideoContext: all submissions, polled every 10s]
    --> getApprovedVideos() [client-side filter: status === 'approved']
        --> Discovered.jsx [index-based, one video at a time, TikTok-style]
```

### Backend (`showgrid-be`)

**`GET /api/submissions`** (`routes/submissions.js:75`)
- Returns ALL submissions (pending, approved, rejected) sorted by `createdAt: -1`
- No pagination, no server-side status filtering
- Optional query params: `userId`, `challengeId`
- Populates `challengeId` with full Challenge document

**`GET /api/submissions/leaderboard`** (`routes/submissions.js:12`)
- Joins with `videoratingaggregates` via aggregation pipeline
- Sorts by `averageRating: -1, ratingCount: -1, createdAt: -1`
- Only used by the Leaderboard page, not the feed

### Frontend (`showgrid-landing`)

**`VideoContext.jsx`** (data layer)
- Fetches ALL submissions on mount: `GET ${API_URL}/submissions`
- Polls every 10 seconds for new submissions
- Stores everything in React state (`videos`)
- `getApprovedVideos()` is just: `videos.filter(v => v.status === 'approved')`

**`Discovered.jsx`** (feed UI, 740 lines)
- Calls `getApprovedVideos()` on mount, stores in local state
- Displays one video at a time using `currentIndex` as pointer
- Navigation: touch swipe (mobile) / mouse wheel (desktop, 800ms cooldown)
- URL updates to `/discovered/feed/${currentVideo._id}`
- Per-video data loaded on change: `GET /api/interactions/video/:id`
- Rating system: 3 parameter sliders -> weighted average -> `POST /api/interactions/rate`

---

## Limitations

### 1. No Algorithm / Purely Chronological
- Feed is sorted by `createdAt: -1` (newest first) only
- No trending, no popularity signal, no personalization
- High-quality content gets buried as new submissions come in
- No way for users to discover older but great content

### 2. No Pagination (Full DB Dump)
- `GET /api/submissions` returns every single submission
- 10-second polling re-fetches the entire dataset each time
- As the platform grows, this becomes a serious performance bottleneck
- Network waste: most users only see 5-10 videos per session

### 3. Client-Side Status Filtering
- Server returns pending/rejected/approved mixed together
- Filtering happens in `getApprovedVideos()` after the full payload arrives
- Wasted bandwidth and processing for content users will never see

### 4. No Content Diversity Controls
- No challenge-based rotation
- No geographic/studio diversity
- No creator frequency capping (same creator can dominate consecutive slots)
- No "freshness vs quality" balance

### 5. No Engagement Signals in Feed Ranking
- Likes, ratings, comments, shares are fetched per-video AFTER display
- These signals are not used to influence what comes next
- No velocity tracking (likes per hour) to identify trending content

### 6. Comment System Duplication
- Comments exist in TWO places:
  - Embedded `Submission.comments[]` array (used by feed)
  - Separate `VideoComment` collection (via interactions routes, unused by frontend)
- Data inconsistency risk, confusing architecture

### 7. No Caching Layer
- Every request hits MongoDB directly
- No Redis or in-memory cache for hot data (trending videos, aggregates)
- Aggregate counts recalculated on every interaction

### 8. Single Feed, No Tabs
- Instagram has: For You, Following, Explore
- ShowGrid has: one chronological feed
- No way to filter by challenge, category, or popularity

---

## Improvement Plan

### Phase 1: Server-Side Feed (Quick Wins)

#### 1a. Dedicated `/api/feed` Endpoint with Pagination
Create a new endpoint that replaces the raw submissions dump:

```js
// GET /api/feed?page=1&limit=10&challengeId=xxx&sort=trending
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, sort = 'latest', challengeId } = req.query;
    const skip = (page - 1) * limit;

    let sortQuery = {};
    if (sort === 'latest') sortQuery = { createdAt: -1 };
    if (sort === 'top_rated') sortQuery = { averageRating: -1 };
    if (sort === 'trending') sortQuery = { score: -1 }; // Phase 2

    const filter = { status: 'approved' };
    if (challengeId) filter.challengeId = challengeId;

    const submissions = await Submission.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('challengeId');

    const total = await Submission.countDocuments(filter);

    res.json({
        data: submissions,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});
```

#### 1b. Server-Side Filtering
- Filter `status: 'approved'` at the DB level (not client-side)
- Add `challengeId` filter support
- Add `sort` parameter: `latest`, `top_rated`

#### 1c. Frontend Infinite Scroll
Replace the current "load all + index" model with infinite scroll:

```jsx
// In VideoContext.jsx
const [feedVideos, setFeedVideos] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const fetchFeed = async (pageNum = 1) => {
    const res = await fetch(`${API_URL}/feed?page=${pageNum}&limit=10&sort=latest`);
    const { data, pagination } = await res.json();
    if (pageNum === 1) setFeedVideos(data);
    else setFeedVideos(prev => [...prev, ...data]);
    setHasMore(pageNum < pagination.pages);
};
```

#### 1d. Remove 10s Polling
- Replace with on-demand fetch (pull-to-refresh or page focus)
- Or reduce to 60s+ if real-time feel is needed

---

### Phase 2: Trending Algorithm

#### 2a. Score Calculation
Add a `feedScore` field to submissions, calculated periodically:

```js
// Score = (engagement_velocity) * recency_decay
// 
// engagement_velocity = (likes * 1 + ratings * 2 + comments * 1.5 + shares * 3) / hours_since_creation
// recency_decay = 1 / (1 + hours_since_creation / 24)^1.5
//
// This ensures:
// - New content gets a boost (velocity is high when denominator is small)
// - Old content fades unless it keeps getting engagement
// - Shares are weighted highest (intent to distribute)
```

#### 2b. Background Worker (Cron or BullMQ)
```js
// Every hour, recalculate scores for all approved submissions
const updateFeedScores = async () => {
    const submissions = await Submission.find({ status: 'approved' });
    for (const sub of submissions) {
        const age = (Date.now() - sub.createdAt) / (1000 * 60 * 60); // hours
        const agg = await VideoAggregate.findById(sub._id);
        const velocity = (agg.likes + agg.comments * 1.5 + agg.shares * 3) / Math.max(age, 1);
        const decay = 1 / Math.pow(1 + age / 24, 1.5);
        sub.feedScore = velocity * decay;
        await sub.save();
    }
};
```

#### 2c. Add `feedScore` to Submission Schema
```js
// models/Submission.js
feedScore: { type: Number, default: 0, index: true }
```

---

### Phase 3: Feed Diversity & Personalization

#### 3a. Creator Frequency Cap
Prevent the same creator from appearing 2+ times in the top 20 results:

```js
// In the feed query logic
const recentCreatorIds = [];
const diverseResults = [];
for (const video of rawResults) {
    if (recentCreatorIds.filter(id => id === video.userId).length < 2) {
        diverseResults.push(video);
        recentCreatorIds.push(video.userId);
    }
    if (diverseResults.length >= limit) break;
}
```

#### 3b. Challenge Rotation
- Group videos by challenge, rotate which challenge leads
- Prevent one challenge from dominating the feed
- Allow users to filter by challenge (already possible with `challengeId` param)

#### 3c. "For You" vs "Latest" vs "Top" Tabs
```
/discovered           -->  "For You" (algorithmic, Phase 2)
/discovered/latest    -->  "Latest"  (chronological)  
/discovered/top       -->  "Top"     (by average rating)
/discovered/feed/:id  -->  Direct link to specific video
```

#### 3d. Geographic Diversity
- Boost content from underrepresented cities/studios
- "Discover your city" filter option

---

### Phase 4: Caching & Performance

#### 4a. Redis Caching
```js
// Cache the top 100 feed results for 5 minutes
const getFeed = async (params) => {
    const cacheKey = `feed:${params.sort}:${params.challengeId || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await computeFeed(params);
    await redis.setex(cacheKey, 300, JSON.stringify(results));
    return results;
};
```

#### 4b. Aggregate Pre-computation
- Update `VideoAggregate` in real-time (already done via interactions routes)
- Use MongoDB Change Streams or pre-computed fields for feed scoring

#### 4c. Lazy Video Loading
- Only load video metadata in the feed response
- Load `videoUrl` only when the video is 1-2 positions away from current
- Pre-load next video while current plays

---

### Phase 5: Comment System Consolidation

#### 5a. Unify Comments
- Remove the embedded `Submission.comments[]` array
- Use only the `VideoComment` collection
- Update the feed to fetch comments on-demand (already partially done via interactions)

#### 5b. Comment Pagination
- Paginate comments (20 per load)
- Show count in feed UI, load more on tap

---

## Priority Order

| Phase | Effort | Impact | Do First? |
|-------|--------|--------|-----------|
| 1a-1c: Server-side feed + pagination | Low | High | YES |
| 1d: Remove polling | Low | Medium | YES |
| 2a-2c: Trending score | Medium | High | YES |
| 3a: Creator cap | Low | Medium | After Phase 1 |
| 3b: Challenge rotation | Low | Medium | After Phase 1 |
| 3c: Feed tabs | Medium | High | After Phase 2 |
| 4a: Redis caching | Medium | Medium | After Phase 2 |
| 5a-5b: Comment consolidation | Medium | Low | When convenient |

---

## Quick Wins (Implement Today)

1. **Create `GET /api/feed`** with `status: 'approved'` filter + pagination
2. **Remove the 10-second polling** from `VideoContext`
3. **Add `sort` query param** to allow `latest` and `top_rated`
4. **Frontend**: switch `Discovered.jsx` to use the new `/api/feed` endpoint with page-based loading
