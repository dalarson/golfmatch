# Golf Match Tracker — Supabase Backend & Analytics Specification

## 1. Purpose

This document defines the PostgreSQL/Supabase backend implementation for the Golf Match Tracker application.

It is intended to be used alongside the frontend design specification.

The backend is responsible for:

- Storing players, courses, matches, teams, and participants.
- Maintaining historical ELO ratings.
- Calculating ELO for 1v1 and 2v2 matches.
- Recalculating ELO after historical matches are edited or deleted.
- Providing efficient statistical views for the frontend.
- Providing RPC functions for transactional match creation and modification.
- Providing leaderboard, player, partnership, head-to-head, and course statistics.

The database is the source of truth.

The frontend should **not independently calculate or mutate ELO**.

---

# 2. Architecture

The application should use the following architecture:

```text
React Frontend
      │
      │ Supabase JS
      ▼
PostgreSQL
      │
      ├── Base Tables
      │
      ├── SQL Views
      │
      └── RPC Functions
```

The frontend should primarily consume:

```text
leaderboard
player_records
player_course_records
player_partnerships
player_head_to_head
player_match_history
player_elo_history
match_summary
```

Mutations should use:

```text
create_player()
update_player()

create_course()
update_course()

record_match()
update_match()
delete_match()

recalculate_all_elo()
```

---

# 3. Source of Truth

The following are authoritative:

### Players

```text
players
```

### Courses

```text
courses
```

### Matches

```text
matches
match_teams
match_team_players
```

### ELO

The authoritative historical ELO data is:

```text
player_ratings
```

`players.elo_rating` and `players.elo_peak` are cached values.

They should always be reconstructable from match history.

---

# 4. Existing Base Schema

The implementation assumes the following tables exist:

```text
players
courses
matches
match_teams
match_team_players
player_ratings
elo_settings
```

as defined in the initial database schema.

---

# 5. Important Database Rules

## 5.1 Matches always have exactly two teams

Every valid match must contain:

```text
Team 1
Team 2
```

---

## 5.2 Team sizes

For:

```text
team_size = 1
```

each team must have exactly one player.

For:

```text
team_size = 2
```

each team must have exactly two players.

---

## 5.3 Match results

For a normal match:

```text
Team 1 = WIN
Team 2 = LOSS
```

or:

```text
Team 1 = LOSS
Team 2 = WIN
```

For a push:

```text
Team 1 = PUSH
Team 2 = PUSH
```

No other combinations are valid.

---

# 6. ELO Algorithm

## 6.1 Initial configuration

The default configuration is:

```text
Initial rating = 1500
K-factor = 32
```

These values live in:

```text
elo_settings
```

---

# 7. Expected Result

For two ratings:

```text
rating_a
rating_b
```

the expected result for A is:

```text
E_A =
1 / (1 + 10 ^ ((rating_b - rating_a) / 400))
```

The expected result for B is:

```text
E_B = 1 - E_A
```

---

# 8. Match Results

The actual result is:

```text
WIN  = 1
PUSH = 0.5
LOSS = 0
```

New rating:

```text
new_rating =
old_rating + K × (actual_result - expected_result)
```

The resulting rating should be rounded to the nearest integer.

---

# 9. 1v1 ELO

For a 1v1:

```text
David 1550
Mike 1450
```

Expected result:

```text
David ≈ 0.64
Mike  ≈ 0.36
```

If David wins:

```text
David:
1550 + 32 × (1 - 0.64)
≈ 1562

Mike:
1450 + 32 × (0 - 0.36)
≈ 1438
```

---

# 10. 2v2 ELO

For 2v2, calculate a team rating as the average of the members' pre-match ratings.

Example:

```text
David = 1550
Jesse = 1480

Team A = 1515
```

and:

```text
Mike = 1520
Ben = 1500

Team B = 1510
```

The expected result is calculated using:

```text
Team A = 1515
Team B = 1510
```

The resulting team ELO change is applied equally to every player on the team.

---

# 11. Critical ELO Rule

All ratings must be captured **before calculating any new ratings**.

For example:

```text
David 1550
Jesse 1480
Mike 1520
Ben 1500
```

Calculate all four new ratings from those values.

