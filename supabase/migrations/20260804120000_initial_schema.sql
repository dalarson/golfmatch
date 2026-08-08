create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.match_result as enum ('WIN', 'LOSS', 'PUSH');
create type public.score_type as enum ('UP', 'HOLES_UP', 'PUSH');

create table public.elo_settings (
  id boolean primary key default true check (id),
  initial_rating integer not null default 1500 check (initial_rating > 0),
  k_factor integer not null default 32 check (k_factor > 0),
  updated_at timestamptz not null default now()
);

insert into public.elo_settings (id, initial_rating, k_factor)
values (true, 1500, 32);

create table public.players (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  elo_rating integer not null default 1500 check (elo_rating > 0),
  elo_peak integer not null default 1500 check (elo_peak >= elo_rating),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index players_name_unique_idx on public.players (lower(btrim(name)));

create table public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  location text not null check (btrim(location) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index courses_name_location_unique_idx
  on public.courses (lower(btrim(name)), lower(btrim(location)));

create table public.matches (
  id uuid primary key default extensions.gen_random_uuid(),
  date date not null default current_date,
  course_id uuid not null references public.courses(id) on delete restrict,
  holes smallint not null check (holes in (9, 18)),
  team_size smallint not null check (team_size in (1, 2)),
  score_type public.score_type not null,
  score_value smallint,
  holes_remaining smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_score_representation_check check (
    (score_type = 'PUSH' and score_value is null and holes_remaining is null)
    or (
      score_type = 'UP'
      and score_value is not null
      and score_value > 0
      and score_value <= holes
      and holes_remaining is null
    )
    or (
      score_type = 'HOLES_UP'
      and score_value is not null
      and holes_remaining is not null
      and score_value > 0
      and holes_remaining > 0
      and score_value > holes_remaining
      and score_value <= holes
      and holes_remaining < holes
    )
  )
);

create table public.match_teams (
  id uuid primary key default extensions.gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_number smallint not null check (team_number in (1, 2)),
  result public.match_result not null,
  created_at timestamptz not null default now(),
  unique (match_id, team_number),
  unique (id, match_id)
);

create table public.match_team_players (
  id uuid primary key default extensions.gen_random_uuid(),
  match_team_id uuid not null references public.match_teams(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (match_team_id, player_id),
  unique (match_id, player_id),
  foreign key (match_team_id, match_id)
    references public.match_teams(id, match_id) on delete cascade
);

create table public.player_ratings (
  id uuid primary key default extensions.gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  match_team_id uuid not null references public.match_teams(id) on delete cascade,
  rating_before integer not null check (rating_before > 0),
  rating_after integer not null check (rating_after > 0),
  rating_change integer not null,
  team_rating numeric not null,
  opponent_team_rating numeric not null,
  created_at timestamptz not null default now(),
  unique (match_id, player_id),
  foreign key (match_team_id, match_id)
    references public.match_teams(id, match_id) on delete cascade,
  check (rating_after = rating_before + rating_change)
);

create index matches_date_order_idx on public.matches (date, created_at, id);
create index matches_course_date_idx on public.matches (course_id, date);
create index match_teams_match_id_idx on public.match_teams (match_id);
create index match_team_players_team_idx on public.match_team_players (match_team_id);
create index match_team_players_player_idx on public.match_team_players (player_id);
create index player_ratings_player_created_idx on public.player_ratings (player_id, created_at);
create index player_ratings_match_idx on public.player_ratings (match_id);

create function public.calculate_elo_expected(rating_a numeric, rating_b numeric)
returns numeric
language sql
immutable
strict
parallel safe
set search_path = pg_catalog
as $$
  select 1.0 / (1.0 + power(10.0, (rating_b - rating_a) / 400.0));
$$;

create function public.get_result_value(result public.match_result)
returns numeric
language sql
immutable
strict
parallel safe
set search_path = pg_catalog, public
as $$
  select case result
    when 'WIN' then 1.0
    when 'PUSH' then 0.5
    when 'LOSS' then 0.0
  end;
$$;

create function public.format_match_score(
  score_type public.score_type,
  score_value integer,
  holes_remaining integer
)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog, public
as $$
  select case
    when score_type = 'PUSH' then 'PUSH'
    when score_type = 'UP' then score_value::text || 'UP'
    when score_type = 'HOLES_UP' then score_value::text || '&' || holes_remaining::text
  end;
$$;

create function public.validate_match_input(
  p_holes smallint,
  p_team_size smallint,
  p_score_type public.score_type,
  p_score_value smallint,
  p_holes_remaining smallint,
  p_team_1_player_ids uuid[],
  p_team_2_player_ids uuid[],
  p_team_1_result public.match_result,
  p_team_2_result public.match_result
)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_all_players uuid[];
begin
  if p_holes not in (9, 18) then
    raise exception using errcode = '22023', message = 'Holes must be 9 or 18';
  end if;
  if p_team_size not in (1, 2) then
    raise exception using errcode = '22023', message = 'Team size must be 1 or 2';
  end if;
  if coalesce(cardinality(p_team_1_player_ids), 0) <> p_team_size
     or coalesce(cardinality(p_team_2_player_ids), 0) <> p_team_size then
    raise exception using errcode = '22023',
      message = format('A %sv%s match requires exactly %s player(s) per team',
        p_team_size, p_team_size, p_team_size);
  end if;

  v_all_players := p_team_1_player_ids || p_team_2_player_ids;
  if array_position(v_all_players, null) is not null
     or (select count(distinct id) from unnest(v_all_players) as ids(id))
        <> cardinality(v_all_players) then
    raise exception using errcode = '22023',
      message = 'Players must be unique and cannot appear on both teams';
  end if;

  if not (
    (p_team_1_result = 'WIN' and p_team_2_result = 'LOSS')
    or (p_team_1_result = 'LOSS' and p_team_2_result = 'WIN')
    or (p_team_1_result = 'PUSH' and p_team_2_result = 'PUSH')
  ) then
    raise exception using errcode = '22023',
      message = 'Results must be WIN/LOSS, LOSS/WIN, or PUSH/PUSH';
  end if;

  if (p_team_1_result = 'PUSH') <> (p_score_type = 'PUSH') then
    raise exception using errcode = '22023',
      message = 'Push results require a PUSH score and PUSH scores require push results';
  end if;

  if not coalesce((
    (p_score_type = 'PUSH' and p_score_value is null and p_holes_remaining is null)
    or (p_score_type = 'UP' and p_score_value is not null and p_score_value > 0
        and p_score_value <= p_holes and p_holes_remaining is null)
    or (p_score_type = 'HOLES_UP' and p_score_value is not null
        and p_holes_remaining is not null and p_score_value > 0
        and p_holes_remaining > 0 and p_score_value > p_holes_remaining
        and p_score_value <= p_holes and p_holes_remaining < p_holes)
  ), false) then
    raise exception using errcode = '22023', message = 'Invalid score representation';
  end if;

  if (select count(*) from public.players where id = any(v_all_players))
     <> cardinality(v_all_players) then
    raise exception using errcode = '23503', message = 'One or more players do not exist';
  end if;
end;
$$;

create function public.assert_match_structure(p_match_id uuid)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_match public.matches%rowtype;
  v_team_count integer;
  v_bad_team_count integer;
  v_results public.match_result[];
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found then
    return;
  end if;

  select count(*), count(*) filter (where player_count <> v_match.team_size),
         array_agg(result order by team_number)
  into v_team_count, v_bad_team_count, v_results
  from (
    select mt.team_number, mt.result, count(mtp.id) as player_count
    from public.match_teams mt
    left join public.match_team_players mtp on mtp.match_team_id = mt.id
    where mt.match_id = p_match_id
    group by mt.id, mt.team_number, mt.result
  ) teams;

  if v_team_count <> 2 or v_bad_team_count <> 0 then
    raise exception using errcode = '23514',
      message = 'Each match must have exactly two complete teams';
  end if;
  if v_results not in (
    array['WIN', 'LOSS']::public.match_result[],
    array['LOSS', 'WIN']::public.match_result[],
    array['PUSH', 'PUSH']::public.match_result[]
  ) then
    raise exception using errcode = '23514', message = 'Match team results are not complementary';
  end if;
  if (v_results[1] = 'PUSH') <> (v_match.score_type = 'PUSH') then
    raise exception using errcode = '23514', message = 'Match result and score type disagree';
  end if;
end;
$$;

create function public.enforce_match_structure()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_match_id uuid;
begin
  if tg_table_name = 'matches' then
    v_match_id := coalesce(new.id, old.id);
  else
    v_match_id := coalesce(new.match_id, old.match_id);
  end if;
  perform public.assert_match_structure(v_match_id);
  return null;
end;
$$;

create constraint trigger matches_structure_check
after insert or update on public.matches
deferrable initially deferred
for each row execute function public.enforce_match_structure();

create constraint trigger match_teams_structure_check
after insert or update or delete on public.match_teams
deferrable initially deferred
for each row execute function public.enforce_match_structure();

create constraint trigger match_team_players_structure_check
after insert or update or delete on public.match_team_players
deferrable initially deferred
for each row execute function public.enforce_match_structure();

create function public.apply_match_elo(
  p_match_id uuid,
  p_k_factor integer
)
returns void
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_team_1_id uuid;
  v_team_2_id uuid;
  v_team_1_result public.match_result;
  v_team_2_result public.match_result;
  v_team_1_rating numeric;
  v_team_2_rating numeric;
  v_team_1_change integer;
  v_team_2_change integer;
  v_player record;
begin
  perform public.assert_match_structure(p_match_id);

  select id, result into strict v_team_1_id, v_team_1_result
  from public.match_teams where match_id = p_match_id and team_number = 1;
  select id, result into strict v_team_2_id, v_team_2_result
  from public.match_teams where match_id = p_match_id and team_number = 2;

  select avg(p.elo_rating) into v_team_1_rating
  from public.match_team_players mtp
  join public.players p on p.id = mtp.player_id
  where mtp.match_team_id = v_team_1_id;
  select avg(p.elo_rating) into v_team_2_rating
  from public.match_team_players mtp
  join public.players p on p.id = mtp.player_id
  where mtp.match_team_id = v_team_2_id;

  v_team_1_change := round(p_k_factor * (
    public.get_result_value(v_team_1_result)
    - public.calculate_elo_expected(v_team_1_rating, v_team_2_rating)
  ));
  v_team_2_change := round(p_k_factor * (
    public.get_result_value(v_team_2_result)
    - public.calculate_elo_expected(v_team_2_rating, v_team_1_rating)
  ));

  for v_player in
    select mt.id as team_id, mt.team_number, mtp.player_id, p.elo_rating
    from public.match_teams mt
    join public.match_team_players mtp on mtp.match_team_id = mt.id
    join public.players p on p.id = mtp.player_id
    where mt.match_id = p_match_id
    order by mt.team_number, mtp.player_id
  loop
    insert into public.player_ratings (
      player_id, match_id, match_team_id, rating_before, rating_after,
      rating_change, team_rating, opponent_team_rating
    )
    values (
      v_player.player_id,
      p_match_id,
      v_player.team_id,
      v_player.elo_rating,
      v_player.elo_rating + case when v_player.team_number = 1
        then v_team_1_change else v_team_2_change end,
      case when v_player.team_number = 1 then v_team_1_change else v_team_2_change end,
      case when v_player.team_number = 1 then v_team_1_rating else v_team_2_rating end,
      case when v_player.team_number = 1 then v_team_2_rating else v_team_1_rating end
    );
  end loop;

  update public.players p
  set elo_rating = pr.rating_after,
      elo_peak = greatest(p.elo_peak, pr.rating_after),
      updated_at = now()
  from public.player_ratings pr
  where pr.match_id = p_match_id and pr.player_id = p.id;
end;
$$;

create function public.recalculate_all_elo()
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
  set elo_rating = v_initial_rating, elo_peak = v_initial_rating, updated_at = now();
  get diagnostics players_processed = row_count;

  delete from public.player_ratings;
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

create function public.create_player(p_name text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_initial_rating integer;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception using errcode = '22023', message = 'Player name is required';
  end if;
  select initial_rating into strict v_initial_rating from public.elo_settings where id;
  insert into public.players (name, elo_rating, elo_peak)
  values (btrim(p_name), v_initial_rating, v_initial_rating)
  returning id into v_id;
  return v_id;
end;
$$;

create function public.update_player(p_player_id uuid, p_name text)
returns public.players
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_player public.players;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception using errcode = '22023', message = 'Player name is required';
  end if;
  update public.players
  set name = btrim(p_name), updated_at = now()
  where id = p_player_id
  returning * into v_player;
  if not found then
    raise exception using errcode = 'P0002', message = 'Player not found';
  end if;
  return v_player;
end;
$$;

create function public.create_course(p_name text, p_location text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
begin
  if p_name is null or btrim(p_name) = ''
     or p_location is null or btrim(p_location) = '' then
    raise exception using errcode = '22023', message = 'Course name and location are required';
  end if;
  insert into public.courses (name, location)
  values (btrim(p_name), btrim(p_location))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.update_course(p_course_id uuid, p_name text, p_location text)
returns public.courses
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_course public.courses;
begin
  if p_name is null or btrim(p_name) = ''
     or p_location is null or btrim(p_location) = '' then
    raise exception using errcode = '22023', message = 'Course name and location are required';
  end if;
  update public.courses
  set name = btrim(p_name), location = btrim(p_location), updated_at = now()
  where id = p_course_id
  returning * into v_course;
  if not found then
    raise exception using errcode = 'P0002', message = 'Course not found';
  end if;
  return v_course;
end;
$$;

create function public.write_match(
  p_match_id uuid,
  p_date date,
  p_course_id uuid,
  p_holes smallint,
  p_team_size smallint,
  p_score_type public.score_type,
  p_score_value smallint,
  p_holes_remaining smallint,
  p_team_1_player_ids uuid[],
  p_team_2_player_ids uuid[],
  p_team_1_result public.match_result,
  p_team_2_result public.match_result
)
returns uuid
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_match_id uuid;
  v_team_1_id uuid;
  v_team_2_id uuid;
begin
  if p_date is null then
    raise exception using errcode = '22023', message = 'Match date is required';
  end if;
  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception using errcode = '23503', message = 'Course not found';
  end if;

  perform public.validate_match_input(
    p_holes, p_team_size, p_score_type, p_score_value, p_holes_remaining,
    p_team_1_player_ids, p_team_2_player_ids, p_team_1_result, p_team_2_result
  );

  if p_match_id is null then
    insert into public.matches (
      date, course_id, holes, team_size, score_type, score_value, holes_remaining
    ) values (
      p_date, p_course_id, p_holes, p_team_size, p_score_type, p_score_value, p_holes_remaining
    ) returning id into v_match_id;
  else
    update public.matches
    set date = p_date, course_id = p_course_id, holes = p_holes,
        team_size = p_team_size, score_type = p_score_type,
        score_value = p_score_value, holes_remaining = p_holes_remaining,
        updated_at = now()
    where id = p_match_id
    returning id into v_match_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'Match not found';
    end if;
    delete from public.match_teams where match_id = v_match_id;
  end if;

  insert into public.match_teams (match_id, team_number, result)
  values (v_match_id, 1, p_team_1_result) returning id into v_team_1_id;
  insert into public.match_teams (match_id, team_number, result)
  values (v_match_id, 2, p_team_2_result) returning id into v_team_2_id;

  insert into public.match_team_players (match_team_id, match_id, player_id)
  select v_team_1_id, v_match_id, player_id from unnest(p_team_1_player_ids) player_id;
  insert into public.match_team_players (match_team_id, match_id, player_id)
  select v_team_2_id, v_match_id, player_id from unnest(p_team_2_player_ids) player_id;

  perform public.assert_match_structure(v_match_id);
  return v_match_id;
end;
$$;

create function public.record_match(
  p_date date,
  p_course_id uuid,
  p_holes smallint,
  p_team_size smallint,
  p_score_type public.score_type,
  p_score_value smallint,
  p_holes_remaining smallint,
  p_team_1_player_ids uuid[],
  p_team_2_player_ids uuid[],
  p_team_1_result public.match_result,
  p_team_2_result public.match_result
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_match_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('public.elo_recalculation'));
  v_match_id := public.write_match(
    null, p_date, p_course_id, p_holes, p_team_size, p_score_type,
    p_score_value, p_holes_remaining, p_team_1_player_ids, p_team_2_player_ids,
    p_team_1_result, p_team_2_result
  );
  perform public.recalculate_all_elo();
  return v_match_id;
end;
$$;

create function public.update_match(
  p_match_id uuid,
  p_date date,
  p_course_id uuid,
  p_holes smallint,
  p_team_size smallint,
  p_score_type public.score_type,
  p_score_value smallint,
  p_holes_remaining smallint,
  p_team_1_player_ids uuid[],
  p_team_2_player_ids uuid[],
  p_team_1_result public.match_result,
  p_team_2_result public.match_result
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_match_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('public.elo_recalculation'));
  v_match_id := public.write_match(
    p_match_id, p_date, p_course_id, p_holes, p_team_size, p_score_type,
    p_score_value, p_holes_remaining, p_team_1_player_ids, p_team_2_player_ids,
    p_team_1_result, p_team_2_result
  );
  perform public.recalculate_all_elo();
  return v_match_id;
end;
$$;

create function public.delete_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('public.elo_recalculation'));
  delete from public.matches where id = p_match_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Match not found';
  end if;
  perform public.recalculate_all_elo();
end;
$$;

create view public.player_records
with (security_invoker = true)
as
select
  p.id as player_id,
  count(mt.match_id)::integer as matches,
  count(*) filter (where mt.result = 'WIN')::integer as wins,
  count(*) filter (where mt.result = 'LOSS')::integer as losses,
  count(*) filter (where mt.result = 'PUSH')::integer as pushes,
  case when count(mt.match_id) = 0 then 0::numeric
    else round(100.0 * count(*) filter (where mt.result = 'WIN') / count(mt.match_id), 1)
  end as win_percentage
from public.players p
left join public.match_team_players mtp on mtp.player_id = p.id
left join public.match_teams mt on mt.id = mtp.match_team_id
group by p.id;

create view public.leaderboard
with (security_invoker = true)
as
select
  row_number() over (order by p.elo_rating desc, p.name, p.id) as rank,
  p.id as player_id,
  p.name as player_name,
  p.elo_rating,
  p.elo_peak,
  r.matches,
  r.wins,
  r.losses,
  r.pushes,
  r.win_percentage
from public.players p
join public.player_records r on r.player_id = p.id;

create view public.player_course_records
with (security_invoker = true)
as
select
  mtp.player_id,
  c.id as course_id,
  c.name as course_name,
  count(*)::integer as matches,
  count(*) filter (where mt.result = 'WIN')::integer as wins,
  count(*) filter (where mt.result = 'LOSS')::integer as losses,
  count(*) filter (where mt.result = 'PUSH')::integer as pushes,
  round(100.0 * count(*) filter (where mt.result = 'WIN') / count(*), 1) as win_percentage,
  coalesce(sum(pr.rating_change), 0)::integer as elo_change
from public.match_team_players mtp
join public.match_teams mt on mt.id = mtp.match_team_id
join public.matches m on m.id = mt.match_id
join public.courses c on c.id = m.course_id
left join public.player_ratings pr on pr.match_id = m.id and pr.player_id = mtp.player_id
group by mtp.player_id, c.id, c.name;

create view public.player_partnerships
with (security_invoker = true)
as
with pairs as (
  select least(a.player_id, b.player_id) as player_a,
         greatest(a.player_id, b.player_id) as player_b,
         mt.result
  from public.match_teams mt
  join public.matches m on m.id = mt.match_id and m.team_size = 2
  join public.match_team_players a on a.match_team_id = mt.id
  join public.match_team_players b on b.match_team_id = mt.id and a.player_id < b.player_id
), directional as (
  select player_a as player_id, player_b as partner_id, result from pairs
  union all
  select player_b, player_a, result from pairs
)
select d.player_id, d.partner_id, p.name as player_name, partner.name as partner_name,
       count(*)::integer as matches,
       count(*) filter (where d.result = 'WIN')::integer as wins,
       count(*) filter (where d.result = 'LOSS')::integer as losses,
       count(*) filter (where d.result = 'PUSH')::integer as pushes,
       round(100.0 * count(*) filter (where d.result = 'WIN') / count(*), 1) as win_percentage
from directional d
join public.players p on p.id = d.player_id
join public.players partner on partner.id = d.partner_id
group by d.player_id, d.partner_id, p.name, partner.name;

create view public.player_head_to_head
with (security_invoker = true)
as
with opponents as (
  select mine.player_id, theirs.player_id as opponent_id, my_team.result
  from public.match_teams my_team
  join public.match_team_players mine on mine.match_team_id = my_team.id
  join public.match_teams their_team
    on their_team.match_id = my_team.match_id and their_team.id <> my_team.id
  join public.match_team_players theirs on theirs.match_team_id = their_team.id
)
select o.player_id, o.opponent_id, p.name as player_name, opponent.name as opponent_name,
       count(*)::integer as matches,
       count(*) filter (where o.result = 'WIN')::integer as wins,
       count(*) filter (where o.result = 'LOSS')::integer as losses,
       count(*) filter (where o.result = 'PUSH')::integer as pushes,
       round(100.0 * count(*) filter (where o.result = 'WIN') / count(*), 1) as win_percentage
from opponents o
join public.players p on p.id = o.player_id
join public.players opponent on opponent.id = o.opponent_id
group by o.player_id, o.opponent_id, p.name, opponent.name;

create view public.player_match_history
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
  pr.rating_change as elo_change
from public.matches m
join public.courses c on c.id = m.course_id
join public.match_teams mt on mt.match_id = m.id
join public.match_team_players mtp on mtp.match_team_id = mt.id
join public.player_ratings pr on pr.match_id = m.id and pr.player_id = mtp.player_id;

create view public.player_elo_history
with (security_invoker = true)
as
select pr.player_id, pr.match_id, m.date, c.name as course_name,
       pr.rating_before, pr.rating_after, pr.rating_change
from public.player_ratings pr
join public.matches m on m.id = pr.match_id
join public.courses c on c.id = m.course_id;

create view public.match_summary
with (security_invoker = true)
as
select
  m.id as match_id,
  m.date,
  m.course_id,
  c.name as course_name,
  m.holes,
  m.team_size,
  public.format_match_score(m.score_type, m.score_value, m.holes_remaining) as score,
  (array_agg(mt.result order by mt.team_number)
    filter (where mt.team_number = 1))[1] as team_1_result,
  (array_agg(mt.result order by mt.team_number)
    filter (where mt.team_number = 2))[1] as team_2_result,
  jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by p.name)
    filter (where mt.team_number = 1) as team_1_players,
  jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by p.name)
    filter (where mt.team_number = 2) as team_2_players
from public.matches m
join public.courses c on c.id = m.course_id
join public.match_teams mt on mt.match_id = m.id
join public.match_team_players mtp on mtp.match_team_id = mt.id
join public.players p on p.id = mtp.player_id
group by m.id, c.id, c.name;

create view public.match_analytics
with (security_invoker = true)
as
with team_ratings as (
  select m.id as match_id, m.date, m.course_id, m.holes, m.team_size,
         mt.team_number, mt.result, avg(pr.team_rating) as team_rating
  from public.matches m
  join public.match_teams mt on mt.match_id = m.id
  join public.player_ratings pr on pr.match_team_id = mt.id
  group by m.id, mt.id, mt.team_number, mt.result
)
select
  match_id, date, course_id, holes, team_size,
  max(team_rating) filter (where team_number = 1) as team_1_rating,
  max(team_rating) filter (where team_number = 2) as team_2_rating,
  abs(max(team_rating) filter (where team_number = 1)
      - max(team_rating) filter (where team_number = 2)) as rating_difference,
  max(team_rating) filter (where result = 'WIN') as winning_team_rating,
  max(team_rating) filter (where result = 'LOSS') as losing_team_rating,
  case when bool_or(result = 'PUSH') then null
    else greatest(
      max(team_rating) filter (where result = 'LOSS')
      - max(team_rating) filter (where result = 'WIN'),
      0
    )
  end as upset_margin
from team_ratings
group by match_id, date, course_id, holes, team_size;

create function public.get_player_stats(
  p_player_id uuid,
  p_course_id uuid default null,
  p_partner_id uuid default null,
  p_opponent_id uuid default null,
  p_holes smallint default null,
  p_team_size smallint default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  matches integer,
  wins integer,
  losses integer,
  pushes integer,
  win_percentage numeric,
  elo_change integer
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with filtered as (
    select m.id, mt.id as team_id, mt.result, pr.rating_change
    from public.matches m
    join public.match_teams mt on mt.match_id = m.id
    join public.match_team_players mine
      on mine.match_team_id = mt.id and mine.player_id = p_player_id
    join public.player_ratings pr on pr.match_id = m.id and pr.player_id = p_player_id
    where (p_course_id is null or m.course_id = p_course_id)
      and (p_holes is null or m.holes = p_holes)
      and (p_team_size is null or m.team_size = p_team_size)
      and (p_start_date is null or m.date >= p_start_date)
      and (p_end_date is null or m.date <= p_end_date)
      and (p_partner_id is null or exists (
        select 1 from public.match_team_players partner
        where partner.match_team_id = mt.id and partner.player_id = p_partner_id
      ))
      and (p_opponent_id is null or exists (
        select 1
        from public.match_teams opposing_team
        join public.match_team_players opponent on opponent.match_team_id = opposing_team.id
        where opposing_team.match_id = m.id and opposing_team.id <> mt.id
          and opponent.player_id = p_opponent_id
      ))
  )
  select count(*)::integer,
         count(*) filter (where result = 'WIN')::integer,
         count(*) filter (where result = 'LOSS')::integer,
         count(*) filter (where result = 'PUSH')::integer,
         case when count(*) = 0 then 0::numeric
           else round(100.0 * count(*) filter (where result = 'WIN') / count(*), 1)
         end,
         coalesce(sum(rating_change), 0)::integer
  from filtered;
$$;

create function public.get_player_overview(p_player_id uuid)
returns table (
  player_id uuid,
  name text,
  current_elo integer,
  peak_elo integer,
  matches integer,
  wins integer,
  losses integer,
  pushes integer,
  win_percentage numeric,
  elo_change_last_5 integer,
  elo_change_last_10 integer,
  elo_change_last_25 integer
)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with recent as (
    select pr.rating_change,
           row_number() over (order by m.date desc, m.created_at desc, m.id desc) as rn
    from public.player_ratings pr
    join public.matches m on m.id = pr.match_id
    where pr.player_id = p_player_id
  ), changes as (
    select coalesce(sum(rating_change) filter (where rn <= 5), 0)::integer as last_5,
           coalesce(sum(rating_change) filter (where rn <= 10), 0)::integer as last_10,
           coalesce(sum(rating_change) filter (where rn <= 25), 0)::integer as last_25
    from recent
  )
  select p.id, p.name, p.elo_rating, p.elo_peak,
         r.matches, r.wins, r.losses, r.pushes, r.win_percentage,
         c.last_5, c.last_10, c.last_25
  from public.players p
  join public.player_records r on r.player_id = p.id
  cross join changes c
  where p.id = p_player_id;
$$;

alter table public.elo_settings enable row level security;
alter table public.players enable row level security;
alter table public.courses enable row level security;
alter table public.matches enable row level security;
alter table public.match_teams enable row level security;
alter table public.match_team_players enable row level security;
alter table public.player_ratings enable row level security;

create policy "Public read ELO settings" on public.elo_settings for select using (true);
create policy "Public read players" on public.players for select using (true);
create policy "Public read courses" on public.courses for select using (true);
create policy "Public read matches" on public.matches for select using (true);
create policy "Public read match teams" on public.match_teams for select using (true);
create policy "Public read match team players" on public.match_team_players for select using (true);
create policy "Public read player ratings" on public.player_ratings for select using (true);

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.elo_settings, public.players, public.courses, public.matches,
  public.match_teams, public.match_team_players, public.player_ratings,
  public.leaderboard, public.player_records, public.player_course_records,
  public.player_partnerships, public.player_head_to_head, public.player_match_history,
  public.player_elo_history, public.match_summary, public.match_analytics
to anon, authenticated;

grant execute on function public.calculate_elo_expected(numeric, numeric),
  public.get_result_value(public.match_result),
  public.format_match_score(public.score_type, integer, integer),
  public.get_player_stats(uuid, uuid, uuid, uuid, smallint, smallint, date, date),
  public.get_player_overview(uuid)
to anon, authenticated;

grant execute on function public.create_player(text),
  public.update_player(uuid, text),
  public.create_course(text, text),
  public.update_course(uuid, text, text),
  public.record_match(date, uuid, smallint, smallint, public.score_type, smallint,
    smallint, uuid[], uuid[], public.match_result, public.match_result),
  public.update_match(uuid, date, uuid, smallint, smallint, public.score_type,
    smallint, smallint, uuid[], uuid[], public.match_result, public.match_result),
  public.delete_match(uuid),
  public.recalculate_all_elo()
to authenticated;
