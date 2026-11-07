# MOMENT V2 — Living Project Review

**Last updated:** 2026-11-07  
**Repository:** `Meentv/Moment-v2`  
**Branch:** `arena/d1457d0d-moment-v2`  
**Specification:** `MOMENT_V2_Master_Project_Blueprint.pdf` (9 pages, read in full)  
**Scope decision:** **React only.** The user’s instruction supersedes the blueprint’s two-implementation / Vanilla parity requirement for this repository. No Vanilla project was created.

## Current milestone

**M6 — React quality review: complete for the implemented local-first scope.**

M1–M5 are implemented in React. The React portion of M6 has automated functional, persistence, responsive and accessibility evidence below. Supabase/SQL remains explicitly deferred to M7. No external deployment is claimed.

Target outcome achieved: a first-time visitor can understand MOMENT, create real tasks and notes, organize projects, plan by calendar, run a focus session, search their information, and return after refresh to find it saved in that browser.

## Source-of-truth audit (M0)

Before editing, the checkout contained only:

- `README.md` with the text `# Moment-v2`
- Git metadata on commit `a309982` (`Initial commit`)

There was no existing report UI, React app, Vanilla app, source ZIP, asset inventory, stylesheet, or interaction code to preserve. The attached PDF was therefore used as the product specification, and the React-only request was recorded as the scope change. No assumptions were made about an earlier conversion.

## Completed work and evidence

| Area | Implementation location | React acceptance evidence |
| --- | --- | --- |
| Foundation / design system | `src/styles/`, `src/components/UI.jsx`, `src/layouts/` | Warm rose/coral palette, self-hosted fonts, responsive shell, semantic controls, focus states, reduced-motion CSS; browser screenshots reviewed |
| Public experience | `src/pages/public/`, `src/layouts/PublicLayout.jsx` | Home, features, about, help/FAQ and honest contact/feedback routes render; no pricing or fake sign-in; contact saves a local note and explicitly does not send |
| Today | `src/pages/Today.jsx` | Live counts, quick capture, today/upcoming/all-open lists, real weekly progress, recent notes, active projects and focus widget; useful empty workspace |
| Tasks | `src/features/tasks/`, `src/pages/Tasks.jsx`, `src/services/workspace.js` | Create/edit/complete/reopen/delete, undo, validation, filters, sorting, list/board, drag-to-status; unit, React and browser tests pass |
| Projects | `src/features/projects/`, `src/pages/Projects.jsx`, `src/pages/ProjectDetail.jsx` | Create/edit/archive/restore/delete, colour/status/dates, linked tasks, calculated progress; deleting a project keeps tasks |
| Notes | `src/features/notes/NoteEditor.jsx`, `src/pages/Notes.jsx` | Autosave with visible state, pin, tags, search/sort, copy/text export, delete/undo; refresh and global-search browser checks pass |
| Calendar | `src/pages/Calendar.jsx`, `src/services/dates.js` | Day/week/month, navigation, open/edit/add dated tasks, separate undated list, Monday/Sunday preference; date helper tests and browser checks pass |
| Focus | `src/context/FocusContext.jsx`, `src/services/focus.js`, `src/pages/Focus.jsx` | Timestamp-based start/pause/resume/reset, task link, durations, optional auto-break, refresh recovery, exactly-once history; unit and browser checks pass |
| Search | `src/components/SearchDialog.jsx`, `src/pages/Search.jsx` | Cross-collection search, Ctrl/⌘ K, arrow navigation, Escape, full search route; React and browser checks pass |
| Settings / persistence | `src/pages/Settings.jsx`, `src/context/WorkspaceContext.jsx`, `src/storage/` | Theme/name/week/timer preferences, JSON export/import, corrupt-data recovery, storage error banner/retry, typed delete-all; adapter and browser checks pass |
| Documentation | `README.md`, `CHANGELOG.md`, `.env.example`, `vercel.json` | Setup, scripts, routes, storage limitations, deployment configuration and backend deferral documented |

### React-only feature checklist

| Requirement | React | Vanilla |
| --- | --- | --- |
| Tasks CRUD, filters, sorting, validation, undo | Implemented | Out of scope by user decision |
| Projects CRUD/archive, linked progress | Implemented | Out of scope |
| Notes autosave, pin, tags, search, export | Implemented | Out of scope |
| Calendar day/week/month and undated handling | Implemented | Out of scope |
| Focus timer and completed history | Implemented | Out of scope |
| Global search and keyboard access | Implemented | Out of scope |
| Local persistence, backup/import, recovery, deletion | Implemented | Out of scope |
| Public pages and honest product language | Implemented | Out of scope |
| Supabase Auth / SQL / RLS | Deferred to M7 | Out of scope |

## Checks actually run

Environment: Node `v22.22.3`, npm `10.9.8`, Vite `6.4.5`, Vitest `3.2.7`, Chromium via Playwright.

| Command / check | Result |
| --- | --- |
| `npm run check` | **Pass:** 4 test files, **46 tests passed**; production build completed |
| `npm run build` | **Pass:** output `dist/`; app JS ~374 kB raw / ~109 kB gzip, React chunk ~52 kB raw / ~18 kB gzip, CSS ~120 kB raw / ~25 kB gzip |
| `npm run test:browser` | **Pass:** 14 workflow/check groups in real Chromium |
| Responsive sweep | **Pass:** 13 public/workspace routes at 320, 390, 768, 1024 and 1440 px; no horizontal page overflow detected |
| Automated axe WCAG A/AA scans | **Pass:** 6 sampled screens (Today light/dark, home mobile/desktop, tasks, settings); **0 violations** |
| Browser console | **Pass:** no console errors or page errors during the final browser run |
| `git diff --check` | **Pass:** no whitespace errors |

