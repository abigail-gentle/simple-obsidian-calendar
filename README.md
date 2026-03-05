# simple-obsidian-calendar

A community fork of [liamcain/obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin), consolidated into a single repository and updated for modern Obsidian.

---

## Status

**Version:** 2.0.0-dev  
**Stage:** Testing framework built. Implementation not yet started.

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
│   ├── plan.md          ← full 10-stage implementation plan
│   └── testing.md       ← unit test philosophy and per-module test specifications
├── src/
│   ├── __mocks__/       ← manual Jest mocks for obsidian and obsidian-daily-notes-interface
│   ├── __setup__/       ← jest.setup.ts (global mocks, window.app, window.moment)
│   ├── __tests__/       ← framework smoke test (17 passing); home for future top-level tests
│   ├── io/
│   │   └── __tests__/   ← placeholder for dailyNotes, weeklyNotes, template tests
│   └── ui/
│       ├── __tests__/   ← placeholder for store, fileStore, component tests
│       └── sources/
│           └── __tests__/ ← placeholder for source implementation tests
├── jest.config.js
├── tsconfig.json        ← main build config
├── tsconfig.test.json   ← test-only overrides (commonjs, mock path aliases)
└── package.json
```

Plugin source (`src/main.ts`, `src/view.ts`, etc.) does not exist yet — it will be written in Stages 1–10 after the unit tests are reviewed and approved (see `docs/plan.md`).

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
| 0 | Write unit tests (fail-first) | **Next** |
| 1 | Repository & tooling setup | Pending |
| 2 | Merge `obsidian-calendar-ui` source | Pending |
| 3 | Fix deprecated Obsidian API calls | Pending |
| 4 | Resolve `ICalendarSource` version mismatch | Pending |
| 5 | Svelte 4 migration | Pending |
| 6 | CSS-only tooltip (remove Popper.js) | Pending |
| 7 | Templater integration | Pending |
| 8 | Settings cleanup | Pending |
| 9 | Known bug fixes | Pending |
| 10 | Final cleanup, lint, typecheck, smoke test | Pending |

---

## Testing approach

See [`docs/testing.md`](docs/testing.md) for the full philosophy and per-module test specifications.

Key principles:

- Tests are written **before** implementation (Stage 0)
- Every test must **fail** on an empty codebase and **pass** after the corresponding implementation stage
- Mocks live at the Obsidian API boundary — internal functions are never mocked
- `obsidian` and `obsidian-daily-notes-interface` are always-on manual mocks via `moduleNameMapper`; no `jest.mock()` calls needed in test files
- The global `window.app` mock is rebuilt from scratch before every test via `beforeEach` in `jest.setup.ts`

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
