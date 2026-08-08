# Golf Match Tracker — Frontend Design Specification

## 1. Overview

### 1.1 Purpose

Build a mobile-first web application for tracking friendly golf matches between a group of friends.

The application has two primary purposes:

1. **Public/dashboard experience**
   - Display the current player leaderboard ranked by ELO.
   - Allow users to explore individual player statistics.
   - Allow filtering and slicing historical performance by course, partner, opponent, match length, and other relevant dimensions.
   - Present the history of matches in a visually appealing and easy-to-understand way.

2. **Admin/data-entry experience**
   - Add and edit players.
   - Add and edit courses.
   - Record completed golf matches.
   - Edit and delete previously recorded matches.
   - Manage match participants and results.
   - Automatically update ELO ratings when matches are recorded.

The application is primarily intended for **mobile use**, although it should remain usable on desktop.

---

# 2. Product Principles

The application should follow these principles:

### Mobile first

The application should feel like a native mobile sports app rather than a desktop website squeezed onto a phone.

Prioritize:

- Large touch targets
- Minimal typing
- Bottom navigation
- Cards instead of dense tables
- Swipe-friendly layouts
- Sticky contextual actions
- Fast data entry

### Dashboard first

The leaderboard should be the first thing users see.

A user should be able to:

> Open app → immediately see who's #1.

### Stats should be exploratory

The player page should encourage users to answer questions such as:

- Who does David play best with?
- Who gives David the most trouble?
- What is David's record at Torrey Pines?
- How has David's ELO changed over time?
- Does David perform better over 9 or 18 holes?
- Who has David beaten most often?

### Data entry should be fast

Logging a match should take roughly 30–60 seconds.

The interface should avoid requiring users to navigate through multiple unrelated screens.

### No unnecessary complexity

This is a personal/friends application.

Do not introduce:

- User accounts
- Registration
- Password recovery
- Complex permissions systems
- Enterprise authentication
- Notifications
- Billing
- Multi-tenancy

The admin access code is intentionally simple.

---

# 3. Technology Stack

Recommended frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase JS client

Recommended supporting libraries:

- Recharts — charts
- Lucide React — icons
- Zod — client-side form validation
- date-fns — date formatting/manipulation

The application should communicate directly with Supabase.

```text
Browser
   │
   ├── React application
   │
   ├── Supabase JS client
   │
   └── Supabase PostgreSQL
```

No dedicated backend server is required for the initial version.

---

# 4. Application Structure

Recommended routes:

```text
/
├── /players/:playerId
│
├── /matches
│
├── /admin
│   ├── /players
│   ├── /courses
│   └── /matches
│
└── /admin/login
```

### Public routes

```text
/
 /players/:playerId
 /matches
```

### Admin routes

```text
/admin
/admin/players
/admin/courses
/admin/matches
```

All admin routes require the admin access code.

---

# 5. Navigation

## Mobile

Use a bottom navigation bar.

```text
┌────────────────────────────────────┐
│                                    │
│          Application content       │
│                                    │
│                                    │
├────────────────────────────────────┤
│  🏆       👤       ⛳       ⚙️     │
│ Rank     Players   Matches   Admin │
└────────────────────────────────────┘
```

Suggested navigation:

- **Leaderboard**
- **Players**
- **Matches**
- **Admin**

The leaderboard should be the default route.

The Admin tab should only appear after admin authentication.

---

# 6. Landing Page / Leaderboard

## Route

```text
/
```

## Purpose

The landing page is the centerpiece of the application.

It should immediately communicate:

- Who is currently #1?
- How many players participate?
- What are their ELO ratings?
- How are players performing?

---

## 6.1 Header

Example:

```text
┌────────────────────────────────────┐
│  ⛳ FAIRWAY                         │
│  Match Tracker                     │
└────────────────────────────────────┘
```

Keep branding minimal.

---

# 7. Leaderboard

Display players sorted by current ELO descending.

Example:

