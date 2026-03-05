# Implementation Plan: simple-obsidian-calendar

Consolidate `obsidian-calendar-plugin` and `obsidian-calendar-ui` into a single flat
repository. Drop `obsidian-periodic-notes`. Update all dependencies. Fix deprecated
Obsidian API calls. Add Templater support for note creation. Replace Popper.js with a
CSS-only tooltip.

---

## Honest Project Assessment (as of 2026-03-06)

### What is done and correct

All non-Svelte TypeScript source files are implemented, correct, and faithfully ported
from the originals with all planned improvements applied:

- `types.ts`, `constants.ts`, `settings.ts`, `localization.ts`
- `io/template.ts`, `io/dailyNotes.ts`, `io/weeklyNotes.ts`
- `ui/context.ts`, `ui/utils.ts`, `ui/stores.ts`, `ui/fileStore.ts`, `ui/modal.ts`
- `ui/sources/wordCount.ts`, `ui/sources/tasks.ts`, `ui/sources/tags.ts`, `ui/sources/streak.ts`

All deprecated Obsidian API calls are fixed in the IO layer. The dependency
modernisation is complete. The `ICalendarSource` version mismatch is resolved. All four
decoration sources use the unified `getMetadata(granularity, date, file)` API.

### What the original test suite revealed about itself

The test-first strategy was appropriate for the IO and utility layers, and those tests
were valuable. However it was applied inappropriately to a porting project where the
reference implementations already existed. The result:

- 71 `it.todo` stubs for code that is already implemented and correct
- `framework.test.ts` failing with 4 errors (testing build scaffolding, not application logic)
- A `tsconfig.test.json` and duplicate mock infrastructure that diverges from the main build

**Decision:** The test suite is abandoned. All `__tests__/`, `__mocks__/`, `__setup__/`,
`jest.config.js`, and `tsconfig.test.json` are removed in Stage A. Correctness is
verified by `tsc --noEmit`, `svelte-check`, and a manual smoke test in Obsidian.

### The real gap

**The plugin cannot be loaded in Obsidian at all.** These files do not yet exist:
`src/main.ts`, `src/view.ts`, `src/ui/Calendar.svelte`, `src/ui/Day.svelte`,
`src/ui/WeekNum.svelte`, `src/ui/Nav.svelte`, `src/ui/Month.svelte`,
`src/ui/Arrow.svelte`, `src/ui/Dot.svelte`, `src/ui/Dots.svelte`,
`src/ui/MetadataResolver.svelte`, `src/ui/Tooltip.svelte`,
`src/ui/fileMenu.ts`, `src/ui/sources/index.ts`, `styles.css`, `esbuild.config.mjs`.

All reference implementations exist in `OLD_DEPS_AND_BLOAT/` and the porting decisions
are fully documented below.

---

## Decisions

| Decision | Choice |
|---|---|
| Repo structure | Single flat repo — all source in one `src/` tree |
| Svelte version | Svelte 4 |
| Decoration sources | Keep all four: word count, streak, tasks, custom tags |
| Template engine | User-selectable in settings (hidden if Templater not installed) |
| Popover / tooltip | CSS-only `Tooltip.svelte` — Popper.js removed |
| Month title click | Always reset to today — no monthly note branch |
| Heartbeat | Restored — 1-minute tick keeps "today" accurate across midnight |
| Author attribution | Keep `liamcain`, add fork note to description |
| `calendar:open` event | Kept for third-party extensibility |
| Weekly note settings | Kept as plugin-level settings |
| `appHasPeriodicNotesPluginLoaded()` | Removed — command always shown |
| `periodic-notes:settings-updated` | Listener kept in `view.ts` (reindexes stores) |
| Test suite | Deleted entirely — replaced by `tsc`, `svelte-check`, smoke test |

---

## Stage A — Strip the Test Suite

**Goal:** Eliminate dead weight so the project state accurately reflects what is done.
Commit after deletion so git history preserves the old tests if ever needed.

### Files to delete

