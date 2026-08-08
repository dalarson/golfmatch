create or replace view public.player_match_history
with (security_invoker = true)
as
select
  m.id as match_id,
  mtp.player_id,
  m.date,
  m.course_id,
  c.name as course_name,
  m.holes,
  m.team_size,
  mt.result as player_result,
  m.score_type,
  m.score_value,
  m.holes_remaining,
  pr.rating_before as elo_before,
  pr.rating_after as elo_after,
  pr.rating_change as elo_change,
  m.created_at
from public.matches m
join public.courses c on c.id = m.course_id
join public.match_teams mt on mt.match_id = m.id
join public.match_team_players mtp on mtp.match_team_id = mt.id
join public.player_ratings pr on pr.match_id = m.id and pr.player_id = mtp.player_id;

create or replace view public.player_elo_history
with (security_invoker = true)
as
select
  pr.player_id,
  pr.match_id,
  m.date,
  c.name as course_name,
  pr.rating_before,
  pr.rating_after,
  pr.rating_change,
  m.created_at
from public.player_ratings pr
join public.matches m on m.id = pr.match_id
join public.courses c on c.id = m.course_id;