```text
┌────────────────────────────────────┐
│ CURRENT RANKINGS                   │
│                                    │
│ 🥇  David Larson             1642  │
│     38W · 17L · 2P                │
│                                    │
│ 🥈  Mike                       1587 │
│     31W · 23L · 3P                │
│                                    │
│ 🥉  Jesse                      1512 │
│     27W · 27L · 4P                │
│                                    │
│  4   Ben                        1421 │
│     19W · 35L · 4P                │
└────────────────────────────────────┘
```

Each player row is clickable.

Clicking opens:

```text
/players/:playerId
```

---

# 8. Player Leaderboard Information

Each leaderboard entry should display:

### Primary

- Rank
- Player name
- Current ELO

### Secondary

- Wins
- Losses
- Pushes
- Win percentage

### Optional

- ELO change over recent matches
- Peak ELO

For example:

```text
DAVID LARSON
1642 ELO

38 - 17 - 2
66.7% win rate

▲ +42 over last 10 matches
```

---

# 9. Leaderboard Visual Design

The top three players should receive special visual treatment.

### First place

Large highlighted card.

### Second / third

Slightly smaller cards.

### Remaining players

Compact list.

Potential layout:

```text
          🏆

       DAVID
       1642

   38 - 17 - 2

─────────────────

🥈 Mike       1587
🥉 Jesse      1512

4  Ben        1421
5  ...
```

The design should feel like a golf tournament leaderboard rather than an administrative data table.

---

# 10. Player Detail Page

## Route

```text
/players/:playerId
```

This should be one of the most feature-rich views in the application.

---

# 11. Player Header

Example:

```text
← Leaderboard

DAVID LARSON

#1
1642 ELO

▲ +42

38W · 17L · 2P
66.7% WIN RATE
```

Include:

- Current rank
- Current ELO
- Peak ELO
- Overall record
- Win percentage
- Recent ELO movement

---

# 12. ELO History Chart

Display a line chart showing ELO over time.

Example:

```text
1700 ┤
     │                       ╭─●
1650 ┤                  ╭────╯
     │             ╭────╯
1600 ┤        ╭────╯
     │   ╭────╯
1550 ┤───╯
     └────────────────────────────
       Jan  Mar  May  Jul  Aug
```

Allow:

- Last 10 matches
- Last 25 matches
- All time

Default:

> All time

---

# 13. Player Statistics

Display summary cards:

```text
┌──────────┐ ┌──────────┐
│ MATCHES  │ │ WIN RATE │
│    57    │ │  66.7%   │
└──────────┘ └──────────┘

┌──────────┐ ┌──────────┐
│ PEAK ELO │ │ ELO GAIN │
│   1687   │ │   +142   │
└──────────┘ └──────────┘
```

---

# 14. Player Filters

The player page should allow users to slice statistics.

Use a horizontally scrollable filter bar on mobile.

```text
[All] [Course] [Partner] [Opponent] [9/18 Holes]
```

Selecting a filter opens an appropriate selector.

---

# 15. Course Filter

Example:

```text
COURSE

All Courses
──────────────
Torrey Pines North
Torrey Pines South
Coronado
La Jolla
...
```

After selecting:

```text
Torrey Pines North

12 matches

9W · 3L · 0P
75.0% win rate
+86 ELO
```

---

# 16. Partner Filter

Only relevant for matches involving teams of two.

Example:

```text
PARTNER

All Partners
──────────────
Jesse
Mike
Ben
```

Selecting Jesse:

```text
DAVID + JESSE

14 matches

9W · 4L · 1P
67.9% win rate

Average starting team ELO
1512
```

---

# 17. Opponent Filter

Display players David has played against.

Example:

```text
OPPONENT

All Opponents
──────────────
Mike
Jesse
Ben
```

Selecting Mike:

```text
DAVID vs MIKE

18 matches

11W · 6L · 1P
61.1% win rate

ELO:
David +42
Mike -42
```

For 2v2 matches, the opponent filter should identify anyone who appeared on the opposing team.

---

# 18. Match Length Filter

Options:

```text
All
9 Holes
18 Holes
```

Example:

```text
18 HOLES

41 matches
28W · 11L · 2P
68.3%
```

---

# 19. Combined Filters

Filters should be combinable.

Example:

```text
Course: Torrey Pines North
Partner: Jesse
Length: 18 Holes
```

Result:

```text
12 matches

8W · 3L · 1P

66.7% win rate
```

Filters should update statistics dynamically.

Provide:

```text
Clear all
```

when filters are active.

---

# 20. Player Match History

At the bottom of the player page, display recent matches.

Example:

```text
RECENT MATCHES

Aug 6
Torrey Pines North · 18 holes

David + Jesse
vs
Mike + Ben

WIN
2&1
+18 ELO


Aug 2
Coronado · 9 holes

David
vs
Mike

LOSS
1UP
-14 ELO
```

Each match can be tapped to view match details.

---

# 21. Match Detail Page

Recommended route:

```text
/matches/:matchId
```

Although not strictly required for MVP, this is useful.

Example:

```text
TORREY PINES NORTH
August 6, 2026
18 HOLES

DAVID + JESSE
       2&1
MIKE + BEN

David   +18 ELO
Jesse   +18 ELO
Mike    -18 ELO
Ben     -18 ELO
```

Display:

- Date
- Course
- Hole count
- Teams
- Result
- Score
- ELO changes

Admin users should see:

```text
Edit Match
Delete Match
```

---

# 22. Match History Page

## Route

```text
/matches
```

Display all matches in reverse chronological order.

Example:

```text
MATCH HISTORY

Aug 6, 2026
Torrey Pines North · 18

David + Jesse
2&1
Mike + Ben


Aug 2, 2026
Coronado · 9

David
PUSH
Mike
```

Include filtering:

- Player
- Course
- Date
- 9/18 holes
- 1v1/2v2

---

# 23. Admin Authentication

Admin functionality should be protected by an access code.

The access code should be configurable through an environment variable.

Example:

```env
VITE_ADMIN_ACCESS_CODE=your-secret-code
```

Important:

A Vite environment variable beginning with `VITE_` is bundled into the client-side JavaScript.

Therefore this is **not a secure secret**.

The access code should be treated as:

> A convenience gate, not real authentication.

This is acceptable for the intended personal/friends use case, but should not be considered suitable for sensitive applications.

---

# 24. Admin Authentication Flow

When a user navigates to:

```text
/admin
```

and isn't authenticated:

```text
┌────────────────────────────────────┐
│                                    │
│           ADMIN ACCESS             │
│                                    │
│ Enter access code                  │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ ••••••••                       │ │
│ └────────────────────────────────┘ │
│                                    │
│        [ Continue ]                │
│                                    │
└────────────────────────────────────┘
```

On successful validation:

```text
localStorage.setItem(
    "golf_admin_authenticated",
    "true"
)
```

The application should then allow access to admin routes.

Provide:

```text
Sign out
```

which removes the local storage value.

---

# 25. Admin Dashboard

Route:

```text
/admin
```

Display:

```text
ADMIN

[ + Log Match ]

[ Players ]
Manage players

[ Courses ]
Manage courses

[ Match History ]
Edit/delete matches
```

The primary action should be:

> Log Match

---

# 26. Player Management

## Route

```text
/admin/players
```

Display:

```text
PLAYERS

David Larson      1642 ELO
Mike              1587 ELO
Jesse             1512 ELO
Ben               1421 ELO

        + Add Player
```

Actions:

- Add
- Edit
- Delete

Deleting a player should be prevented if they have historical matches.

Instead, the UI should explain:

> This player has historical matches and cannot be deleted.

A future implementation could support an `active` flag for hiding players from new matches.

---

# 27. Add Player

Form:

```text
ADD PLAYER

Name
┌──────────────────────────────┐
│ David Larson                 │
└──────────────────────────────┘

Starting ELO

1500

        [ Save Player ]
```

Default ELO:

```text
1500
```

The application should use the `elo_settings.initial_rating` value where possible rather than hardcoding 1500.

---

# 28. Course Management

## Route

```text
/admin/courses
```

Display:

```text
COURSES

Torrey Pines North
Torrey Pines South
Coronado Golf Course
...

        + Add Course
```

Course form:

```text
COURSE NAME
Torrey Pines North

LOCATION
La Jolla, CA

[ Save ]
```

---

# 29. Log Match

This is the most important admin workflow.

It should be optimized for mobile.

Route:

```text
/admin/matches/new
```

---

# 30. Match Entry Flow

Use a step-based form.

### Step 1 — Match Details

```text
NEW MATCH

Date
[ Aug 6, 2026 ]

Course
[ Torrey Pines North ▼ ]

Holes

[ 9 ] [ 18 ]

Format

[ 1v1 ] [ 2v2 ]

        Continue →
```

---

# 31. Step 2 — Teams

For 1v1:

```text
TEAM 1

[ David Larson ▼ ]

TEAM 2

[ Mike ▼ ]

        Continue →
```

For 2v2:

```text
TEAM 1

[ David Larson ▼ ]
[ Jesse ▼ ]

TEAM 2

[ Mike ▼ ]
[ Ben ▼ ]

        Continue →
```

Player selectors should:

- Search players
- Show ELO beside names
- Prevent selecting the same player twice
- Clearly identify team membership

Example:

```text
David Larson · 1642
Jesse · 1512
Mike · 1587
Ben · 1421
```

---

# 32. Step 3 — Result

Display:

```text
RESULT

Winner

[ Team 1 ]
[ Team 2 ]
[ PUSH ]

Score

[ 2&1 ]
[ 1UP ]
[ 3&2 ]
[ Custom ]

        Continue →
```

For a push:

```text
Result: PUSH

Score automatically becomes:

PUSH
```

---

# 33. Step 4 — Review

Before saving:

```text
REVIEW MATCH

TORREY PINES NORTH
August 6, 2026
18 holes

David + Jesse
        vs
Mike + Ben

Result
Team 1 wins

Score
2&1

Estimated ELO changes

David     +18
Jesse     +18
Mike      -18
Ben       -18

       [ Save Match ]
```

The ELO changes should be calculated before saving so the admin can verify them.

---

# 34. Match Save Transaction

When saving a match, the application should perform the operation atomically.

Conceptually:

```text
BEGIN

Create match

Create team 1
Create team 2

Add players

Read current player ratings

Calculate team ratings

Calculate expected result

Calculate ELO changes

Insert player_ratings

Update players.elo_rating

Update players.elo_peak

COMMIT
```

If anything fails:

```text
ROLLBACK
```

No partially created match should remain.

For Supabase, this business logic should ideally live in a PostgreSQL function/RPC rather than attempting to coordinate all of these writes from the browser.

Recommended future RPC:

```text
record_match(...)
```

The frontend would make one call:

```typescript
supabase.rpc("record_match", {...})
```

This is safer and prevents race conditions when updating ELO.

---

# 35. Editing Matches

Admin can edit an existing match.

Potentially dangerous because ELO history depends on match order.

For MVP:

When editing a match:

1. Delete/reverse its ELO effects.
2. Update the match.
3. Recalculate ELO from that match forward.

Because changing an old match can affect every subsequent rating.

Therefore editing historical matches should trigger an **ELO recalculation**.

---

# 36. ELO Recalculation

Create an admin action:

```text
Recalculate ELO
```

This should:

1. Reset every player's ELO to the configured initial rating.
2. Process matches chronologically.
3. Recalculate each match's ELO.
4. Rebuild `player_ratings`.
5. Update `players.elo_rating`.
6. Recalculate `elo_peak`.

This guarantees consistency.

For the initial application, this can be implemented as a Supabase RPC:

```text
recalculate_all_elo()
```

---

# 37. Delete Match

Deleting a match must also account for ELO.

Do not simply delete the match and leave ELO unchanged.

Recommended behavior:

```text
DELETE MATCH?

This will affect ELO ratings.

All player ratings will be
recalculated after deletion.

[ Cancel ]
[ Delete & Recalculate ]
```

---

# 38. Data Model

The frontend is built around these tables:

```text
players
courses
matches
match_teams
match_team_players
player_ratings
elo_settings
```

Relationships:

