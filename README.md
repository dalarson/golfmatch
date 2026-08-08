# Golf Match

## Local database

Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), then run:

```sh
supabase start
supabase db reset
supabase test db
```

`db reset` recreates the local database from `supabase/migrations`. Database tests in
`supabase/tests` use pgTAP and run in a transaction that is rolled back.