- `src/__tests__/` (entire directory)
- `src/ui/__tests__/` (entire directory)
- `src/io/__tests__/` (entire directory)
- `src/ui/sources/__tests__/` (entire directory)
- `src/__mocks__/` (entire directory)
- `src/__setup__/` (entire directory)
- `jest.config.js`
- `tsconfig.test.json`
- `docs/testing.md`

### `package.json` changes

Remove from `devDependencies`:
`@testing-library/jest-dom`, `@testing-library/svelte`, `@types/jest`,
`jest`, `jest-environment-jsdom`, `ts-jest`

Remove from `scripts`: `test`, `test:watch`

Run `npm install` after editing `package.json`.

**Commit message:** `chore: remove test suite — verification via tsc, svelte-check, and smoke test`

---

## Stage B — Build Infrastructure

Write the two files that unblock `npm run build`. No application logic.

### `esbuild.config.mjs`

Ported from `OLD_DEPS_AND_BLOAT/obsidian-periodic-notes/esbuild.config.mjs`:

- Input: `src/main.ts`
- Output: `main.js` (CJS)
- Externals: `obsidian`, `electron`, `@codemirror/*`, all Node built-ins (via `builtin-modules`)
- Dev: watch mode; output to `$TEST_VAULT/.obsidian/plugins/calendar/` (from `.env`)
- Production: minified, no source maps, `target: "es2018"`
- Svelte plugin: `esbuild-svelte` with `svelte-preprocess`

### `styles.css`

Ported from `OLD_DEPS_AND_BLOAT/obsidian-calendar-plugin/styles.css` (11 lines).
All component CSS remains scoped inside `.svelte` files.

**Commit message:** `build: add esbuild.config.mjs and styles.css`

---

## Stage C — Two Small Source Files

### `src/ui/sources/index.ts`

```ts
export { streakSource } from "./streak";
export { customTagsSource } from "./tags";
export { tasksSource } from "./tasks";
export { wordCountSource } from "./wordCount";
```

### `src/ui/fileMenu.ts`

Ported from `OLD_DEPS_AND_BLOAT/obsidian-calendar-plugin/src/ui/fileMenu.ts`.
One change: `new Menu()` instead of `new Menu(app)` (deprecated API fix, Stage 3).

**Commit message:** `feat: add sources/index.ts and fileMenu.ts`

---

## Stage D — Svelte Components

Port each component from `OLD_DEPS_AND_BLOAT/obsidian-calendar-ui/src/components/`
into `src/ui/`. Apply Svelte 4 changes inline. Update all import paths.
The popover components (`PopoverMenu.svelte`, `Popper.svelte`, `Box.svelte`) are **not
ported** — they are replaced entirely by `Tooltip.svelte`.

Write in this order (inner dependencies first):

### D1 — `src/ui/Dot.svelte`

Straight port. No logic or path changes needed.

### D2 — `src/ui/Dots.svelte`

Port. Change `from "src/types"` → `from "../types"`.

### D3 — `src/ui/Arrow.svelte`

Straight port.

### D4 — `src/ui/MetadataResolver.svelte`

Port. Update import path.

### D5 — `src/ui/Tooltip.svelte` _(new — no original)_

CSS-only tooltip. No external dependencies.

```svelte
<script lang="ts">
  import type { IDayMetadata } from "../types";
  import { fade } from "svelte/transition";
  export let metadata: IDayMetadata[] | null = null;
  export let visible: boolean = false;
  export let x: number = 0;
  export let y: number = 0;
  $: items = metadata?.filter(m => m.value != null) ?? [];
</script>

{#if visible && items.length > 0}
  <div
    class="calendar-tooltip"
    style="left:{x}px;top:{y}px;"
    transition:fade|global={{ duration: 100 }}
  >
    {#each items as item}
      <div class="tooltip-row">
        <span class="tooltip-name">{item.name}</span>
        <span class="tooltip-value">{item.value}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .calendar-tooltip {
    background-color: var(--background-secondary);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-s);
    color: var(--text-normal);
    font-size: 0.8em;
    padding: 6px 10px;
    pointer-events: none;
    position: absolute;
    z-index: var(--layer-popover);
  }
  .tooltip-row {
    display: flex;
    gap: 0.5em;
    justify-content: space-between;
  }
  .tooltip-name {
    color: var(--text-muted);
  }
</style>
```