```text
players
   │
   ├──────────────┐
   │              │
   ▼              ▼
match_team_players   player_ratings
   │                    │
   ▼                    ▼
match_teams          matches
   │                    │
   └─────────┬──────────┘
             │
             ▼
           matches
             │
             ▼
          courses
```

---

# 39. Dashboard Data Queries

Avoid calculating complex statistics separately in every React component.

Create SQL views for common dashboard statistics.

Recommended views:

```text
player_records
player_head_to_head
player_partnerships
player_course_records
player_match_history
player_elo_history
match_summary
leaderboard
```

---

# 40. Leaderboard View

Conceptual output:

```text
player_id
player_name
elo_rating
elo_peak
matches
wins
losses
pushes
win_percentage
rank
```

Example:

```text
David Larson
1642
1687
57
38
17
2
66.67
1
```

The frontend should consume this view rather than reconstructing the entire calculation itself.

---

# 41. Player Record View

Provide:

```text
player_id
matches
wins
losses
pushes
win_percentage
```

The player page can then query this view with additional filters.

---

# 42. Course Statistics

For a player:

```text
course_id
course_name
matches
wins
losses
pushes
win_percentage
elo_change
```

This powers:

```text
Your Record by Course
```

---

# 43. Partnership Statistics

For each player pair:

```text
player_id
partner_id
matches
wins
losses
pushes
win_percentage
```

Important:

A partnership is directional only in the UI sense.

```text
David + Jesse
```

should be the same partnership as:

```text
Jesse + David
```

The query should normalize the pair.

---

# 44. Head-to-Head Statistics

For each pair of players:

```text
player_id
opponent_id
matches
wins
losses
pushes
win_percentage
```

For 2v2 matches:

A player is considered to have faced every player on the opposing team.

Example:

```text
David + Jesse
vs
Mike + Ben
```

creates head-to-head relationships:

```text
David vs Mike
David vs Ben

Jesse vs Mike
Jesse vs Ben
```

---

# 45. ELO Statistics

The application should expose:

```text
current ELO
peak ELO
starting ELO
total ELO gain
average ELO change
largest ELO gain
largest ELO loss
```

Recent form:

```text
ELO change over:

5 matches
10 matches
25 matches
```

---

# 46. Responsive Design

## Mobile

Target viewport:

```text
375px – 430px
```

Everything should work comfortably at 375px.

Avoid horizontal scrolling except for intentional filter chips.

Primary controls should be at least:

```text
44px × 44px
```

---

## Tablet/Desktop

At widths > 768px:

Use a centered content container:

```text
max-width: 1100px
```

The leaderboard can become a table/card hybrid.

Player statistics can use a two-column layout.

Example:

```text
┌──────────────────────────────────────────────┐
│ DAVID LARSON                                 │
│ 1642 ELO                                     │
├──────────────────────┬───────────────────────┤
│ ELO HISTORY          │ CAREER STATISTICS     │
│                      │                       │
│       chart          │ 57 matches            │
│                      │ 66.7% win rate        │
└──────────────────────┴───────────────────────┘
```

---

# 47. Visual Design

The visual language should feel:

> Premium golf + sports analytics.

Avoid making it look like an enterprise CRUD application.

Recommended characteristics:

- Dark green / forest tones
- Off-white backgrounds
- Subtle gold accents
- Rounded cards
- Large typography
- Minimal borders
- Strong numerical hierarchy
- Subtle shadows
- Golf-inspired but not cheesy

Avoid:

- Excessive golf imagery
- Golf-ball backgrounds
- Cartoon golf icons
- Overly ornamental design

---

# 48. Typography

Use a clean modern sans-serif.

Suggested:

```text
Inter
```

or:

```text
DM Sans
```

Numbers should be visually prominent.

Example:

```text
1642
```

should be significantly larger than:

```text
Current ELO
```

---

# 49. Loading States

Every data-dependent page needs a loading state.

Prefer skeletons over generic spinners.

Example:

```text
████████████████
██████████

████████████
████████████████
```

---

# 50. Empty States

Examples:

### No matches

```text
NO MATCHES YET

Once you log your first match,
your golf history will appear here.

[ Log First Match ]
```

### No partnership data

