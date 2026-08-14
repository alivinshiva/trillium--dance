# Feed Improvement: Step-by-Step Execution Plan

## Rules
1. One problem at a time
2. Each change is a separate commit (easy to revert)
3. Test after each step
4. Don't break existing functionality

---

## Step 1: Create `/api/feed` Endpoint with Pagination
**Problem fixed:** Everything downloads at once (#2), Rejected videos sent to client (#6)
**Status:** COMPLETED

### What was done:
- [x] Added `GET /api/feed` route in `showgrid-be/routes/feed.js`
- [x] Filter `status: 'approved'` at DB level
- [x] Added pagination: `?page=1&limit=10`
- [x] Support `?challengeId=xxx` filter
- [x] Support `?sort=latest|top_rated|oldest`
- [x] Mounted route in `showgrid-be/server.js`
- [x] Kept existing `GET /api/submissions` running (admin still needs it)

### Files created/modified:
- CREATED: `showgrid-be/routes/feed.js`
- MODIFIED: `showgrid-be/server.js` (added route)
- NO CHANGE: `showgrid-be/routes/submissions.js` (left untouched)

---

## Step 2: Remove 10-Second Polling
**Problem fixed:** 10s refresh loop (#3)
**Status:** COMPLETED

### What was done:
- [x] Removed `setInterval` from `VideoContext.jsx`
- [x] Added `fetchVideos()` function for manual refresh
- [x] Added window focus listener to re-fetch when user returns to tab

### Files modified:
- MODIFIED: `showgrid-landing/src/context/VideoContext.jsx`

---

## Step 3: Update Frontend to Use New Feed API
**Problem fixed:** Everything downloads at once (#2), Enables future improvements
**Status:** COMPLETED

### What was done:
- [x] Created `fetchFeed()` function in VideoContext
- [x] Added `feedPage`, `hasMore`, `feedLoading`, `feedSort` state
- [x] Updated `Discovered.jsx` to use feed data with pagination
- [x] Added infinite scroll (loads more when near end of feed)
- [x] Kept `getApprovedVideos()` for backward compatibility (other pages may use it)

### Files modified:
- MODIFIED: `showgrid-landing/src/context/VideoContext.jsx`
- MODIFIED: `showgrid-landing/src/components/Discovered.jsx`

---

## Step 4: Add Feed Sorting Tabs
**Problem fixed:** No discovery filters (#5), No feed variety (#4)
**Status:** COMPLETED

### What was done:
- [x] Added sort tabs to Discovered.jsx: "Latest" | "Top"
- [x] Tabs positioned in desktop sidebar (bottom) and mobile (top center)
- [x] Passes `sort` param to `/api/feed`
- [x] Resets feed when sort changes
- [x] Added loading indicator for "Loading more..."
- [x] Added "You've reached the end" indicator
- [x] Styled tabs to match existing UI (mobile-friendly)

### Files modified:
- MODIFIED: `showgrid-landing/src/components/Discovered.jsx`

---

## Step 5: Add Trending Score to Submissions
**Problem fixed:** No trending signal (#7)
**Status:** PENDING

### What to do:
- [ ] Add `feedScore` field to Submission schema
- [ ] Create `utils/feedScore.js` calculation function
- [ ] Update score after each interaction (like, rate, comment, share)
- [ ] Add `?sort=trending` to `/api/feed` using `feedScore`
- [ ] Backfill existing submissions with initial scores

### Files to create/modify:
- CREATE: `showgrid-be/utils/feedScore.js`
- MODIFY: `showgrid-be/models/Submission.js`
- MODIFY: `showgrid-be/routes/interactions.js` (update score on interaction)
- MODIFY: `showgrid-be/routes/feed.js` (add trending sort)

---

## Step 6: Add Creator Frequency Cap
**Problem fixed:** No feed variety (#4)
**Status:** PENDING

### What to do:
- [ ] In feed query, limit same creator to max 2 videos in top 20
- [ ] Server-side implementation in `/api/feed`
- [ ] Apply only when no `userId` filter is active

### Files to modify:
- MODIFY: `showgrid-be/routes/feed.js`

---

## Step 7: Comment System Consolidation
**Problem fixed:** Comment duplication (bonus cleanup)
**Status:** DONE

### What to do:
- [x] Remove embedded `comments[]` from Submission model
- [x] Use only `VideoComment` collection
- [x] Update feed to fetch comments on-demand
- [x] Update frontend to use interactions comments API

### Files to modify:
- MODIFY: `showgrid-be/models/Submission.js`
- MODIFY: `showgrid-be/routes/submissions.js`
- MODIFY: `showgrid-landing/src/components/Discovered.jsx`

---

## Git Strategy

After each step, commit with clear message:
```
git add -A
git commit -m "feed: [step description]"
```

Examples:
- `git commit -m "feed: add /api/feed endpoint with pagination"`
- `git commit -m "feed: remove 10s polling, add manual refresh"`
- `git commit -m "feed: switch Discovered to use /api/feed"`

To revert if something breaks:
```
git revert HEAD          # undo last step
git log --oneline -10    # find good commit
git reset --hard <commit>  # go back to specific step
```

---

## Current Progress

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create `/api/feed` with pagination | PENDING |
| 2 | Remove 10s polling | PENDING |
| 3 | Frontend uses new feed API | PENDING |
| 4 | Add sort tabs (Latest/Top/For You) | PENDING |
| 5 | Add trending score | PENDING |
| 6 | Creator frequency cap | PENDING |
| 7 | Comment consolidation | PENDING |
