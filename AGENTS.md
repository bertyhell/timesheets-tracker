# AGENTS.md

## Repo at a glance

- `api/`: NestJS backend + collectors for desktop activity (`@paymoapp/active-window`) and idle state (`@paymoapp/real-idle`).
- `client/`: React + Vite UI; timeline/tagging UX and CRUD screens.
- `chrome-extension/`: MV3 extension that posts active-tab website events to backend.
- Root build scripts package all three into `dist/` and rewrite ports for packaged mode.

## Runtime architecture (important cross-file context)

- Backend starts in `api/src/main.ts` and mounts modules in `api/src/app.module.ts`.
- Static frontend is served by backend via `ServeStaticModule` (`api/src/app.module.ts`), so packaged app can run from one service.
- Program ingestion is event-driven:
  - `api/src/programs/programs.listener.ts` subscribes to active-window changes and writes activity segments.
  - `api/src/activeStates/active-states.listener.ts` polls idle state every 2 minutes and updates/rotates active-state rows.
  - `chrome-extension/src/background/background.js` sends `POST /api/websites` on tab updates/activation.
- Timeline view composes multiple streams (`programs`, `websites`, `activeStates`, `tags`, `autoTags`) in `client/src/views/TimelinesPage/TimelinesPage.tsx`.

## Data and persistence patterns

- SQLite access is centralized in `api/src/database/database.service.ts` using `bun:sqlite`.
- Each feature module follows `controller + service + dto + queries/*.sql` (example: `api/src/programs/*`).
- Services execute SQL files by path (example: `./src/programs/queries/findAllPrograms.sql`) and map flat SQL aliases like `"tagName.name"` via `unflatten`.
- Schema is created from `api/src/database/queries/create-database-tables.sql` on startup; optional seeding via `SEED_AT_STARTUP=true` in `DatabaseService`.

## API/client contract workflow

- Swagger UI is at `/docs` (`api/src/main.ts`); client codegen pulls from `/docs-yaml` (`client/package.json` script `generate-api-helpers`).
- Generated hooks live under `client/src/generated/api/queries` and are used directly in views (see `TimelinesPage.tsx`).
- After regeneration, `client/scripts/ignore-types-in-generated-files.ts` injects `@ts-nocheck` into generated query index.

## Commands that match current scripts

- Root packaging flow (from `README.md` + `package.json`): `npm run build-service-script`, `npm run copy-database`, `npm run build`.
- Backend dev command in scripts is `npm run dev:api` from `api/` (README uses `npm run dev`, which is outdated).
- Frontend dev command is `npm run dev:client` from `client/`.
- Backend tests: `cd api && npm test` (mostly scaffold tests right now).

## Project-specific gotchas

- Port source of truth is `api/src/app.const.ts` (`APP_PORT = 55577`); production packaging rewrites `55577 -> 55566` in built assets via root `replace-ports`.
- Chrome extension host permissions hardcode `http://localhost:55577/api/*` in both manifests; keep in sync with backend port strategy.
- Types are duplicated in `types/types.ts`, `api/src/types/types.ts`, and `client/src/types/types.ts`; cross-layer type changes require manual sync.
- Root scripts use Unix-like commands (`cp`, `rm`, `mv`) inside npm scripts; on Windows this typically requires Git Bash/compatible tooling.

## Safe way to add a backend feature

- Mirror an existing module (for example `api/src/auto-notes/`) with `dto/`, `queries/`, controller routes under `/api/...`, and service methods using `DatabaseService.query/mutate`.
- Add SQL first, then service mapping/adaptation, then controller annotations (`@ApiTags`, `@ApiQuery`, `@ApiParam`) to keep Swagger/codegen usable.
- If UI needs it, regenerate API helpers and consume generated hooks instead of hand-rolling fetch logic.