```text
NO PARTNERSHIPS YET

Play a 2v2 match to start
building partnership statistics.
```

---

# 51. Error Handling

Errors should be understandable.

Avoid:

```text
Error 23505
```

Instead:

```text
Unable to save match.

Please check the match details
and try again.
```

For database errors, log technical details to the browser console during development but show friendly messages to users.

---

# 52. Admin UX

Admin actions should have clear destructive-state confirmation.

For deletion:

```text
Are you sure?

Deleting this match will cause
ELO ratings to be recalculated.

[ Cancel ] [ Delete ]
```

For players/courses with dependencies:

```text
This course has 27 historical matches
and cannot be deleted.
```

---

# 53. State Management

Avoid introducing a global state management library initially.

Use:

- React state
- React Router
- Supabase queries
- URL query parameters for filters

Example:

```text
/players/123?course=456&partner=789&holes=18
```

This is preferable to hiding filter state entirely inside React.

It allows:

- Browser back button
- Bookmarking filtered views
- Sharing filtered URLs

---

# 54. Data Fetching

Create a thin data-access layer.

Example:

```text
src/
  lib/
    supabase.ts

  services/
    players.ts
    courses.ts
    matches.ts
    leaderboard.ts
    statistics.ts
```

Components should not contain raw Supabase queries everywhere.

Bad:

```typescript
const { data } = await supabase
  .from("players")
  .select(...)
```

inside numerous components.

Prefer:

```typescript
const players = await getLeaderboard()
```

---

# 55. Suggested Project Structure

```text
src/
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── BottomNav.tsx
│   │   └── Header.tsx
│   │
│   ├── leaderboard/
│   │   ├── Leaderboard.tsx
│   │   ├── LeaderboardRow.tsx
│   │   └── TopPlayers.tsx
│   │
│   ├── players/
│   │   ├── PlayerHeader.tsx
│   │   ├── PlayerStats.tsx
│   │   ├── EloChart.tsx
│   │   ├── PlayerFilters.tsx
│   │   ├── PartnershipStats.tsx
│   │   ├── HeadToHeadStats.tsx
│   │   └── PlayerMatchHistory.tsx
│   │
│   ├── matches/
│   │   ├── MatchCard.tsx
│   │   ├── MatchDetail.tsx
│   │   └── MatchHistory.tsx
│   │
│   └── admin/
│       ├── AdminGuard.tsx
│       ├── AdminDashboard.tsx
│       ├── PlayerForm.tsx
│       ├── CourseForm.tsx
│       ├── MatchForm.tsx
│       └── DeleteConfirmation.tsx
│
├── pages/
│   ├── HomePage.tsx
│   ├── PlayerPage.tsx
│   ├── MatchHistoryPage.tsx
│   ├── MatchDetailPage.tsx
│   ├── AdminLoginPage.tsx
│   ├── AdminPage.tsx
│   ├── AdminPlayersPage.tsx
│   ├── AdminCoursesPage.tsx
│   └── AdminMatchesPage.tsx
│
├── services/
│   ├── players.ts
│   ├── courses.ts
│   ├── matches.ts
│   ├── leaderboard.ts
│   └── statistics.ts
│
├── hooks/
│   ├── useLeaderboard.ts
│   ├── usePlayerStats.ts
│   ├── useMatches.ts
│   └── useAdminAuth.ts
│
├── lib/
│   ├── supabase.ts
│   └── utils.ts
│
├── types/
│   └── database.ts
│
├── App.tsx
└── main.tsx
```

---

# 56. Admin Authentication Implementation

Create:

```text
useAdminAuth()
```

Responsibilities:

```text
isAuthenticated
login(code)
logout()
```

Login:

```typescript
const configuredCode = import.meta.env.VITE_ADMIN_ACCESS_CODE;

if (code === configuredCode) {
    localStorage.setItem(
        "golf_admin_authenticated",
        "true"
    );
}
```

Admin routes should be wrapped with:

```tsx
<AdminGuard>
    <AdminPage />
</AdminGuard>
```

---

# 57. Security Considerations

The access code is **not a true security boundary** because it exists in the frontend bundle.

