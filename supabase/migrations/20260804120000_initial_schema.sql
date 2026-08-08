-- ==========================================
-- 1. EXTENSIONS & APP CONFIG
-- ==========================================
create extension if not exists pgcrypto;

create table if not exists public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config (key, value)
values ('admin_code', 'GOLF2026')
on conflict (key) do update set value = excluded.value;


-- ==========================================
-- 2. DOMAIN TABLES
-- ==========================================
create table if not exists public.courses (
  id text primary key,
  name text not null,
  location text not null,
  default_holes smallint not null default 18 check (default_holes in (9, 18)),
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id text primary key,
  display_name text not null,
  current_elo integer not null default 1200,
  wins integer not null default 0,
  losses integer not null default 0,
  ties integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(id) on delete restrict,
  match_type text not null check (match_type in ('1v1', '2v2')),
  holes_played smallint not null check (holes_played in (9, 18)),
  result_code text not null,
  is_tie boolean not null default false,
  played_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  team_side smallint not null check (team_side in (1, 2)),
  gross_score integer not null,
  strokes_given integer not null default 0,
  is_winner boolean not null default false,
  pre_match_elo integer not null,
  post_match_elo integer not null,
  elo_delta integer not null,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);


-- ==========================================
-- 3. INDEXES
-- ==========================================
create index if not exists matches_course_id_idx on public.matches (course_id);
create index if not exists matches_played_at_idx on public.matches (played_at desc);
create index if not exists match_players_player_id_idx on public.match_players (player_id);
create index if not exists match_players_match_id_idx on public.match_players (match_id);


-- ==========================================
-- 4. ROW LEVEL SECURITY & POLICIES
-- ==========================================
alter table public.courses enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;

drop policy if exists "Public read courses" on public.courses;
create policy "Public read courses" on public.courses for select using (true);

drop policy if exists "Public read players" on public.players;
create policy "Public read players" on public.players for select using (true);

drop policy if exists "Public read matches" on public.matches;
create policy "Public read matches" on public.matches for select using (true);

drop policy if exists "Public read match players" on public.match_players;
create policy "Public read match players" on public.match_players for select using (true);


-- ==========================================
-- 5. PUBLIC RPC FUNCTIONS
-- ==========================================

-- Helper: Create Player
drop function if exists public.create_player(text, text);

