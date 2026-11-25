---
name: run-dashboard
description: Build, run, and screenshot the DateBuk web dashboard (apps/web + apps/api together). Use when asked to start the app, launch the dashboard, verify a frontend/backend change end-to-end, or take a screenshot of a dashboard/notifications/subscription page.
---

Turborepo monorepo; the dashboard needs **both** `apps/web` (Next.js, port 3000)
and `apps/api` (NestJS, port 4000) running together. Drive it via
`.claude/skills/run-dashboard/driver.mjs`, which uses `playwright-core` against
the system-installed Chrome (no Playwright browser download needed) to get an
authenticated session and screenshot any dashboard page.

All paths below are relative to the repo root.

## Prerequisites

- Postgres reachable at the `DATABASE_URL` in `apps/api/.env` (this repo's dev
  Postgres already runs on `localhost:5432`; nothing to install here).
- A system Chrome/Edge install. This was verified against:
  `C:\Program Files\Google\Chrome\Application\chrome.exe`. Override with the
  `CHROME_PATH` env var if yours lives elsewhere (e.g. Edge at
  `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).

## Setup

One-time, only needed once per clone (this installs the driver's own
`playwright-core` — it does **not** touch the monorepo's own
`package.json`/lockfile):

```bash
cd .claude/skills/run-dashboard
npm install
```

## Build

No separate build step — `turbo run dev` runs both apps in dev/watch mode
directly from source.

## Run (agent path)

1. **Launch both dev servers in the background** from the repo root:

   ```bash
   pnpm run dev:minimal > /tmp/dashboard-dev.log 2>&1 &
   disown
   ```

   (`dev:minimal` = `turbo run dev --filter=web --filter=api`.)

2. **Poll until both ports respond** (first boot can take ~60-90s — Nest's
   `nest start --watch` has to finish an initial TypeScript compile):

   ```bash
   for i in $(seq 1 90); do
     api_ok=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null)
     web_ok=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
     [ "$web_ok" != "000" ] && [ "$api_ok" != "000" ] && { echo "READY (api=$api_ok web=$web_ok)"; break; }
     sleep 2
   done
   ```

3. **Create a test user and get an authenticated session:**

   ```bash
   node .claude/skills/run-dashboard/driver.mjs signup
   ```

   This POSTs to `/api/auth/signup` with a throwaway email, prints the token
   response, and writes it to `.claude/skills/run-dashboard/.auth.json`
   (gitignored — it's a live token, not a fixture).

4. **Screenshot any page** (auth is injected automatically from step 3's
   `.auth.json`). On Git Bash/MSYS, prefix with `MSYS_NO_PATHCONV=1` or the
   leading `/dashboard` gets rewritten into a Windows path before Node ever
   sees it (see Gotchas):

   ```bash
   MSYS_NO_PATHCONV=1 node .claude/skills/run-dashboard/driver.mjs shot /dashboard
   MSYS_NO_PATHCONV=1 node .claude/skills/run-dashboard/driver.mjs shot /dashboard/notifications
   MSYS_NO_PATHCONV=1 node .claude/skills/run-dashboard/driver.mjs shot /dashboard/subscription
   ```

   Screenshots land in `.claude/skills/run-dashboard/screenshots/<path-with-underscores>.png`
   by default, or pass an explicit output path as a second argument:
   `node driver.mjs shot /dashboard/matches /tmp/matches.png`. The driver also
   prints any browser console errors it captured as JSON — check that list,
   not just the screenshot, since a page can render its shell while a data
   fetch silently 500s underneath.

5. **Stop the servers** when done (npm doesn't forward SIGTERM to what it
   spawns, so kill the port listeners, not `$!`):

   ```bash
   lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
   lsof -ti:4000 -sTCP:LISTEN | xargs -r kill
   ```

## Run (human path)

`pnpm run dev:minimal` in a foreground terminal, then open
`http://localhost:3000/dashboard` in a real browser and log in through the UI.
Ctrl-C to stop.

## Test

```bash
cd apps/api && npx jest --silent
```

Expect all suites to pass (5 suites / ~95 tests as of this writing).

---

## Gotchas

- **`apps/web` refuses to boot if both `src/middleware.ts` and `src/proxy.ts`
  exist.** This Next.js version renamed the middleware convention to `proxy.ts`
  and throws `Both middleware file "./src\middleware.ts" and proxy file
  "./src\proxy.ts" are detected` on startup — `web:dev` exits 1 immediately, no
  port ever opens. There must be exactly one; if you're adding
  request-level logic (headers, auth gating, redirects), add it to the
  existing `proxy.ts`'s exported `proxy()` function, not a new `middleware.ts`.
- **Signup (and anything else that enqueues a background job) 500s with
  `Queue <name> does not exist`** unless `PgBossService.onModuleInit` has
  called `boss.createQueue(name)` for every queue name used via `.add()`/
  `.work()` (currently: `email`, `push`, `uploads`, `broadcast`). This pg-boss
  version stopped auto-creating queues on first send — see
  `apps/api/src/common/pgboss/pgboss.service.ts`. If you see this error, check
  that fix is still in place before chasing anything else.
- **`waitUntil: "networkidle"` hangs for the full timeout** on every page —
  Next's dev-mode HMR websocket (`ws://localhost:3000/_next/webpack-hmr`)
  never goes idle. The driver uses `domcontentloaded` + a fixed settle delay
  instead. If you add new pages to check, keep using `domcontentloaded`.
- **The dashboard requires an authenticated session** — `useRequireAuth`
  redirects to `/login` if there's no `dp_access` cookie. The driver seeds
  both the `datepage.auth.v1` localStorage key (which
  `apps/web/src/stores/auth.ts` reads on hydrate) and the `dp_access` cookie
  (which `apps/web/src/proxy.ts`'s auth gate checks server-side) — you need
  both, not just one, or you'll get redirected before the page ever renders.
- **A brand-new signup has zero real matches**, so `/dashboard` (matches page)
  falls back to hardcoded demo cards by design — that's expected, not a bug,
  for a freshly created test user.
- **Git Bash/MSYS rewrites leading-slash arguments into Windows paths.**
  `node driver.mjs shot /dashboard` silently becomes `shot C:/Program
  Files/Git/dashboard` and Playwright throws `Cannot navigate to invalid URL`
  — the path argument, not the URL construction, is the actual problem.
  Prefix the command with `MSYS_NO_PATHCONV=1` whenever the shot path starts
  with `/`.

## Troubleshooting

- **`web:dev: ELIFECYCLE Command failed with exit code 1` + "Both middleware
  file ... and proxy file ... are detected"**: see the proxy/middleware
  gotcha above — delete whichever of the two duplicate files shouldn't exist.
- **`curl .../api/auth/signup` → `{"statusCode":500,"message":"Internal
  server error"}`**: check `apps/api` logs for `Queue <name> does not exist` —
  see the PgBoss gotcha above.
- **`page.goto: Timeout 30000ms exceeded` on every navigation**: you're
  probably using `waitUntil: "networkidle"` — switch to `"domcontentloaded"`.
- **Driver exits with "No auth session yet"**: run
  `node driver.mjs signup` before `node driver.mjs shot`.
- **`page.goto: Protocol error (Page.navigate): Cannot navigate to invalid
  URL`, and the call log shows something like
  `http://localhost:3000C:/Program Files/Git/dashboard`**: Git Bash mangled
  the path argument — rerun with `MSYS_NO_PATHCONV=1` prefixed.
