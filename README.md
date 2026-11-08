# MOMENT V2 — React edition

**Make Everything Simple With Focus.**

A real, local-first productivity workspace built from `MOMENT_V2_Master_Project_Blueprint.pdf`, with the scope explicitly narrowed to **React only**. There is no Vanilla implementation, no fake dashboard data, and no Supabase/SQL integration in this phase.

## What works

- **Today:** a live daily overview, quick capture, open/overdue tasks, real weekly progress, recent notes, active projects, and a focus widget.
- **Tasks:** create, edit, complete/reopen, delete with confirmation and undo; title, description, status, priority, due date, project, timestamps; list/board views; text, status, priority, project and date filters; sorting; drag between board columns.
- **Projects:** create, edit, archive/restore, delete; colour markers, statuses and optional dates; detail pages; progress calculated from linked tasks. Deleting a project keeps its tasks.
- **Notes & ideas:** debounced autosave with visible save state, pinning, tags, search, sorting, copy, plain-text export, delete and undo.
- **Calendar:** day, week and month views; previous/next/today navigation; open/edit scheduled tasks; add tasks on a date; undated tasks kept separate; configurable week start.
- **Focus:** timestamp-based focus/break timer with start, pause, resume, reset, optional task link, configurable durations, optional automatic break, refresh recovery, and completed-session history.
- **Search:** one entry across tasks, projects and notes; keyboard shortcut, arrow-key results, full search page.
- **Settings:** light/dark/system theme, greeting name, week start, timer preferences, JSON export/import, storage recovery, and typed confirmation before deleting all data.
- **Public pages:** product introduction, features, how it works, about, help/FAQ, and contact. The project owner’s email is **alameenahmed588@gmail.com**; email links open a draft in the visitor’s email app. A feedback note can also be saved locally. No pricing or sign-in screens are shown because paid plans and authentication are not implemented.

## Stack

React 19 · Vite · React Router · Lucide React · self-hosted Fontsource fonts · plain CSS design tokens · Vitest + Testing Library · Playwright/axe browser checks.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

The development server binds to `0.0.0.0:5173` and accepts the Arena preview host. Open `/` for the product introduction or `/app` for the workspace.

```bash
npm test          # service, storage, timer and React acceptance tests
npm run build     # production build in dist/
npm run preview   # serve the production build on 0.0.0.0:4173
npm run check     # tests followed by production build
```

Optional real-browser checks (with the dev server running):

```bash
npx playwright install chromium
npm run test:browser
```

`test:browser` uses `http://127.0.0.1:5173` by default. Override with `MOMENT_URL`, `MOMENT_CHROMIUM_PATH`, or `MOMENT_SCREENSHOTS`. It exercises real workflows, five viewport widths, downloads/imports, and automated accessibility scans. Screenshots and its JSON report default to `/tmp/moment-screenshots`, outside Git.

## Data and privacy

This version stores workspace data in `localStorage` under `moment:v2:workspace`, and the active timer under `moment:v2:focus`. Data belongs to this browser profile on this device. It is **not** synced, not an account, and not encrypted by the app. Anyone with access to the browser profile may be able to read it.

- Refreshing does not intentionally remove data.
- Clearing site data, private browsing, switching devices, or browser storage failures can remove or prevent saving.
- Save failures keep the current changes in the open tab and show a persistent warning with export/retry actions.
- Corrupt stored data is preserved in a `moment:v2:recovery:*` copy when possible. If a recovery copy cannot be written, the original is not overwritten.
- Export a JSON backup regularly from **Settings → Your data, in your hands**.
- Import validates the whole backup before asking to replace the current workspace. It does not merge.
- Delete-all removes workspace collections, preferences, timer state and recovery copies after typing `DELETE`.

## Routes

| Public | Workspace |
| --- | --- |
| `/` | `/app` — Today |
| `/features` | `/app/tasks` |
| `/about` | `/app/projects` and `/app/projects/:id` |
| `/help` | `/app/notes` |
| `/contact` | `/app/calendar` |
| | `/app/focus` |
| | `/app/search` |
| | `/app/settings` |

## Structure

```text
src/
  components/       reusable UI, dialogs, search, error boundary
  context/          workspace, dialogs, toasts, focus providers
  features/         task/project/note editors, task rows, focus widget
  layouts/          public and workspace shells
  pages/            workspace and public routes
  services/         validated data operations, dates, timer logic
  storage/          browser storage adapters and recovery
  styles/           tokens, workspace, public and responsive styles
  lib/              downloads/clipboard and accessible menu behaviour
  test/             React acceptance tests and setup
scripts/browser-check.mjs
PROJECT_REVIEW.md   living source-of-truth review and handoff
CHANGELOG.md
```

## Deployment

`vercel.json` configures a Vite build and SPA rewrites. Use `npm run build` and output directory `dist`. No environment variables are needed for the local-first edition. `.env.example` contains commented placeholder names only for the later backend milestone; the app does not read them.

This repository has been prepared for deployment, but no external Vercel deployment is claimed. Verify the deployed deep links and browser storage behaviour after deploying.

## Current limitations

- React only, by request. The blueprint's Vanilla parity requirement is superseded for this repository.
- No accounts, cloud sync, notifications, or paid plans. Contact is by email at **alameenahmed588@gmail.com** through the visitor’s own email app; MOMENT does not send email automatically. The optional feedback note is saved only in the browser.
- Browser-local storage is limited by browser quota; very large workspaces may need the future IndexedDB/Supabase adapter.
- Automated accessibility checks are not a substitute for a full manual screen-reader audit. Safari and Firefox were not available in the implementation sandbox.
- Supabase Auth, SQL migrations, RLS and multi-account isolation remain deferred to M7. No backend credentials or SQL were created.

See `PROJECT_REVIEW.md` for exact test evidence, milestone status, bug history and the next acceptance gate.
