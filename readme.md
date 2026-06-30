# ZookLabs

Monorepo for [zooklabs.com](https://zooklabs.com) — an unofficial BAMZOOKi hosting site.

## Structure

```
.
├─ apps/
│  ├─ api/            # Deno + Oak API → Deno Deploy
│  └─ web/            # React (CRA) web front end → Cloudflare/Netlify
├─ packages/
│  └─ shared/         # @zooklabs/shared — API DTOs shared by the API and the web
└─ scripts/           # local dev tooling (in-memory DB + orchestrator)
```

The API and the web app deploy **independently** (API → Deno Deploy, web → Cloudflare/
Netlify). The monorepo unifies the source and shares the API types via
`@zooklabs/shared`; it does not couple their deployments.

## Local development

Two terminals (recommended — keeps the API logs clean and separate from the web):

```bash
deno task dev:api    # terminal 1: in-memory DB + migrations + API  → http://localhost:8080
deno task dev:web    # terminal 2: web UI                            → http://localhost:3000
```

…or everything in one terminal with prefixed logs:

```bash
deno task dev:all
```

- **Database** — in-memory PGlite on `127.0.0.1:5432` (no Docker; a fresh, empty DB each run)
- **API** — http://localhost:8080
- **Web** — http://localhost:3000

The first run installs the web app's dependencies (one-off). Press **Ctrl-C** to stop.

### Prerequisites
- [Deno](https://deno.com) 2.x
- [Node](https://nodejs.org) 20+ with Yarn 4 (ships via `corepack`) — for the web app only

### Tasks

Root (`deno.json`):

| Task | What it does |
| --- | --- |
| `deno task dev:api`  | In-memory DB + migrations + API, clean logs — **terminal 1** |
| `deno task dev:web`  | Web UI dev server — **terminal 2** |
| `deno task dev:all`  | All of the above in one terminal (prefixed logs) |
| `deno task dev:db`   | Just the in-memory PGlite database (on `:5432`) |

API (`apps/api/deno.json`):

| Task | What it does |
| --- | --- |
| `deno task dev`       | Just the API (expects a database on `:5432`) |
| `deno task migrate`   | Apply database migrations |
| `deno task dev:local` | Run the API against a **Docker** Postgres instead of in-memory |
| `deno task dev:stop`  | Stop the Docker Postgres container |
| `deno task check-all` | Format, lint, and type-check all `.ts` files |
| `deno task test:unit` | Run unit tests |
| `deno task test:integration` | Run integration tests |
| `deno task test:all`  | Run all tests |

### Why in-memory (and how)
The API talks to Postgres over the wire. `scripts/dev-db.ts` runs **PGlite** (embedded
WASM Postgres) and exposes it on a TCP socket, so the API's normal Postgres client
connects **unchanged** — no Docker, and a clean database every run. If you'd rather have
a persistent local DB, the Docker path (`deno task dev:local`) still works.

### Local config
`.env.development` sets the dev-only values the stack needs: `PGHOST=127.0.0.1`,
`APP_PORT=8080` (so the API matches the web's `REACT_APP_DENO_API_URL`), and
`CORS_ORIGIN=http://localhost:3000` (so the API accepts the local web origin). In
production these are unset and the code falls back to production defaults.

---
<sub>Backend patterns originally based on
[deno-oak-realworld-example-app](https://github.com/mohidkazi/deno-oak-realworld-example-app)
and [deno-beer](https://github.com/douglaslb/deno-beer).</sub>