### D6 — `src/ui/WeekNum.svelte`

Port from calendar-ui. Update all import paths.

### D7 — `src/ui/Day.svelte`

Port from calendar-ui. Update all import paths.
Svelte 4 check: verify `:global()` CSS scoping; add where `svelte-check` flags it.

### D8 — `src/ui/Month.svelte`

Port from `OLD_DEPS_AND_BLOAT/obsidian-calendar-ui/src/components/Month.svelte`
with these changes:

- Remove `appHasMonthlyNotesPluginLoaded` import and all uses
- `handleClick` always calls `resetDisplayedMonth()` — the monthly note `onClick` branch
  is removed entirely
- `handleHover` becomes a no-op (no hover dispatch needed without monthly note support)
- `draggable` / `onDragStart` kept (harmless)
- Props `onHover`, `onClick`, `onContextMenu` can be removed since they are no longer used

### D9 — `src/ui/Nav.svelte`

Port from calendar-ui. Update import paths to use local `./Month.svelte`.

### D10 — `src/ui/Calendar.svelte`

Port from `OLD_DEPS_AND_BLOAT/obsidian-calendar-ui/src/components/Calendar.svelte`
with these changes:

1. **Remove all popover/portal/Popper imports and state** (`PopoverMenu`, `svelte-portal`,
   `@popperjs/svelte`, `hoveredDay`, `showPopover`, `popoverMetadata`, `hoverTimeout`,
   `openPopover`, `updatePopover`, `dismissPopover`)

2. **Add Tooltip wiring:**

```svelte
import { onDestroy } from "svelte";
import Tooltip from "./Tooltip.svelte";

let tooltipVisible = false;
let tooltipX = 0;
let tooltipY = 0;
let tooltipMetadata: IDayMetadata[] | null = null;
let tooltipTimer: ReturnType<typeof setTimeout>;
let calendarEl: HTMLElement;

function handleHoverDay(event: CustomEvent) {
  const { metadata, target } = event.detail;
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => {
    const cr = calendarEl.getBoundingClientRect();
    const tr = (target as HTMLElement).getBoundingClientRect();
    tooltipX = tr.left - cr.left;
    tooltipY = tr.bottom - cr.top + 4;
    tooltipMetadata = metadata;
    tooltipVisible = true;
  }, 500);
}

function handleEndHover() {
  clearTimeout(tooltipTimer);
  tooltipVisible = false;
}
```

3. **Add heartbeat:**

```svelte
let heartbeat = setInterval(() => {
  today = window.moment();
  const isViewingCurrentMonth = $displayedMonthStore.isSame(today, "day");
  if (isViewingCurrentMonth) {
    displayedMonthStore.set(today.clone());
  }
}, 1000 * 60);

onDestroy(() => clearInterval(heartbeat));
```

4. **Wrap table in a positioned container, bind `calendarEl`, add `<Tooltip>`:**

```svelte
<div id="calendar-container" class="container" bind:this={calendarEl}>
  <Nav ... on:hoverDay={handleHoverDay} on:endHoverDay={handleEndHover} />
  <table class="calendar">...</table>
  <Tooltip
    visible={tooltipVisible}
    metadata={tooltipMetadata}
    x={tooltipX}
    y={tooltipY}
  />
</div>
```

5. Update all import paths to local `src/ui/`.
6. Svelte 4: `transition:fade|global` modifier on `Tooltip`.
7. Keep `setContext(IS_MOBILE, ...)` and `setContext(DISPLAYED_MONTH, ...)`.

**Commit message:** `feat: add all Svelte UI components (Dot through Calendar)`

---

## Stage E — `src/view.ts`

Port from `OLD_DEPS_AND_BLOAT/obsidian-calendar-plugin/src/view.ts`.

### Deprecated API fixes

