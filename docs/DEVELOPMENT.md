# Local development

Run all commands below from the repository root:

```powershell
cd C:\Users\cj_wo\OneDrive\Desktop\datePage_Wb-Mb
pnpm install
```

For the first launch, copy `apps/api/.env.example` to `apps/api/.env` and
`apps/web/.env.example` to `apps/web/.env.local`, then provide unique secrets.
Never commit either file.

## Launch the application

Start the main web application and API together in one terminal:

```powershell
pnpm dev
```

Wait for both services to report that they are ready, then open:

- Web application: http://localhost:3000
- API: http://localhost:4000

Keep that terminal open while developing. Press `Ctrl+C` once in that terminal
to stop both services. Wait for the command prompt to return before launching
the application again.

Supported startup modes:

- `pnpm dev` or `pnpm dev:minimal`: web (3000) and API (4000).
- `pnpm dev:realtime`: web, API, and signaling (4001).
- `pnpm dev:portal`: combined admin and staff portal on port 3010.
- `pnpm dev:app:all`: user site (3000), admin/staff portal (3010), and API (4000).
- `pnpm dev:all-workspaces`: every workspace development task.

The support platform on port 4500 is a separate project and must be started when
support features are being developed. Stop existing processes before starting a
second copy of the same Next.js role; do not run `dev:admin` and `dev:staff`
simultaneously because both are compatibility aliases for port 3010.

## Restart and lock recovery

If startup says it cannot acquire `apps/web/.next/dev/lock`, another web server
is normally still running. First check whether port 3000 is active:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
```

If a listener is shown, use the already-running application or stop its original
terminal with `Ctrl+C`. Do not delete the lock while that process is alive.

If no listener or related Node process is running and the lock still exists, it
is stale and can be removed before restarting:

```powershell
Remove-Item -LiteralPath apps\web\.next\dev\lock
pnpm dev
```

Before submitting changes, run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and
`pnpm build`.