Browser evidence covered task create/complete/reopen/refresh; project creation and linked capture; note autosave/refresh/pin/search/Escape; filters and board; calendar views; focus pause/resume/refresh/exactly-once completion; JSON download, invalid import rejection and confirmed round-trip; theme persistence; mobile navigation; and typed delete-all.

The browser script writes screenshots and `report.json` to `/tmp/moment-screenshots` by default. This session’s review copies were written outside Git at `/home/user/screenshots`. They are evidence, not seeded product data.

## Functional and design review

- **Spacing / typography:** consistent spacing, Manrope headings, DM Sans body, Instrument Serif accents; readable hierarchy without heavy effects.
- **Palette:** warm neutral canvas with rose/coral accents; light theme first, dark/system preferences available. Text tokens were darkened after automated contrast findings.
- **Responsive:** sidebar becomes a keyboard-accessible dialog; grids reflow; calendar week becomes a vertical agenda on narrow phones; decorative landing orbit is clipped to prevent overflow.
- **Motion:** short entrance/hover transitions; reduced-motion preference disables animation.
- **Empty/error states:** no invented tasks, notes, projects, metrics or testimonials. Storage failures remain visible and export is available.
- **User control:** destructive actions are confirmed; task/note deletion and status changes offer undo where practical; import replaces only after confirmation.
- **Accessibility:** native dialogs, labelled fields, visible focus, keyboard search, arrow-key tabs/menus, Escape handling and automated scans. This is not a claim of a complete manual screen-reader audit.

## Bug review

| ID | Severity | Reproduction / issue | Expected | Actual before fix | Status |
| --- | --- | --- | --- | --- | --- |
| B-001 | P2 | Build with the initial Fontsource import paths | Production build resolves fonts | Variable-font packages did not expose `latin.css` | **Fixed**; build passes |
| B-002 | P2 | Run axe on the initial light workspace | Small supporting text meets contrast | Faint text and rose-on-pink states were below 4.5:1 | **Fixed**; sampled scans clean |
| B-003 | P2 | Open landing at narrow widths | No horizontal page overflow | Decorative orbit extended beyond the canvas | **Fixed**; five-width sweep clean |
| B-004 | P2 | Open full search at 320 px | Tabs fit the viewport | Collection tabs overflowed | **Fixed**; narrow-screen sweep clean |
| B-005 | P2 | Drag a board card to another column | Status changes immediately | Initially opened a prefilled editor instead | **Fixed**; direct validated update with undo |
| B-006 | P2 | Close a note after a browser-storage failure | Keep the in-tab note and allow closing/export | Editor could block closing while durable save failed | **Fixed**; in-tab commit is retained, warning/exit protection remains |
| B-007 | P2 | Corrupt stored data and fail to write a recovery copy | Never silently overwrite the original | Risk of treating recovery as permission to reset | **Fixed**; protected original requires explicit reset |

No known open P0 or P1 issues from the checks run. Remaining limitations are listed below rather than hidden.

## Known limitations

1. **Local only:** data is tied to this browser profile/device; no accounts or cross-device sync. Browser-local storage is not app-encrypted.
2. **Storage quota:** very large workspaces may exceed `localStorage`; failures are surfaced and export remains available. IndexedDB can be introduced if volume requires it.
3. **Multiple tabs:** concurrent tabs use last-write-wins browser storage; a conflict-resolution layer is not implemented.
4. **Contact:** no support inbox is connected. The form saves a real local feedback note and says it has not been sent.
5. **Compatibility:** real-browser checks ran in Chromium only. Safari/Firefox and manual assistive-technology testing remain release QA work.
6. **Backend:** no SQL, migrations, Supabase client, Auth, RLS or credentials were created. The placeholder environment names are commented and unused.
7. **Deployment:** Vercel configuration is present, but no external deployment or production-domain verification is claimed.

## Handoff notes

### Files changed

- Updated: `README.md`
- Added root configuration: `.env.example`, `.gitignore`, `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `vitest.config.js`, `vercel.json`, `CHANGELOG.md`, this review
- Added application: `src/App.jsx`, `src/main.jsx`, components, contexts, layouts, features, pages, services, storage adapters, styles and utilities
- Added tests/evidence tooling: `src/test/`, `src/services/*.test.js`, `src/storage/localAdapter.test.js`, `scripts/browser-check.mjs`
- Added public asset: `public/favicon.svg`

`node_modules/`, `dist/`, test output and local screenshots are excluded from Git.

### Environment / commands

```bash
npm install
npm run dev          # 0.0.0.0:5173
npm run check        # 46 tests + production build
npm run test:browser # requires the dev server and an installed Chromium
```

The Arena preview server was started on port 5173 and accepts the proxied preview host. Browser-facing code uses relative routes; it does not call localhost from the user’s browser.

### Exact next task

**M7 — Supabase / SQL, only when explicitly started.** First freeze and review the proven local service contract, then design migrations for profiles, projects, tasks, notes, focus sessions and preferences. Acceptance gate: documented constraints/indexes/foreign keys, real Auth and password reset, RLS on every user-owned table, owner-only policies, ownership validation for links, publishable/anon key only, separate environment configuration, and two-account isolation tests. Until then, keep the React local-first product stable and do not invent credentials.

Before an external release, also complete Safari/Firefox and manual screen-reader checks, verify deployed deep links, and capture release screenshots from the production build.
