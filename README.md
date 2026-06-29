# @c3/api — C3 Public API

Stateless Express service on Vercel. Layer 2 of the three-layer architecture.

See [ARCHITECTURE.md](https://github.com/ud4090v/c3/blob/main/ARCHITECTURE.md) for the canonical design.

## What it does

For every `/api/*` request from the SPA (same-origin via Vercel rewrite), this service:

1. Receives the request with the org's API key in headers (`X-C3-*`).
2. Verifies the API key + extracts the org_id.
3. Looks up the org's add-on endpoint (`https://add-on.blckrbbt.io` for the BRG org at launch).
4. Re-signs the request with the add-on's HMAC secret and forwards it.
5. Returns the add-on's response, untouched.

No customer data is stored or persisted in this layer.

## Endpoints

Mirrors the SPA's `src/lib/api.ts` contract:

- `GET  /api/health`
- `GET  /api/org-chart`
- `GET  /api/system/sync-status`
- `GET  /api/agents[?department=&status=]`
- `GET  /api/agents/:id`
- `POST /api/agents/register`
- `GET  /api/tasks[?status=&department=&assignedTo=]`
- `GET  /api/tasks/:id`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET  /api/audit/messages`
- `POST /api/audit/messages`
- `GET  /api/notifications`
- `PATCH /api/notifications/:id/acknowledge`
- `GET  /api/analytics/departments`
- `GET  /api/analytics/leaderboard`
- `GET  /api/analytics/summary`
- `GET  /api/vault/tree`
- `GET  /api/vault/file?path=`
- `GET  /api/vault/search?q=`

## Local dev

```bash
pnpm install
pnpm dev   # tsx watch
```

## Deploy

Pushed to main → Vercel auto-deploys. No persistent state, no build artifacts.

## Tenant table (single-org at launch)

`src/tenants.ts` has the org registry. At launch, only one entry: the BRG org with its API key + add-on URL. Multi-tenant self-serve flow lives in Phase 6 (out of scope here).

## Repo

- Source: https://github.com/ud4090v/c3-api
- Companion UI: https://github.com/ud4090v/c3
- Companion add-on: https://github.com/ud4090v/openclaw-c3-addon