Do not update David's rating before calculating Jesse's rating.

---

# 12. ELO SQL Helpers

Create a helper function:

```sql
create or replace function calculate_elo_expected(
    rating_a integer,
    rating_b integer
)
returns numeric
language sql
immutable
as $$
    select 1.0 / (
        1.0 + power(
            10.0,
            (rating_b - rating_a) / 400.0
        )
    );
$$;
```

This function returns A's expected score.

---

# 13. Match Result Helper

Create:

```sql
create or replace function get_result_value(
    result match_result
)
returns numeric
language sql
immutable
as $$
    select case result
        when 'WIN' then 1.0
        when 'PUSH' then 0.5
        when 'LOSS' then 0.0
    end;
$$;
```

---

# 14. Leaderboard View

Create a view named:

```text
leaderboard
```

It should expose:

```text
rank
player_id
player_name
elo_rating
elo_peak
matches
wins
losses
pushes
win_percentage
```

Example:

```sql
create or replace view leaderboard as
with records as (
    select
        p.id as player_id,
        count(distinct mt.match_id) as matches,

        count(*) filter (
            where mt.result = 'WIN'
        ) as wins,

        count(*) filter (
            where mt.result = 'LOSS'
        ) as losses,

        count(*) filter (
            where mt.result = 'PUSH'
        ) as pushes

    from players p
    join match_team_players mtp
        on mtp.player_id = p.id
    join match_teams mt
        on mt.id = mtp.match_team_id

    group by p.id
)
select
    row_number() over (
        order by p.elo_rating desc, p.name
    ) as rank,

    p.id as player_id,
    p.name as player_name,
    p.elo_rating,
    p.elo_peak,

    coalesce(r.matches, 0) as matches,
    coalesce(r.wins, 0) as wins,
    coalesce(r.losses, 0) as losses,
    coalesce(r.pushes, 0) as pushes,

    case
        when coalesce(r.matches, 0) = 0 then 0
        else round(
            100.0 * r.wins / r.matches,
            1
        )
    end as win_percentage

from players p
left join records r
    on r.player_id = p.id

order by p.elo_rating desc, p.name;
```

---

# 15. Player Record View

Create:

```text
player_records
```

Columns:

```text
player_id
matches
wins
losses
pushes
win_percentage
```

This should represent the player's overall record.

---

# 16. Player Course Records

Create:

```text
player_course_records
```

Columns:

```text
player_id
course_id
course_name
matches
wins
losses
pushes
win_percentage
```

The frontend can query:

```sql
select *
from player_course_records
where player_id = :player_id
order by win_percentage desc;
```

---

# 17. Player Match History

Create:

```text
player_match_history
```

Columns:

```text
match_id
player_id
date
course_id
course_name
holes
team_size
player_result
score_type
score_value
holes_remaining
elo_before
elo_after
elo_change
```

The frontend can use this to render the match history on the player page.

---

# 18. Match Summary View

Create:

```text
match_summary
```

The view should expose one row per match:

```text
match_id
date
course_id
course_name
holes
team_size
score
team_1_result
team_2_result
team_1_players
team_2_players
```

Example output:

```text
Torrey Pines North
August 6, 2026
18 holes

David Larson + Jesse
vs
Mike + Ben

2&1
Team 1 WIN
```

---

# 19. Score Formatting

Create a helper function:

```sql
create or replace function format_match_score(
    score_type score_type,
    score_value smallint,
    holes_remaining smallint
)
returns text
language sql
immutable
as $$
    select case
        when score_type = 'PUSH'
            then 'PUSH'

        when score_type = 'UP'
            then score_value::text || 'UP'

        when score_type = 'HOLES_UP'
            then score_value::text || '&' || holes_remaining::text
    end;
$$;
```

This allows the database to return:

```text
2&1
1UP
PUSH
```

without requiring the frontend to understand the underlying representation.

---

# 20. Partnership Statistics

Create:

```text
player_partnerships
```

This represents every pair of players who have played together.

Columns:

```text
player_id
partner_id
player_name
partner_name
matches
wins
losses
pushes
win_percentage
```

Only matches where:

```text
team_size = 2
```

should contribute.

A partnership should be treated as unordered.

