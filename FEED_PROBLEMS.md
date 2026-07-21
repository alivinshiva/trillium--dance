# Discovery Feed: Problems & Their Impact

## Current Flow (Simplified)

```
User opens Feed
  → App downloads ALL videos from DB
  → Filters to "approved" on client
  → Shows one video at a time (TikTok style)
  → Every 10 seconds, re-downloads EVERYTHING
```

---

## Problem 1: No Smart Feed Sorting

**What's wrong:** Videos are shown in order of when they were uploaded. Newest first, always.

**User impact:** A dancer who uploaded 100 great videos last month is now invisible. Only today's uploads show up. Users keep seeing low-effort recent content while missing the best performances.

**Importance:** HIGH - This is the core reason users will stop scrolling. If the feed feels stale or random, they leave.

---

## Problem 2: Everything Downloads at Once

**What's wrong:** When a user opens the feed, the app fetches every single video in the database. No pagination. No lazy loading.

**User impact:** Slow load times, especially on mobile or poor connections. Battery drain. Data waste. As the platform grows to thousands of videos, this becomes unusable.

**Importance:** HIGH - Directly affects load speed and mobile experience. Breaks at scale.

---

## Problem 3: 10-Second Refresh Loop

**What's wrong:** The app re-downloads the entire video library every 10 seconds in the background.

**User impact:** Constant network usage even when the user isn't scrolling. Wastes mobile data. Drains battery. No real benefit since new videos take time to get approved anyway.

**Importance:** MEDIUM - Users on WiFi won't notice much. Mobile users will feel it in their data plan and battery.

---

## Problem 4: No Feed Variety

**What's wrong:** Same creator's videos can appear back-to-back. No challenge-based rotation. No geographic diversity.

**User impact:** If Studio X submits 20 videos, the user might see 15 in a row from the same studio. Gets boring fast. Feels like scrolling one person's profile, not a community feed.

**Importance:** MEDIUM - Causes "feed fatigue." Users stop scrolling when content feels repetitive.

---

## Problem 5: No Discovery Filters

**What's wrong:** One feed, no tabs. Users can't choose to see "Top Rated" or "Latest" or filter by challenge.

**User impact:** A user who wants to see the best dance videos has no way to find them. A user who wants to see only hip-hop content can't filter for it. Everyone gets the same undifferentiated stream.

**Importance:** MEDIUM - Limits engagement. Power users who want specific content leave frustrated.

---

## Problem 6: Rejected Videos Reach the Client

**What's wrong:** The server sends ALL videos (pending, rejected, approved) to the frontend. Filtering to approved happens on the user's device.

**User impact:** Brief flash of unapproved content during load. Security concern: client receives content that should be private. Wasted bandwidth sending rejected submissions.

**Importance:** LOW - Mostly a hidden issue. Users might see a brief flash of pending content. Primarily a security and efficiency concern.

---

## Problem 7: No "What's Trending" Signal

**What's wrong:** There's no metric tracking which videos are getting momentum. Likes, ratings, and shares exist but aren't used to rank the feed.

**User impact:** A video with 500 likes and 100 comments is buried under a video uploaded 2 minutes ago with 0 engagement. Users can't discover what's popular in the community.

**Importance:** HIGH - Social proof drives engagement. Without trending, the feed feels lifeless and disconnected from the community.

---

## Summary: Priority Matrix

| Problem | User Pain | Fix Effort | Priority |
|---------|-----------|------------|----------|
| No smart sorting | Users miss best content | Medium | 1 |
| Everything downloads at once | Slow, wasteful | Low | 2 |
| No trending signal | Can't find popular content | Medium | 3 |
| 10s refresh loop | Battery/data drain | Low | 4 |
| No feed variety | Boring, repetitive | Low | 5 |
| No filters | No control over experience | Medium | 6 |
| Rejected videos sent to client | Minor flash/leak | Low | 7 |

---

## The One-Line Fix

> **Replace "dump everything sorted by date" with "serve paginated, algorithm-ranked content per request."**

That single change fixes Problems 1, 2, 6, and partially 7. The rest are follow-up improvements.
