# simple-obsidian-calendar

A community fork of [liamcain/obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin), consolidated into a single repository and updated for modern Obsidian.

---

## Status

**Version:** 2.0.0-dev  
**Stage:** Core source files implemented. Svelte components and `main.ts`/`view.ts` not yet written.

The original plugin was spread across three repositories:

| Original repo | Role | Fate in this fork |
|---|---|---|
| `obsidian-calendar-plugin` | Obsidian plugin entry point | Merged into `src/` |
| `obsidian-calendar-ui` | Reusable Svelte UI library | Merged into `src/ui/` |
| `obsidian-periodic-notes` | Periodic notes manager | **Dropped** |

---

## What this plugin does

Adds a calendar panel to Obsidian's sidebar. Each day cell and week-number cell represents a daily or weekly note. Clicking a cell opens the note if it exists, or creates it if it does not. Cells are decorated with dots and CSS classes derived from note content (word count, open tasks, streaks, custom tags).

---

## Goals of this fork

- **Single repository** — no fractured npm dependency chain between three repos
- **Modern Obsidian API** — all deprecated calls replaced (`getUnpinnedLeaf`, `splitActiveLeaf`, `layout-ready` event, `new Menu(app)`, etc.), `minAppVersion` raised to `1.0.0`
- **Svelte 4** — migrated from Svelte 3
- **Updated dependencies** — esbuild replaces Rollup; TypeScript 5.9; latest `obsidian-daily-notes-interface`
- **Templater support** — when the [Templater](https://github.com/SilentVoid13/Templater) plugin is installed, note creation can use Templater templates instead of Obsidian's built-in template substitution. The template engine is user-selectable in settings
- **CSS-only tooltip** — the `@popperjs/svelte` hover popover replaced with a lightweight, dependency-free CSS tooltip
- **All four decoration sources preserved** — word count dots, streak classes, task dots, custom tag attributes

---

## Current repository structure

```
simple-obsidian-calendar/
├── docs/
│   ├── plan.md          ← full implementation plan (stages and status)
│   └── testing.md       ← unit test philosophy and per-module test specifications
├── src/
│   ├── global.d.ts      ← Window interface augmentation (app, moment, _bundledLocaleWeekSpec)
│   ├── types.ts         ← shared types (IDot, ICalendarSource, IEvaluatedMetadata, etc.)
│   ├── constants.ts     ← DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT, etc.
│   ├── localization.ts  ← configureGlobalMomentLocale (reads from vault.getConfig)
│   ├── settings.ts      ← ISettings interface + defaultSettings (incl. templateEngine)
│   ├── __mocks__/       ← manual Jest mocks for obsidian and obsidian-daily-notes-interface
│   ├── __setup__/       ← jest.setup.ts (global mocks, window.app, window.moment)
│   ├── __tests__/       ← framework smoke test + localization/settings tests (43 passing)
│   ├── io/
│   │   ├── template.ts      ← templaterIsAvailable + applyTemplate
│   │   ├── dailyNotes.ts    ← tryToCreateDailyNote (modern workspace API)
│   │   ├── weeklyNotes.ts   ← tryToCreateWeeklyNote (modern workspace API)
│   │   └── __tests__/       ← template tests (16 passing); dailyNotes/weeklyNotes (todos)
│   └── ui/
│       ├── context.ts       ← IS_MOBILE, DISPLAYED_MONTH symbols
│       ├── fileStore.ts     ← PeriodicNotesCache (ported from calendar-ui)
│       ├── modal.ts         ← ConfirmationModal + createConfirmationDialog
│       ├── stores.ts        ← dailyNotes, weeklyNotes, activeFile, settings stores
│       ├── utils.ts         ← full merged utils (53 tests passing)
│       ├── __tests__/       ← utils/context tests passing; stores/fileStore/component todos
│       └── sources/
│           ├── wordCount.ts ← unified getMetadata API
│           ├── tasks.ts     ← unified getMetadata API
│           ├── tags.ts      ← unified getMetadata API
│           ├── streak.ts    ← unified getMetadata API
│           └── __tests__/   ← all sources have todo stubs
├── jest.config.js
├── tsconfig.json        ← main build config
├── tsconfig.test.json   ← test-only overrides (commonjs, mock path aliases)
└── package.json
```

**Not yet written** (required to build and run the plugin):
`src/main.ts`, `src/view.ts`, `src/ui/Calendar.svelte`, `src/ui/Day.svelte`,
`src/ui/WeekNum.svelte`, `src/ui/Nav.svelte`, `src/ui/Arrow.svelte`,
`src/ui/Dot.svelte`, `src/ui/Dots.svelte`, `src/ui/MetadataResolver.svelte`,
`src/ui/Tooltip.svelte`, `src/ui/fileMenu.ts`, `src/ui/sources/index.ts`,
`styles.css`, `esbuild.config.mjs`.

---

## Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Run tests

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

### Build (once implementation exists)

```bash
# Development — watches and writes to vault defined in .env
npm run dev

# Production
npm run build
```

For dev builds, create a `.env` file at the repo root:

```
TEST_VAULT=/path/to/your/obsidian/vault
```

The built plugin files will be written directly to `$TEST_VAULT/.obsidian/plugins/calendar/`.

---

## Implementation plan

See [`docs/plan.md`](docs/plan.md) for the full staged implementation plan.

The stages are:

| Stage | Description | Status |
|---|---|---|
| 0 | Write unit test stubs (fail-first) | **Done** — 263 tests across 17 suites |
| 1 | Repository & tooling setup | **Done** — package.json, tsconfig, jest, manifest |
| 2 | Merge `obsidian-calendar-ui` source (TS/non-Svelte files) | **Done** — types, utils, context, fileStore, localization |
| 3 | Fix deprecated Obsidian API calls | **Done** — getLeaf(false/split) in dailyNotes/weeklyNotes |
| 4 | Resolve `ICalendarSource` version mismatch | **Done** — all four sources use getMetadata API |
| 5 | Svelte 4 migration | **Pending** — no Svelte components written yet |
| 6 | CSS-only tooltip (`Tooltip.svelte`, remove Popper.js) | **Pending** |
| 7 | Templater integration | **Done** — template.ts, settings field, dailyNotes/weeklyNotes wired |
| 8 | Settings cleanup | **Done** — ISettings has templateEngine; Periodic Notes references removed |
| 9 | Known bug fixes | **Done** — setFile(null) guard; source getMetadata null guard; fileStore try/catch |
| 10 | Write Svelte components + main.ts/view.ts | **Pending** |
| 11 | Fill in `it.todo` test bodies | **Pending** — 149 todos across 12 test files |
| 12 | ESLint, lint, typecheck, build, smoke test | **Pending** |

---

## Testing approach

See [`docs/testing.md`](docs/testing.md) for the full philosophy and per-module test specifications.

Key principles:

- Tests are written **before** implementation (Stage 0)
- Every test must **fail** on an empty codebase and **pass** after the corresponding implementation stage
- Mocks live at the Obsidian API boundary — internal functions are never mocked
- `obsidian` and `obsidian-daily-notes-interface` are always-on manual mocks via `moduleNameMapper`; no `jest.mock()` calls needed in test files
- The global `window.app` mock is fully rebuilt before every test via `beforeEach` in `jest.setup.ts`

### Current test status

| Test file | Passing | Todo |
|---|---|---|
| `src/__tests__/framework.test.ts` | 17 | 0 |
| `src/__tests__/localization.test.ts` | 14 | 0 |
| `src/__tests__/settings.test.ts` | 12 | 0 |
| `src/ui/__tests__/utils.test.ts` | 53 | 0 |
| `src/ui/__tests__/context.test.ts` | 3 | 0 |
| `src/io/__tests__/template.test.ts` | 16 | 0 |
| `src/ui/__tests__/stores.test.ts` | 0 | 25 |
| `src/ui/__tests__/fileStore.test.ts` | 0 | 19 |
| `src/io/__tests__/dailyNotes.test.ts` | 0 | 20 |
| `src/io/__tests__/weeklyNotes.test.ts` | 0 | 14 |
| `src/ui/sources/__tests__/wordCount.test.ts` | 0 | 15 |
| `src/ui/sources/__tests__/tasks.test.ts` | 0 | 14 |
| `src/ui/sources/__tests__/tags.test.ts` | 0 | 18 |
| `src/ui/sources/__tests__/streak.test.ts` | 0 | 11 |
| `src/ui/__tests__/Tooltip.test.ts` | 0 | 8 |
| `src/ui/__tests__/Nav.test.ts` | 0 | 0 (smoke) |
| `src/ui/__tests__/Day.test.ts` | 0 | 0 (smoke) |
| **Total** | **115** | **149** |

---

## Dependencies

### Runtime (bundled into main.js)

| Package | Version |
|---|---|
| `svelte` | 4.2.20 |
| `obsidian-daily-notes-interface` | 0.9.4 |
| `tslib` | 2.8.1 |

### Removed from original

`@popperjs/core`, `@popperjs/svelte`, `svelte-portal`, `obsidian-calendar-ui`, all `@rollup/*` packages, `rollup`, `rollup-plugin-svelte`.

---

## Credits

Original plugin by [Liam Cain](https://github.com/liamcain). MIT licensed.