Therefore:

### Appropriate for

- Personal use
- Friends
- Low-risk data
- Preventing accidental edits

### Not appropriate for

- Sensitive data
- Financial information
- Private user data
- Public-facing applications

If this application eventually becomes public, replace the access-code mechanism with Supabase Auth.

---

# 58. Supabase Row Level Security

Because the frontend communicates directly with Supabase, RLS should be enabled.

For the initial personal application, the recommended architecture is:

### Public

Allow anonymous read access to:

```text
players
courses
matches
match_teams
match_team_players
player_ratings
```

### Writes

Do not rely on the frontend access code alone to secure writes if the database contains anything sensitive.

For a true security boundary, use Supabase Auth and authenticated RLS policies.

For this personal application, the initial implementation may use the frontend admin gate while keeping the database intentionally simple.

---

# 59. Important ELO Architecture

ELO should be calculated server-side through Supabase PostgreSQL functions.

Recommended functions:

```text
record_match()
delete_match()
recalculate_all_elo()
```

### `record_match()`

Responsible for:

- Creating match
- Creating teams
- Assigning players
- Calculating ELO
- Writing rating history
- Updating current ratings
- Updating peak ratings

### `delete_match()`

Responsible for:

- Deleting match
- Recalculating ELO

### `recalculate_all_elo()`

Responsible for:

- Resetting ratings
- Replaying matches chronologically
- Rebuilding rating history

This keeps the database authoritative.

---

# 60. ELO Algorithm

Initial implementation:

```text
Initial rating = 1500
K-factor = 32
```

For a 1v1 match:

```text
Expected A =
1 / (1 + 10 ^ ((RatingB - RatingA) / 400))
```

Result:

```text
Win  = 1
Push = 0.5
Loss = 0
```

New rating:

```text
New Rating =
Old Rating + K × (Result - Expected)
```

---

# 61. 2v2 ELO

For 2v2:

```text
Team Rating =
Average(Player 1 Rating, Player 2 Rating)
```

Calculate expected team result using the team ratings.

Apply the resulting ELO change to each player on the team.

Example:

```text
David 1550
Jesse 1480

Team A = 1515

Mike 1520
Ben 1500

Team B = 1510
```

If Team A wins:

```text
David +16
Jesse +16

Mike -16
Ben -16
```

The exact change depends on the ELO calculation.

---

# 62. Important ELO Rule

ELO must be calculated using the ratings **before the match**.

Never calculate one player's new rating and then use that updated rating when calculating another player's result within the same match.

All participants' ratings should be captured first:

```text
rating_before
```

Then all new ratings are calculated.

Then all changes are written.

---

# 63. Performance Optimization

This application is expected to have relatively small datasets.

Potentially:

```text
10–100 players
100–10,000 matches
```

This is trivial for PostgreSQL.

Do not prematurely optimize.

Use:

- Indexed foreign keys
- SQL views
- Server-side aggregation
- Pagination for match history

Do not fetch the entire match history into React just to calculate statistics.

---

# 64. Caching

Leaderboard data can be cached in React.

However, after an admin creates or edits a match:

```text
invalidate:

leaderboard
player stats
match history
ELO history
```

The simplest implementation can simply refetch after mutation.

---

# 65. MVP

The MVP should contain:

### Public

- Leaderboard
- Player detail
- ELO history
- Overall player statistics
- Course filtering
- Partner filtering
- Opponent filtering
- 9/18 hole filtering
- Match history
- Match detail

### Admin

- Admin access code
- Add player
- Edit player
- Add course
- Edit course
- Log 1v1 match
- Log 2v2 match
- Edit match
- Delete match
- Automatic ELO updates

---

# 66. Post-MVP Features

Potential future additions:

### Match statistics

- Average winning margin
- Biggest upset
- Closest matches
- Most dominant wins
- Longest winning streak

### Player comparisons

```text
David vs Mike
```

with side-by-side statistics.

### Partnership rankings

```text
Best Partnerships

David + Jesse
9-4-1

Mike + Ben
7-6-0
```

### Course leaderboards

