begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(21);

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
  ('h', public.create_player('Player H'));

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
