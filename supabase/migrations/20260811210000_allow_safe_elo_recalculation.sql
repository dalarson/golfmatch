create or replace function public.recalculate_all_elo()
returns table (players_processed integer, matches_processed integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_initial_rating integer;
  v_k_factor integer;
  v_match record;
begin
  perform pg_advisory_xact_lock(hashtext('public.elo_recalculation'));

  select initial_rating, k_factor into strict v_initial_rating, v_k_factor
  from public.elo_settings where id;

  perform 1 from public.players order by id for update;
  update public.players
  set elo_rating = v_initial_rating, elo_peak = v_initial_rating, updated_at = now()
  where 1 = 1;
  get diagnostics players_processed = row_count;

  delete from public.player_ratings where 1 = 1;
  matches_processed := 0;

  for v_match in
    select id from public.matches order by date, created_at, id
  loop
    perform public.apply_match_elo(v_match.id, v_k_factor);
    matches_processed := matches_processed + 1;
  end loop;

  return next;
end;
$$;

grant execute on function public.recalculate_all_elo() to anon, authenticated;