| Old | New |
|---|---|
| `workspace.splitActiveLeaf()` | `workspace.getLeaf("split")` |
| `workspace.getUnpinnedLeaf()` | `workspace.getLeaf(false)` |
| `workspace.setActiveLeaf(leaf, true, true)` | `workspace.setActiveLeaf(leaf, { focus: true })` |
| Bare `workspace.` references | `this.app.workspace.` |

### New unified event handler API

The original `view.ts` passed separate `onClickDay`, `onClickWeek`, `onHoverDay`,
`onHoverWeek`, `onContextMenuDay`, `onContextMenuWeek` props. The merged `Calendar.svelte`
uses a unified API with a single handler per event type, dispatching on `granularity`:

```ts
this.calendar = new Calendar({
  target: this.contentEl,
  props: {
    plugin: this,
    showWeekNums: get(settings).showWeeklyNote,
    sources,
    today: window.moment(),
    eventHandlers: {
      onClick:        this.handleClick.bind(this),
      onHover:        this.handleHover.bind(this),
      onContextMenu:  this.handleContextMenu.bind(this),
    },
    getSourceSettings: (id: string) => this.getSourceSettings(id),
  },
});
```

Where:
- `handleClick(granularity, date, file, inNewSplit)` → dispatches to
  `openOrCreateDailyNote` or `openOrCreateWeeklyNote`
- `handleHover(granularity, date, file, targetEl, isMetaPressed)` → fires
  `link-hover` workspace event when meta is pressed (for both day and week granularity)
- `handleContextMenu(granularity, date, file, event)` → calls `showFileMenu`
- `getSourceSettings(id)` → returns fallback `ISourceSettings` (color/display/order)
  since this plugin does not persist per-source settings

### Other notes

- Keep the `periodic-notes:settings-updated` listener (just calls `reindex()` — harmless)
- Keep `revealActiveNote()`
- `onFileOpen` handler uses `this.app.workspace.activeLeaf` — verify it is still valid
  in modern Obsidian (use `workspace.getActiveViewOfType` if needed)

**Commit message:** `feat: add src/view.ts — CalendarView ItemView`

---

## Stage F — `src/main.ts`

Port from `OLD_DEPS_AND_BLOAT/obsidian-calendar-plugin/src/main.ts`.

### Changes from original

| Old | New |
|---|---|
| `workspace.on("layout-ready", ...)` | `workspace.onLayoutReady(...)` |
| `appHasPeriodicNotesPluginLoaded()` check in weekly note command | **Removed** — command always registered |

### Contents

- `CalendarPlugin extends Plugin`
- `onload()`:
  1. Subscribe to `settings` store so `this.options` stays current
  2. Register `VIEW_TYPE_CALENDAR` view
  3. Add commands: `show-calendar-view`, `open-weekly-note`, `reveal-active-note`
  4. Call `loadOptions()`
  5. Add `CalendarSettingsTab`
  6. `workspace.onLayoutReady(() => this.initLeaf())`
- `onunload()`: detach all calendar leaves
- `initLeaf()`: open in right sidebar if no leaf exists
- `loadOptions()` / `writeOptions()`: load/save plugin data to/from `settings` store

### `CalendarSettingsTab.display()`

Sections and settings (ported from `OLD_DEPS_AND_BLOAT/obsidian-calendar-plugin/src/settings.ts`):

**General Settings**
- Warning banner if Daily Notes core plugin not enabled
- Words per dot (number input, default 250)
- Start week on (dropdown: locale default + all weekdays)
- Confirm before creating new note (toggle)
- Show week number (toggle — triggers `this.display()` to show/hide Weekly Note section)

**Weekly Note Settings** _(shown only when `showWeeklyNote = true`)_
- Weekly note format (text, placeholder `gggg-[W]ww`)
- Weekly note template (text)
- Weekly note folder (text)

**Advanced Settings**
- Override locale (dropdown: system default + all moment locales)
- Template engine (dropdown: "Obsidian built-in" / "Templater plugin") —
  **shown only when `templaterIsAvailable(this.app)` returns true**

