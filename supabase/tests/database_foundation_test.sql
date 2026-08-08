begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(22);

create temporary table fixture (
  key text primary key,
  id uuid not null
);

insert into fixture values
  ('course', public.create_course('Test Links', 'Test City')),
  ('a', public.create_player('Player A')),
  ('b', public.create_player('Player B')),
  ('c', public.create_player('Player C')),
  ('d', public.create_player('Player D')),
  ('e', public.create_player('Player E')),
  ('f', public.create_player('Player F')),
  ('g', public.create_player('Player G')),
  ('h', public.create_player('Player H')),
  ('i', public.create_player('Player I')),
  ('j', public.create_player('Player J')),
  ('k', public.create_player('Player K')),
  ('l', public.create_player('Player L'));

select extensions.is(public.calculate_elo_expected(1500, 1500), 0.5::numeric, 'equal ratings have 50% expectation');
select extensions.is(public.get_result_value('PUSH'), 0.5::numeric, 'push result value is 0.5');
select extensions.is(public.format_match_score('HOLES_UP', 2, 1), '2&1', 'holes-up score is formatted');

insert into fixture
select 'doubles', public.record_match(
  date '2026-01-01',
  (select id from fixture where key = 'course'),
  18::smallint, 2::smallint, 'HOLES_UP', 2::smallint, 1::smallint,
  array[(select id from fixture where key = 'e'), (select id from fixture where key = 'f')],
  array[(select id from fixture where key = 'g'), (select id from fixture where key = 'h')],
  'WIN', 'LOSS'
);

select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'e')),
          1516, 'equal-rated 2v2 winner gains 16');
select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'g')),
          1484, 'equal-rated 2v2 loser loses 16');
select extensions.is(
  (select count(distinct rating_change) from public.player_ratings
   where match_id = (select id from fixture where key = 'doubles')
     and match_team_id = (
       select id from public.match_teams
       where match_id = (select id from fixture where key = 'doubles') and team_number = 1
     )),
  1::bigint,
  'both doubles partners receive the same change'
);

update public.players
set elo_rating = case name
    when 'Player I' then 1300
    when 'Player J' then 1301
    else 1378
  end,
  elo_peak = 1500
where id in (
  (select id from fixture where key = 'i'),
  (select id from fixture where key = 'j'),
  (select id from fixture where key = 'k'),
  (select id from fixture where key = 'l')
);

with inserted as (
  insert into public.matches (
    date, course_id, holes, team_size, score_type, score_value, holes_remaining
  )
  values (
    date '2026-01-01',
    (select id from fixture where key = 'course'),
    18, 2, 'UP', 1, null
  )
  returning id
)
insert into fixture
select 'fractional_doubles', id from inserted;

insert into public.match_teams (match_id, team_number, result)
values
  ((select id from fixture where key = 'fractional_doubles'), 1, 'WIN'),
  ((select id from fixture where key = 'fractional_doubles'), 2, 'LOSS');

insert into public.match_team_players (match_team_id, match_id, player_id)
select mt.id, mt.match_id, f.id
from public.match_teams mt
join fixture f on f.key = any(
  case mt.team_number when 1 then array['i', 'j'] else array['k', 'l'] end
)
where mt.match_id = (select id from fixture where key = 'fractional_doubles');

select public.apply_match_elo(
  (select id from fixture where key = 'fractional_doubles'),
  32
);

select extensions.is(
  (select rating_change
   from public.player_ratings
   where match_id = (select id from fixture where key = 'fractional_doubles')
     and player_id = (select id from fixture where key = 'i')),
  20,
  'fractional 1300.5 team average is not rounded before expected-score calculation'
);

insert into fixture
select 'push', public.record_match(
  date '2026-01-02',
  (select id from fixture where key = 'course'),
  9::smallint, 1::smallint, 'PUSH', null, null,
  array[(select id from fixture where key = 'c')],
  array[(select id from fixture where key = 'd')],
  'PUSH', 'PUSH'
);

select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'c')),
          1500, 'push leaves team 1 rating unchanged');
select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'd')),
          1500, 'push leaves team 2 rating unchanged');
select extensions.is((select rating_change from public.player_ratings
           where match_id = (select id from fixture where key = 'push')
             and player_id = (select id from fixture where key = 'c')),
          0, 'push persists a zero rating change');