create or replace function public.create_player(
  p_id text,
  p_display_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null or p_id = '' then
    raise exception 'Player id is required';
  end if;

  if p_display_name is null or p_display_name = '' then
    raise exception 'Display name is required';
  end if;

  insert into public.players (id, display_name)
  values (p_id, p_display_name);

  return p_id;
end;
$$;

grant execute on function public.create_player(text, text) to anon, authenticated;

-- Helper: Submit Match & Calculate Elo
drop function if exists public.submit_match(text, text, integer, text, boolean, jsonb);
drop function if exists public.submit_match(text, text, integer, text, boolean, date, jsonb);

create or replace function public.submit_match(
  p_course_id text,
  p_match_type text,
  p_holes_played integer,
  p_result_code text,
  p_is_tie boolean,
  p_played_at date,
  p_players jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_players jsonb;
  v_expected_count integer;
  v_match_id uuid;
  v_team1_avg numeric;
  v_team2_avg numeric;
  v_expected_team1 numeric;
  v_actual_team1 numeric;
  v_delta integer;
  v_player jsonb;
  v_player_id text;
  v_team_side integer;
  v_gross_score integer;
  v_strokes_given integer;
  v_is_winner boolean;
  v_pre_match_elo integer;
  v_post_match_elo integer;
begin
  -- Unwrap double-encoded string scalars from clients (e.g. Supabase JS / PostgREST)
  v_players := case
    when jsonb_typeof(p_players) = 'string'
    then (p_players #>> '{}')::jsonb
    else p_players
  end;

  if p_match_type not in ('1v1', '2v2') then
    raise exception 'Invalid match type';
  end if;

  v_expected_count := case when p_match_type = '1v1' then 2 else 4 end;

  if v_players is null or jsonb_array_length(v_players) <> v_expected_count then
    raise exception 'Invalid player payload';
  end if;

  insert into public.matches (course_id, match_type, holes_played, result_code, is_tie, played_at)
  values (p_course_id, p_match_type, p_holes_played, p_result_code, p_is_tie, p_played_at)
  returning id into v_match_id;

  create temporary table if not exists tmp_match_players (
    player_id text,
    team_side integer,
    gross_score integer,
    strokes_given integer,
    is_winner boolean,
    pre_match_elo integer,
    post_match_elo integer,
    elo_delta integer
  ) on commit drop;

  truncate tmp_match_players;

  for v_player in select * from jsonb_array_elements(v_players)
  loop
    v_player_id := v_player->>'player_id';
    v_team_side := (v_player->>'team_side')::integer;
    v_gross_score := (v_player->>'gross_score')::integer;
    v_strokes_given := coalesce((v_player->>'strokes_given')::integer, 0);
    v_is_winner := coalesce((v_player->>'is_winner')::boolean, false);

    select current_elo into v_pre_match_elo
    from public.players
    where id = v_player_id;

    if v_pre_match_elo is null then
      raise exception 'Unknown player %', v_player_id;
    end if;

    insert into tmp_match_players (
      player_id,
      team_side,
      gross_score,
      strokes_given,
      is_winner,
      pre_match_elo
    ) values (
      v_player_id,
      v_team_side,
      v_gross_score,
      v_strokes_given,
      v_is_winner,
      v_pre_match_elo
    );
  end loop;

  select avg(pre_match_elo) into v_team1_avg from tmp_match_players where team_side = 1;
  select avg(pre_match_elo) into v_team2_avg from tmp_match_players where team_side = 2;

  v_expected_team1 := 1.0 / (1.0 + power(10.0, (coalesce(v_team2_avg, 1200) - coalesce(v_team1_avg, 1200)) / 400.0));
  v_actual_team1 := case
    when p_is_tie then 0.5
    when exists (select 1 from tmp_match_players where team_side = 1 and is_winner) then 1.0
    else 0.0
  end;

  v_delta := round(32 * (v_actual_team1 - v_expected_team1));

  for v_player in select * from tmp_match_players
  loop
    v_player_id := v_player->>'player_id';
    v_team_side := (v_player->>'team_side')::integer;
    v_pre_match_elo := (v_player->>'pre_match_elo')::integer;

    if p_is_tie then
      v_post_match_elo := v_pre_match_elo;
      update public.players
      set ties = ties + 1
      where id = v_player_id;
    elsif v_team_side = 1 then
      v_post_match_elo := v_pre_match_elo + v_delta;
      update public.players
      set current_elo = v_post_match_elo,
          wins = wins + 1
      where id = v_player_id;
    else
      v_post_match_elo := v_pre_match_elo - v_delta;
      update public.players
      set current_elo = v_post_match_elo,
          losses = losses + 1
      where id = v_player_id;
    end if;

    update tmp_match_players
    set post_match_elo = v_post_match_elo,
        elo_delta = case when v_team_side = 1 then v_post_match_elo - v_pre_match_elo else v_pre_match_elo - v_post_match_elo end
    where player_id = v_player_id;

    insert into public.match_players (
      match_id,
      player_id,
      team_side,
      gross_score,
      strokes_given,
      is_winner,
      pre_match_elo,
      post_match_elo,
      elo_delta
    )
    select
      v_match_id,
      player_id,
      team_side,
      gross_score,
      strokes_given,
      is_winner,
      pre_match_elo,
      post_match_elo,
      elo_delta
    from tmp_match_players
    where player_id = v_player_id;
  end loop;

  return v_match_id;
end;
$$;

grant execute on function public.submit_match(text, text, integer, text, boolean, date, jsonb) to anon, authenticated;