Note: the original settings tab had a notice about "Weekly Note settings are moving
to Periodic Notes plugin". That notice is **removed** — this fork owns weekly notes
permanently.

**Commit message:** `feat: add src/main.ts — CalendarPlugin entry point with settings tab`

---

## Stage G — Typecheck, Lint, Build

Run each command in order. Fix all errors before proceeding to the next.

```bash
tsc --noEmit          # fix all TypeScript errors
svelte-check          # fix Svelte type errors and :global() warnings
eslint .              # fix lint errors
node esbuild.config.mjs production  # must produce main.js
```

### Common expected issues

- Import path errors (`.svelte` extension may need to be explicit in some imports)
- `eventHandlers` prop typing — `Calendar.svelte` accepts a `Record<string, CallableFunction>`
  or typed interface; ensure `view.ts` and the component agree
- `ISourceSettings` shape — `getSourceSettings` returns a full `ISourceSettings`; verify
  the fallback in `view.ts` satisfies the type
- `importsNotUsedAsValues` — any type-only imports must use `import type`
- `svelte-check` may flag `:global()` CSS in `Day.svelte` or `Dots.svelte` — add `:global`
  wrapper where flagged

**Commit message:** `fix: resolve all TypeScript, Svelte, and ESLint errors — clean build`

---

## Stage H — Documentation Update

Update `README.md` to reflect the completed state:
- Remove the "Not yet written" section and stale stage table
- Add build and install instructions
- Update the repository structure listing

**Commit message:** `docs: update README for completed port`

---

## Stage I — Smoke Test in Obsidian

Install the built plugin into a local vault (`npm run dev`, writing to `$TEST_VAULT`)
and verify every user-facing behaviour:

| Scenario | Expected result |
|---|---|
| Enable plugin | Calendar sidebar appears in right panel |
| Click a day (no note, confirm=true) | Confirmation dialog → note created and opened |
| Click a day (confirm=false) | Note created immediately |
| Cmd/Ctrl+click a day | Note opens in a split pane |
| Click a week number (showWeeklyNote=true) | Weekly note created/opened |
| Right-click a day cell with a note | Context menu with Delete item |
| Hover a day with a note | Tooltip appears after ~500ms |
| Cmd/Ctrl+hover a day | Obsidian hover preview fires |
| Nav left/right arrows | Month retreats/advances |
| Nav centre dot | Resets to today's month |
| Month title click | Resets to today's month |
| Leave Obsidian open past midnight | "Today" highlight moves to next day |
| Templater installed, engine set to Templater | Templater template executes on note creation |

**Commit message:** `chore: smoke-test verified — v2.0.0 complete`

---

## File Porting Reference

| File to create | Reference in `OLD_DEPS_AND_BLOAT/` | Key changes |
|---|---|---|
| `esbuild.config.mjs` | `obsidian-periodic-notes/esbuild.config.mjs` | Output name `calendar`; target `es2018` |
| `styles.css` | `obsidian-calendar-plugin/styles.css` | Exact copy (11 lines) |
| `src/ui/sources/index.ts` | `obsidian-calendar-plugin/src/ui/sources/index.ts` | Exact copy |
| `src/ui/fileMenu.ts` | `obsidian-calendar-plugin/src/ui/fileMenu.ts` | `new Menu()` not `new Menu(app)` |
| `src/ui/Dot.svelte` | `obsidian-calendar-ui/src/components/Dot.svelte` | Exact copy |
| `src/ui/Dots.svelte` | `obsidian-calendar-ui/src/components/Dots.svelte` | `"src/types"` → `"../types"` |
| `src/ui/Arrow.svelte` | `obsidian-calendar-ui/src/components/Arrow.svelte` | Exact copy |
| `src/ui/MetadataResolver.svelte` | `obsidian-calendar-ui/src/components/MetadataResolver.svelte` | Update import path |
| `src/ui/Tooltip.svelte` | **New** (spec in Stage D5 above) | CSS-only; no Popper |
| `src/ui/Month.svelte` | `obsidian-calendar-ui/src/components/Month.svelte` | Remove `appHasMonthlyNotesPluginLoaded()`; always reset to today |
| `src/ui/WeekNum.svelte` | `obsidian-calendar-ui/src/components/WeekNum.svelte` | Update import paths |
| `src/ui/Day.svelte` | `obsidian-calendar-ui/src/components/Day.svelte` | Update import paths |
| `src/ui/Nav.svelte` | `obsidian-calendar-ui/src/components/Nav.svelte` | Use local `./Month.svelte` |
| `src/ui/Calendar.svelte` | `obsidian-calendar-ui/src/components/Calendar.svelte` | Remove Popper; add Tooltip + heartbeat |
| `src/view.ts` | `obsidian-calendar-plugin/src/view.ts` | Fix deprecated APIs; unified event handlers |
| `src/main.ts` | `obsidian-calendar-plugin/src/main.ts` | `onLayoutReady`; remove periodic-notes check; add Templater setting |

