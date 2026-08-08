# Golf Match

## Setup

The app is a React + TypeScript + Vite client with Tailwind CSS. It communicates
directly with the authoritative Supabase views and RPCs.

### 1. Install dependencies

```sh
npm ci
```

### 2. Apply the database migrations

For a hosted Supabase project:

```sh
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

For a local Supabase stack:

```sh
npx supabase start
npx supabase db reset
```

Both paths apply every migration in `supabase/migrations`.

### 3. Configure the frontend

```sh
cp .env.example .env.local
```

Set:

- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — public anonymous key. Do not use a service-role key.
- `VITE_ADMIN_ACCESS_CODE` — optional shared code for the client-side admin
  convenience gate. If omitted, admin login remains disabled.

All `VITE_` values are bundled into client-side JavaScript. The admin code is
therefore **not a secret or an authorization boundary**. It only prevents
accidental access to the admin UI. The current database intentionally grants
anonymous callers access to the mutation RPCs, so anyone with the public project
configuration can call them directly. Do not deploy this architecture for
sensitive or broadly public data; use Supabase Auth and authenticated RLS grants
before doing so.

Never put a Supabase service-role key in a frontend environment file.

### 4. Run the app

```sh
npm run dev
```

## Quality and production preview

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The production output is written to `dist/`. Vite's preview server supports SPA
fallback for local checks. On a production host, configure every unknown
non-asset route (for example `/players/:id` and `/admin/matches/new`) to serve
`index.html`; otherwise direct visits and refreshes on React Router routes will
404.

## Database checks

With the local Supabase stack running:

```sh
npx supabase test db
```

Database checks in `supabase/tests` use pgTAP and run in a transaction that is
rolled back.
