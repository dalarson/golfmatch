# Golf Match

## Frontend

The app is a React + TypeScript + Vite client with Tailwind CSS. It communicates
directly with the authoritative Supabase views and RPCs.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Configure:

- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — public anonymous key. Do not use a service-role key.
- `VITE_ADMIN_ACCESS_CODE` — optional shared code for the client-side admin
  convenience gate. Because Vite bundles this value, it is not a secret or a
  database security boundary. If omitted, admin login remains disabled.

Quality commands:

```sh
npm run typecheck
npm run lint
npm run build
```

The production output is written to `dist/`. Configure the deployment host to
serve `index.html` for unknown paths so React Router can resolve deep links.

## Local database

Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), then run:

```sh
supabase start
supabase db reset
supabase test db
```

`db reset` recreates the local database from `supabase/migrations`. Database tests in
`supabase/tests` use pgTAP and run in a transaction that is rolled back.