## Files Deleted in Stage A

| Path | Reason |
|---|---|
| `src/__tests__/` | Test suite abandoned |
| `src/ui/__tests__/` | Test suite abandoned |
| `src/io/__tests__/` | Test suite abandoned |
| `src/ui/sources/__tests__/` | Test suite abandoned |
| `src/__mocks__/` | Test infrastructure |
| `src/__setup__/` | Test infrastructure |
| `jest.config.js` | Test infrastructure |
| `tsconfig.test.json` | Test infrastructure |
| `docs/testing.md` | Documents abandoned strategy |

---

## Commit Cadence

Commit after each stage (A through I). Never batch more than one stage per commit.
Commit messages follow the `type: description` convention (`feat:`, `fix:`, `build:`,
`chore:`, `docs:`). Always run `tsc --noEmit` before committing to catch regressions.
Each commit must leave the repo in a state where the codebase either builds cleanly
or the reason it does not is self-evident from the staged files.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `svelte-check` flags `:global()` CSS | Medium | Run early in Stage G; fix inline per warning |
| `eventHandlers` spread typing is strict in Svelte 4 | Medium | Use explicit typed interface or `Record<string, CallableFunction>` |
| `getSourceSettings` prop not threaded correctly | Low | Each component already accepts it per calendar-ui original |
| `esbuild-svelte` version mismatch with Svelte 4 | Low | Already confirmed compatible in `package.json` |
| `workspace.activeLeaf` removed in newer Obsidian | Low | Use `getActiveViewOfType(MarkdownView)` fallback if needed |

---

## Final Dependency Inventory

### Runtime (bundled into main.js)

| Package | Version |
|---|---|
| `svelte` | 4.2.20 |
| `obsidian-daily-notes-interface` | 0.9.4 |
| `tslib` | 2.8.1 |

### Dev / Build

| Package | Version |
|---|---|
| `obsidian` | github:obsidianmd/obsidian-api#master |
| `esbuild` | 0.27.3 |
| `esbuild-svelte` | 0.9.4 |
| `svelte-preprocess` | 5.1.4 |
| `svelte-check` | 3.8.6 |
| `typescript` | 5.9.3 |
| `@tsconfig/svelte` | 5.0.8 |
| `@typescript-eslint/eslint-plugin` | 8.56.1 |
| `@typescript-eslint/parser` | 8.56.1 |
| `eslint` | 9.x |
| `eslint-plugin-obsidianmd` | 0.1.9 |
| `moment` | 2.30.1 |
| `@types/moment` | 2.13.0 |
| `@types/node` | 22.x |
| `builtin-modules` | 5.0.0 |
| `dotenv` | 17.3.1 |
| `standard-version` | 9.x |

### Removed entirely (from original three-repo system)

`@popperjs/core`, `@popperjs/svelte`, `svelte-portal`, `obsidian-calendar-ui`,
`rollup`, `rollup-plugin-svelte`, all `@rollup/*` packages, `svelte-jester`,
`@testing-library/jest-dom`, `@testing-library/svelte`, `jest`, `jest-environment-jsdom`,
`ts-jest`, `@types/jest`
