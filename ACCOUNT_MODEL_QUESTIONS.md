# Account Model: Studio vs User — Open Questions

> The dashboard has a Studio/Fan toggle, but the current codebase has **no concept of account type**. Everyone signs up via Clerk with the same flow. `studioName` is a field on `Submission`, not on `User`. There's no `role` field anywhere.

These questions need clear answers before building the stats API, dashboard wiring, or any role-based UI.

---

## Authentication & Signup

1. **How does a user choose their account type?** Is it a field during Clerk signup (e.g., "I'm a Studio" / "I'm a Fan")? Or is it determined later (first upload = studio)?

2. **Can an account be both?** Can a fan also upload? Can a studio also rate? Or are they mutually exclusive?

3. **Where is the account type stored?** On the Clerk user (via `publicMetadata`)? On the `User` model in MongoDB? Both?

4. **Does the signup flow change?** Currently: email → password → redirect to feed. Should it become: email → password → "Are you a Studio or a Fan?" → different onboarding?

---

## Studio Account

5. **What can a studio do that a fan can't?**
   - Upload videos? (currently anyone can)
   - Create challenges? (currently admin-only)
   - See dashboard with upload stats? (currently visible to all)

6. **What can a studio NOT do?**
   - Rate other videos? (you mentioned studios shouldn't see the Fan dashboard)
   - Comment? Vote in sub-challenges?

7. **Is `studioName` required for studio accounts?** Currently it's a free-text field during upload. Should it be a required profile field for studios?

8. **Can a studio have multiple members?** Or is one account = one studio = one person?

---

## User (Fan) Account

9. **What can a fan do that a studio can't?**
   - Rate videos? (currently anyone can)
   - Comment? Vote in sub-challenges?

10. **What can a fan NOT do?**
    - Upload? (you mentioned studios upload, fans rate)
    - See the Studio dashboard?

11. **Should the upload button be hidden for fan accounts?** Or shown but disabled with a message?

---

## Dashboard & UI

12. **The Dashboard Studio/Fan toggle** — should this only appear for studio accounts? Fan accounts just see the Fan view with no toggle?

13. **What stats does the Studio dashboard show?**
    - Videos uploaded (count)
    - Total views/impressions across their videos
    - Average rating across their videos
    - Leaderboard position
    - Challenge participation

14. **What stats does the Fan dashboard show?**
    - Ratings given (count)
    - Comments posted (count)
    - Battles voted in (count)
    - "Correct predictions" (if we track rating accuracy vs leaderboard outcome)

15. **Profile page** — does it look different for studios vs fans? Studios show their video grid; fans show their rating history?

---

## Backend Model Changes Needed

16. **User model** (`models/User.js`) — needs a `role` field? (`'studio'` | `'fan'`)? Currently only has `_id`, `trustScore`, `lastRateLimitedAt`.

17. **Submission model** — `studioName` is currently a free-text string on the submission. Should it be a reference to a `Studio` model instead?

18. **New model: Studio?** If studios are a first-class entity (with name, city, members, stats), we need a `Studio` model. If it's just a label on submissions, the current approach is fine.

---

## Migration

19. **Existing users** — everyone currently has the same permissions. How do we handle the transition? Force everyone to choose on next login? Default to fan?

20. **Existing submissions** — `studioName` is already on many submissions. If we create a Studio model, do we backfill?

---

## Priority

These questions block:
- Stats API (`GET /api/users/:id/stats`) — can't design the response without knowing what data each role sees
- Dashboard wiring — can't show the right stats without knowing which mode the user is in
- Upload restrictions — can't hide/disable upload without knowing the role model

**Read this doc, answer the questions (even partial answers help), and we'll unblock the next build.**