Therefore:

```text
David + Jesse
```

and:

```text
Jesse + David
```

are the same partnership.

---

# 21. Partnership Query

Conceptually:

```sql
with partnerships as (
    select
        least(a.player_id, b.player_id) as player_a,
        greatest(a.player_id, b.player_id) as player_b,
        mt.match_id,
        mt.result
    from match_teams mt

    join match_team_players a
        on a.match_team_id = mt.id

    join match_team_players b
        on b.match_team_id = mt.id
        and a.player_id < b.player_id

    join matches m
        on m.id = mt.match_id
        and m.team_size = 2
)
select
    player_a,
    player_b,
    count(*) as matches,

    count(*) filter (
        where result = 'WIN'
    ) as wins,

    count(*) filter (
        where result = 'LOSS'
    ) as losses,

    count(*) filter (
        where result = 'PUSH'
    ) as pushes

from partnerships

group by player_a, player_b;
```

Join to `players` to expose names.

---

# 22. Head-to-Head Statistics

Create:

```text
player_head_to_head
```

This represents players who have opposed one another.

For:

```text
David + Jesse
vs
Mike + Ben
```

the following relationships exist:

```text
David vs Mike
David vs Ben
Jesse vs Mike
Jesse vs Ben
```

---

# 23. Head-to-Head Direction

The view should be directional.

For example:

```text
David vs Mike
```

and:

```text
Mike vs David
```

represent the same underlying matches but have opposite results.

This makes frontend queries easy.

Example:

```text
where player_id = David
and opponent_id = Mike
```

returns David's perspective.

---

# 24. Head-to-Head View Structure

Columns:

```text
player_id
opponent_id
player_name
opponent_name
matches
wins
losses
pushes
win_percentage
```

---

# 25. Course Statistics

The player course view should only count a match once for the player.

For example:

```text
David + Jesse
vs
Mike + Ben
```

is one match for David, not two.

---

# 26. ELO History View

Create:

```text
player_elo_history
```

Columns:

```text
player_id
match_id
date
course_name
rating_before
rating_after
rating_change
```

Order by:

```text
date
match_id
```

The frontend can directly feed this into the ELO chart.

---

# 27. ELO Recalculation

This is the most important database operation.

Create:

```text
recalculate_all_elo()
```

This function should:

1. Read initial ELO.
2. Reset every player to initial ELO.
3. Delete existing `player_ratings`.
4. Process matches chronologically.
5. Calculate ratings.
6. Insert new `player_ratings`.
7. Update `players.elo_rating`.
8. Update `players.elo_peak`.

---

# 28. Match Ordering

Matches should be processed using:

```text
date ASC,
created_at ASC,
id ASC
```

This provides deterministic ordering for multiple matches played on the same date.

---

# 29. Recalculation Pseudocode

```text
initial_rating = elo_settings.initial_rating
k_factor = elo_settings.k_factor

for player:
    player.rating = initial_rating

delete all player_ratings

for match ordered chronologically:

    read Team 1
    read Team 2

    read all player ratings

    calculate Team 1 rating
    calculate Team 2 rating

    calculate expected Team 1 result

    determine actual result

    calculate Team 1 change
    calculate Team 2 change

    calculate each player's new rating

    insert player_ratings

    update players
```

---

# 30. ELO Rounding

Calculate the new rating using numeric precision.

Only round the final rating:

```sql
round(new_rating)
```

Do not round expected probabilities or intermediate values.

---

# 31. Recording a Match

Create RPC:

```text
record_match()
```

The function should accept:

```text
date
course_id
holes
team_size
score_type
score_value
holes_remaining

team_1_player_ids
team_2_player_ids

team_1_result
team_2_result
```

Example conceptual invocation:

```typescript
await supabase.rpc("record_match", {
    p_date: "2026-08-06",
    p_course_id: courseId,
    p_holes: 18,
    p_team_size: 2,
    p_score_type: "HOLES_UP",
    p_score_value: 2,
    p_holes_remaining: 1,
    p_team_1_player_ids: [davidId, jesseId],
    p_team_2_player_ids: [mikeId, benId],
    p_team_1_result: "WIN",
    p_team_2_result: "LOSS"
});
```