insert into fixture
select 'first', public.record_match(
  date '2026-02-01',
  (select id from fixture where key = 'course'),
  18::smallint, 1::smallint, 'UP', 1::smallint, null,
  array[(select id from fixture where key = 'a')],
  array[(select id from fixture where key = 'b')],
  'WIN', 'LOSS'
);

select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'a')),
          1516, 'equal-rating singles winner gains 16');
select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'b')),
          1484, 'equal-rating singles loser loses 16');

insert into fixture
select 'second', public.record_match(
  date '2026-02-02',
  (select id from fixture where key = 'course'),
  18::smallint, 1::smallint, 'UP', 1::smallint, null,
  array[(select id from fixture where key = 'b')],
  array[(select id from fixture where key = 'a')],
  'WIN', 'LOSS'
);

select public.update_match(
  (select id from fixture where key = 'first'),
  date '2026-02-01',
  (select id from fixture where key = 'course'),
  18::smallint, 1::smallint, 'PUSH', null, null,
  array[(select id from fixture where key = 'a')],
  array[(select id from fixture where key = 'b')],
  'PUSH', 'PUSH'
);

select extensions.is((select rating_before from public.player_ratings
           where match_id = (select id from fixture where key = 'second')
             and player_id = (select id from fixture where key = 'a')),
          1500, 'historical update rebuilds subsequent rating-before');
select extensions.is((select elo_rating from public.players where id = (select id from fixture where key = 'a')),
          1484, 'historical update rebuilds current rating');
select extensions.is((select elo_peak from public.players where id = (select id from fixture where key = 'a')),
          1500, 'historical update rebuilds peak rating');

select public.delete_match((select id from fixture where key = 'first'));
select extensions.is((select count(*) from public.player_ratings
           where player_id = (select id from fixture where key = 'a')
             and match_id = (select id from fixture where key = 'first')),
          0::bigint, 'historical delete removes old rating history');
select extensions.is((select rating_before from public.player_ratings
           where match_id = (select id from fixture where key = 'second')
             and player_id = (select id from fixture where key = 'a')),
          1500, 'historical delete rebuilds subsequent history');

select extensions.throws_matching(
  format(
    $$select public.record_match('2026-03-01', %L, 18::smallint, 1::smallint, 'UP', 1::smallint, null,
      array[%L::uuid], array[%L::uuid], 'WIN', 'LOSS')$$,
    (select id from fixture where key = 'course'),
    (select id from fixture where key = 'a'),
    (select id from fixture where key = 'a')
  ),
  'unique',
  'cross-team duplicate player is rejected'
);

select extensions.throws_matching(
  format(
    $$select public.record_match('2026-03-01', %L, 18::smallint, 1::smallint, 'UP', 1::smallint, null,
      array[%L::uuid], array[%L::uuid], 'WIN', 'WIN')$$,
    (select id from fixture where key = 'course'),
    (select id from fixture where key = 'a'),
    (select id from fixture where key = 'b')
  ),
  'WIN/LOSS',
  'non-complementary results are rejected'
);

select extensions.throws_matching(
  format(
    $$select public.record_match('2026-03-01', %L, 18::smallint, 1::smallint, 'PUSH', 1::smallint, null,
      array[%L::uuid], array[%L::uuid], 'PUSH', 'PUSH')$$,
    (select id from fixture where key = 'course'),
    (select id from fixture where key = 'a'),
    (select id from fixture where key = 'b')
  ),
  'Invalid score',
  'invalid push score representation is rejected'
);

select extensions.throws_matching(
  format(
    $$select public.record_match('2026-03-01', %L, 18::smallint, 1::smallint, 'UP', null, null,
      array[%L::uuid], array[%L::uuid], 'WIN', 'LOSS')$$,
    (select id from fixture where key = 'course'),
    (select id from fixture where key = 'a'),
    (select id from fixture where key = 'b')
  ),
  'Invalid score',
  'missing UP score value is rejected'
);

select extensions.throws_matching(
  format(
    $$select public.record_match('2026-03-01', %L, 18::smallint, 2::smallint, 'UP', 1::smallint, null,
      array[%L::uuid], array[%L::uuid], 'WIN', 'LOSS')$$,
    (select id from fixture where key = 'course'),
    (select id from fixture where key = 'a'),
    (select id from fixture where key = 'b')
  ),
  'requires exactly 2 player',
  'wrong 2v2 team size is rejected'
);

select * from extensions.finish();
rollback;