```text
Best Players at Torrey Pines North
```

### ELO milestones

```text
Reached 1500
Reached 1600
Reached 1700
```

### Match awards

```text
Biggest Upset
Longest Win Streak
Highest ELO
Most Matches
Best Win %
```

### Match notes

Allow admins to add:

```text
notes
```

to matches.

Example:

> "David holed out from 70 yards on 16."

This could make the application much more fun over time.

---

# 67. UX Priority

When deciding between features, prioritize:

1. **Leaderboard**
2. **Player statistics**
3. **Fast match entry**
4. **ELO accuracy**
5. **Match history**
6. **Filtering**
7. **Administrative management**
8. Additional analytics

The app should feel useful even if someone only opens it for 10 seconds.

---

# 68. Definition of Done

The application is considered MVP-complete when:

### Leaderboard

- [ ] Players are ranked by ELO.
- [ ] Current ELO is displayed.
- [ ] Record is displayed.
- [ ] Players are clickable.
- [ ] Leaderboard works on mobile.

### Player pages

- [ ] Player profile displays current ELO.
- [ ] Peak ELO is displayed.
- [ ] Career record is displayed.
- [ ] ELO history chart works.
- [ ] Course filtering works.
- [ ] Partner filtering works.
- [ ] Opponent filtering works.
- [ ] 9/18 hole filtering works.
- [ ] Match history is displayed.

### Matches

- [ ] Match history works.
- [ ] Match details display correctly.
- [ ] 1v1 matches are supported.
- [ ] 2v2 matches are supported.
- [ ] 9-hole matches are supported.
- [ ] 18-hole matches are supported.
- [ ] Pushes are supported.
- [ ] `1UP` results are supported.
- [ ] `2&1` results are supported.

### Admin

- [ ] Admin access code works.
- [ ] Players can be created.
- [ ] Players can be edited.
- [ ] Courses can be created.
- [ ] Courses can be edited.
- [ ] Matches can be created.
- [ ] Matches can be edited.
- [ ] Matches can be deleted.
- [ ] ELO is updated after matches.

### ELO

- [ ] Initial rating is configurable.
- [ ] K-factor is configurable.
- [ ] 1v1 ELO works.
- [ ] 2v2 ELO works.
- [ ] Pushes affect ELO correctly.
- [ ] ELO history is persisted.
- [ ] Historical ELO can be reconstructed.
- [ ] Deleting/editing matches recalculates ELO.
- [ ] Peak ELO is maintained.

---

# 69. Final Architecture

The finished system should conceptually look like:

```text
                         ┌──────────────────────┐
                         │      Supabase        │
                         │                      │
                         │    PostgreSQL        │
                         └──────────┬───────────┘
                                    │
                                    │
                         ┌──────────▼───────────┐
                         │     SQL Views /      │
                         │     RPC Functions    │
                         │                      │
                         │ leaderboard          │
                         │ player stats         │
                         │ partnerships         │
                         │ head-to-head         │
                         │ record_match         │
                         │ recalculate_elo      │
                         └──────────┬───────────┘
                                    │
                                    │ Supabase JS
                                    │
                   ┌────────────────▼────────────────┐
                   │         React Application       │
                   │                                │
                   │  ┌──────────────────────────┐  │
                   │  │      Public Dashboard    │  │
                   │  │                          │  │
                   │  │ Leaderboard              │  │
                   │  │ Player Stats             │  │
                   │  │ ELO Charts               │  │
                   │  │ Match History            │  │
                   │  └──────────────────────────┘  │
                   │                                │
                   │  ┌──────────────────────────┐  │
                   │  │       Admin Area         │  │
                   │  │                          │  │
                   │  │ Players                  │  │
                   │  │ Courses                  │  │
                   │  │ Match Entry              │  │
                   │  │ Match Editing            │  │
                   │  └──────────────────────────┘  │
                   │                                │
                   └────────────────────────────────┘
```

The most important architectural decision is to keep **the raw match history as the source of truth** and treat ELO and dashboard statistics as derived information. That makes the system robust when you inevitably discover that an old match was entered incorrectly or decide to change the ELO algorithm later.