---

# 32. `record_match()` Transaction

The function must execute atomically.

Conceptually:

```text
BEGIN

validate input

create match

create team 1
create team 2

add players to teams

read ELO

calculate ELO

write rating history

update players

COMMIT
```

PostgreSQL functions execute within the caller's transaction.

---

# 33. Match Validation

`record_match()` must validate:

### Holes

```text
9 or 18
```

### Team size

```text
1 or 2
```

### Team 1

Exactly `team_size` players.

### Team 2

Exactly `team_size` players.

### No duplicate players

A player cannot appear on both teams.

### Results

Valid combinations:

```text
WIN / LOSS
LOSS / WIN
PUSH / PUSH
```

### Score

For:

```text
PUSH
```

require:

```text
score_value = NULL
holes_remaining = NULL
```

For:

```text
UP
```

require:

```text
score_value > 0
holes_remaining = NULL
```

For:

```text
HOLES_UP
```

require:

```text
score_value > 0
holes_remaining > 0
```

---

# 34. ELO Calculation Inside `record_match()`

The function should:

1. Lock player rows using `FOR UPDATE`.
2. Read their current ratings.
3. Calculate team ratings.
4. Calculate expected outcomes.
5. Calculate rating changes.
6. Insert `player_ratings`.
7. Update `players`.

The row locks prevent simultaneous match submissions from producing inconsistent ELO.

---

# 35. Why `FOR UPDATE` Matters

Suppose two admins somehow submit matches simultaneously.

Without locking:

```text
Match A reads David = 1500
Match B reads David = 1500
```

Both could calculate from stale data.

With:

```sql
select ...
from players
where id = ...
for update;
```

the second transaction waits until the first finishes.

---

# 36. Updating a Match

Historical match editing is more complicated than ordinary CRUD.

Changing:

```text
players
result
date
course
```

can affect ELO.

Therefore:

```text
update_match()
```

should:

1. Update the match.
2. Update its teams/players.
3. Run `recalculate_all_elo()`.

---

# 37. Deleting a Match

`delete_match()` should:

1. Delete the match.
2. Cascade-delete teams.
3. Cascade-delete team players.
4. Recalculate all ELO.

Because `match_teams` and `match_team_players` use cascading deletes, deleting the match will remove associated records.

---

# 38. ELO Recalculation Strategy

For the expected dataset size, full recalculation is preferred over attempting to incrementally repair history.

If there are:

```text
5,000 matches
```

replaying all 5,000 matches is still inexpensive for PostgreSQL.

This approach is much easier to reason about and substantially reduces the possibility of rating corruption.

---

# 39. Admin Recalculation

Expose an admin-only action:

```text
Recalculate ELO
```

This is useful if:

- The ELO algorithm changes.
- Historical data is imported.
- A database issue occurs.
- Ratings need to be rebuilt.

The function should return:

```text
players_processed
matches_processed
```

---

# 40. Player Record Calculation

A player's result is simply the result of their team.

For:

```text
David + Jesse
vs
Mike + Ben
```

if Team 1 wins:

```text
David WIN
Jesse WIN
Mike LOSS
Ben LOSS
```

Each player gets one match result.

---

# 41. Win Percentage

Use:

```text
wins / matches
```

not:

```text
wins / (wins + losses)
```

because pushes should be included in the denominator.

Example:

```text
10 wins
5 losses
5 pushes
```

means:

```text
10 / 20 = 50%
```

---

# 42. Filterable Player Statistics

The frontend should support filters:

```text
course
partner
opponent
holes
team_size
date range
```

The SQL views should provide enough underlying information for the frontend to query these dimensions.

---

# 43. Recommended Player Statistics RPC

For more complex combinations of filters, create:

```text
get_player_stats()
```

Arguments:

```text
p_player_id
p_course_id nullable
p_partner_id nullable
p_opponent_id nullable
p_holes nullable
p_team_size nullable
p_start_date nullable
p_end_date nullable
```

Return:

```text
matches
wins
losses
pushes
win_percentage
elo_change
```

This avoids trying to build increasingly complicated queries in React.

---

# 44. Recommended `get_player_stats()` Logic

Start with all matches involving the player.

Apply:

```text
course
date
holes
team size
```

Then optionally constrain:

### Partner

The partner must be on the player's team.

### Opponent

The opponent must be on the opposing team.

After filtering, aggregate the player's results.

---

# 45. Player Overview RPC

Create:

```text
get_player_overview()
```

Arguments:

```text
p_player_id
```

Return:

```text
player_id
name
current_elo
peak_elo
matches
wins
losses
pushes
win_percentage
elo_change_last_5
elo_change_last_10
elo_change_last_25
```

This powers the player header and summary cards.

---

# 46. Current Form

Define recent form using the most recent matches chronologically.

Examples:

```text
last 5
last 10
last 25
```

For ELO:

```text
current_rating - rating_before_n_matches
```

For record:

```text
wins / losses / pushes
```

---

# 47. Biggest Upset

A future statistic can be calculated as:

```text
winner's pre-match team rating
vs
loser's pre-match team rating
```

For a win by the lower-rated team:

```text
upset_margin =
loser_team_rating - winner_team_rating
```

Largest value = biggest upset.

This information can be reconstructed from `player_ratings` or stored in a match analytics view.

---

# 48. Match Analytics View

A useful future view:

```text
match_analytics
```

Columns:

```text
match_id
date
course_id
holes
team_size

team_1_rating
team_2_rating

rating_difference

winning_team_rating
losing_team_rating

upset_margin
```

This enables:

- Biggest upset
- Most evenly matched game
- Biggest pre-match rating gap
- Average match rating gap

---

# 49. Course Statistics

For the dashboard, support:

```text
course
matches
wins
losses
pushes
win_percentage
average_elo_change
```

Example:

```text
Torrey Pines North

27 matches
18W · 7L · 2P
66.7%
+143 ELO
```

---

# 50. Partnership Ranking

A partnership leaderboard can display:

```text
Rank
Players
Matches
Wins
Losses
Pushes
Win %
```

Minimum threshold can be applied:

```text
at least 3 matches
```

to avoid one-match partnerships dominating the rankings.

---

# 51. Head-to-Head Ranking

Similarly:

```text
Player
Opponent
Matches
Record
Win %
```

Potential minimum:

```text
at least 3 matches
```

---

# 52. Database Views vs RPCs

Use views for simple reusable data:

```text
leaderboard
match_summary
player_elo_history
```

Use RPCs for:

```text
complex filtering
mutations
ELO calculations
transactions
```

This keeps the architecture understandable.

---

# 53. Recommended SQL Objects

The finished database should contain:

## Tables

```text
players
courses
matches
match_teams
match_team_players
player_ratings
elo_settings
```

## Functions

```text
calculate_elo_expected()
get_result_value()
format_match_score()

record_match()
update_match()
delete_match()

recalculate_all_elo()

get_player_overview()
get_player_stats()
```

## Views

```text
leaderboard
player_records
player_course_records
player_partnerships
player_head_to_head
player_match_history
player_elo_history
match_summary
match_analytics
```

---

# 54. Recommended Indexes

Ensure indexes exist on:

```text
matches.date
matches.course_id

match_teams.match_id

match_team_players.match_team_id
match_team_players.player_id

player_ratings.player_id
player_ratings.match_id
player_ratings.created_at
```

For larger datasets, consider:

```text
matches(course_id, date)
player_ratings(player_id, created_at)
```

---

# 55. RLS

Because the frontend talks directly to Supabase, Row Level Security should be enabled.

Public users need read access to the dashboard data.

The application should eventually use authenticated Supabase users for writes.

The frontend admin code should not be considered a true database security boundary.

---

# 56. Recommended Initial RLS Model

For the personal MVP:

### Public SELECT

Allow anonymous users to read:

```text
players
courses
matches
match_teams
match_team_players
player_ratings
```

### Writes

Ideally route all writes through RPC functions.

This means the frontend never needs direct:

```text
insert
update
delete
```

permissions on every table.

Instead:

```text
Frontend
   │
   └── RPC
         │
         ▼
      Database
```

This provides a cleaner API boundary.

---

# 57. Migration Strategy

The SQL should be organized into migrations:

```text
001_initial_schema.sql

002_elo_functions.sql

003_dashboard_views.sql

004_match_rpc.sql

005_elo_recalculation.sql

006_rls.sql
```

Do not continuously edit the original migration after it has been deployed.

Create a new migration for schema changes.

---

# 58. Data Integrity

The database should enforce:

- Valid player references.
- Valid course references.
- Valid match results.
- Valid hole counts.
- Valid team sizes.
- Valid score representations.
- No duplicate players within a team.
- No player appearing on both teams.
- Exactly two teams per match.
- Correct team sizes.
- Consistent push results.

The more of this validation happens in PostgreSQL, the less opportunity there is for frontend bugs to corrupt data.

---

# 59. Error Handling

RPC functions should raise descriptive PostgreSQL exceptions.

Example:

```sql
raise exception 'A 2v2 match requires exactly 2 players per team';
```

The frontend should translate these into user-friendly messages.

---

# 60. Transaction Safety

Every mutation involving ELO should be atomic.

Never allow this state:

```text
match exists
ELO history doesn't
```

or:

```text
ELO changed
match wasn't saved
```

The following operations must occur in one transaction:

```text
match creation
team creation
player assignment
ELO calculation
rating history creation
player rating update
```

---

# 61. Recommended Match Creation API

The frontend should ideally have one function:

```typescript
recordMatch(input)
```

where:

```typescript
interface RecordMatchInput {
    date: string;
    courseId: string;
    holes: 9 | 18;
    teamSize: 1 | 2;

    scoreType: "UP" | "HOLES_UP" | "PUSH";
    scoreValue?: number;
    holesRemaining?: number;

    team1PlayerIds: string[];
    team2PlayerIds: string[];

    team1Result: "WIN" | "LOSS" | "PUSH";
    team2Result: "WIN" | "LOSS" | "PUSH";
}
```

The frontend should not need to know the implementation details of ELO.

---

# 62. Recommended Frontend API Layer

The frontend service should look conceptually like:

```typescript
export async function recordMatch(
    input: RecordMatchInput
) {
    const { data, error } = await supabase.rpc(
        "record_match",
        {
            ...
        }
    );

    if (error) {
        throw error;
    }

    return data;
}
```

Similarly:

```typescript
getLeaderboard()
getPlayerOverview(playerId)
getPlayerStats(filters)
getPlayerEloHistory(playerId)
getPlayerPartnerships(playerId)
getPlayerHeadToHead(playerId)
getMatchHistory(filters)
```

---

# 63. Frontend Should Never Calculate Career Stats

Do not do this:

```typescript
matches.filter(...)
```

over the entire match dataset in React.

Instead:

```typescript
const stats = await getPlayerStats(filters);
```

PostgreSQL is the correct place for aggregation.

---

# 64. Frontend Should Never Calculate ELO

Do not expose:

```typescript
calculateElo(...)
```

as frontend business logic.

ELO should be calculated exclusively by PostgreSQL.

This ensures:

- Consistency
- Transaction safety
- Reproducibility
- Easy recalculation
- No client-side manipulation

---

# 65. ELO Rebuild as the Ultimate Source of Truth

If:

```text
players.elo_rating
```

ever disagrees with:

```text
player_ratings
```

or if historical ELO appears corrupted:

```text
recalculate_all_elo()
```

should completely rebuild the rating system from matches.

This makes the system self-healing.

---

# 66. Example Complete Flow

Suppose an admin enters:

```text
August 6, 2026
Torrey Pines North
18 holes

David + Jesse
vs
Mike + Ben

David + Jesse win
2&1
```

The frontend sends:

```text
record_match()
```

The database:

```text
1. Creates match
2. Creates Team 1
3. Creates Team 2
4. Assigns players
5. Reads current ELO
6. Calculates team ELO
7. Calculates expected result
8. Calculates changes
9. Inserts four player_ratings rows
10. Updates four players
11. Commits
```

The frontend then refreshes:

```text
leaderboard
player stats
match history
ELO charts
```

---

# 67. Example Result

Before:

```text
David 1550
Jesse 1480
Mike 1520
Ben 1500
```

After:

```text
David 1566
Jesse 1496

Mike 1504
Ben 1484
```

The rating history contains:

```text
David
1550 → 1566 (+16)

Jesse
1480 → 1496 (+16)

Mike
1520 → 1504 (-16)

Ben
1500 → 1484 (-16)
```

The leaderboard immediately reflects the new ratings.

---

# 68. Future ELO Improvements

The initial algorithm should remain simple.

Potential future enhancements:

- Different K-factors for provisional players.
- Match-length weighting.
- Margin-of-victory adjustment.
- Separate singles/doubles ratings.
- Course difficulty adjustment.
- Rating uncertainty.
- Glicko-2 instead of ELO.

Do not implement these in the MVP.

The database architecture should allow them to be introduced later.

---

# 69. Testing Strategy

Although this is a personal application, the database's core ELO functions should be tested manually with known examples.

At minimum verify:

### Equal ratings, win

```text
1500 vs 1500
```

Winner should gain:

```text
+16
```

with K=32.

### Equal ratings, push

Both remain:

```text
1500
```

### Higher-rated player wins

Rating changes should be smaller for the winner.

### Lower-rated player wins

Rating changes should be larger.

### 2v2

Both members of the winning team should receive the same change.

### Historical edit

Editing an old match should correctly rebuild every subsequent rating.

### Historical delete

Deleting an old match should correctly rebuild every subsequent rating.

---

# 70. Definition of Done

The backend is complete when:

- [ ] All base tables exist.
- [ ] All foreign keys are enforced.
- [ ] Match validation is enforced.
- [ ] ELO configuration exists.
- [ ] ELO calculation exists.
- [ ] 1v1 ELO works.
- [ ] 2v2 ELO works.
- [ ] Pushes work.
- [ ] ELO history is persisted.
- [ ] Current ELO is maintained.
- [ ] Peak ELO is maintained.
- [ ] ELO can be completely rebuilt.
- [ ] Match creation is transactional.
- [ ] Match editing triggers recalculation.
- [ ] Match deletion triggers recalculation.
- [ ] Leaderboard view exists.
- [ ] Player statistics view exists.
- [ ] Course statistics exist.
- [ ] Partnership statistics exist.
- [ ] Head-to-head statistics exist.
- [ ] Match history exists.
- [ ] ELO history exists.
- [ ] Dashboard filters can be supported efficiently.
- [ ] Appropriate indexes exist.
- [ ] RLS is configured.
- [ ] Frontend does not independently calculate ELO.

---

# 71. Final Backend Architecture

```text
                    ┌─────────────────────────┐
                    │       React App         │
                    └────────────┬────────────┘
                                 │
                          Supabase JS
                                 │
                ┌────────────────▼────────────────┐
                │          PostgreSQL             │
                │                                 │
                │ ┌─────────────────────────────┐ │
                │ │          Tables             │ │
                │ │                             │ │
                │ │ players                     │ │
                │ │ courses                     │ │
                │ │ matches                     │ │
                │ │ match_teams                 │ │
                │ │ match_team_players           │ │
                │ │ player_ratings               │ │
                │ │ elo_settings                 │ │
                │ └──────────────┬──────────────┘ │
                │                │                │
                │ ┌──────────────▼──────────────┐ │
                │ │           Views             │ │
                │ │                             │ │
                │ │ leaderboard                 │ │
                │ │ player_records              │ │
                │ │ course_records              │ │
                │ │ partnerships                │ │
                │ │ head_to_head                │ │
                │ │ match_history               │ │
                │ │ elo_history                 │ │
                │ │ match_analytics             │ │
                │ └──────────────┬──────────────┘ │
                │                │                │
                │ ┌──────────────▼──────────────┐ │
                │ │          RPCs               │ │
                │ │                             │ │
                │ │ record_match                │ │
                │ │ update_match                │ │
                │ │ delete_match                │ │
                │ │ recalculate_all_elo         │ │
                │ │ get_player_stats            │ │
                │ │ get_player_overview         │ │
                │ └─────────────────────────────┘ │
                └─────────────────────────────────┘
```

## Core architectural principle

**Matches are the source of truth. ELO and statistics are derived from matches.**

This means the application can always recover from an incorrect rating, an edited historical match, a deleted match, or even a future change to the ELO algorithm by replaying the match history from the beginning.