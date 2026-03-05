# Implementation Plan: simple-obsidian-calendar

Consolidate `obsidian-calendar-plugin` and `obsidian-calendar-ui` into a single flat
repository. Drop `obsidian-periodic-notes`. Update all dependencies. Fix deprecated
Obsidian API calls. Add Templater support for note creation. Replace Popper.js with a
CSS-only tooltip.

---

## Decisions

| Decision | Choice |
|---|---|
| Repo structure | Single flat repo — all source in one `src/` tree |
| Svelte version | Svelte 4 |
| Decoration sources | Keep all four: word count, streak, tasks, custom tags |
| Template engine | User-selectable in settings (hidden if Templater not installed) |
| Popover / tooltip | CSS-only `Tooltip.svelte` — Popper.js removed |
| Author attribution | Keep `liamcain`, add fork note to description |
| `calendar:open` event | Kept for third-party extensibility |
| Weekly note settings | Kept as plugin-level settings |

---

## Stage 0 — Unit Test Development (Write First, Then Review) ✅ DONE

Unit tests were written before implementation. See [`testing.md`](./testing.md) for the
full philosophy and test-case specifications.

**Deliverables (all done):**
- `jest.config.js` and test infrastructure configured — committed `4c11533`
- `src/__mocks__/obsidian.ts` — mock of the Obsidian API module
- `src/__mocks__/obsidian-daily-notes-interface.ts` — mock of the interface library
- All test files in `src/**/__tests__/` with full `describe`/`it.todo` stubs — committed `aca6978`
  (246 todos across 16 test files)

---

## Stage 1 — Repository & Tooling Setup ✅ DONE

### 1.1 Directory layout

```
simple-obsidian-calendar/
├── docs/
│   ├── plan.md             ← this file
│   └── testing.md          ← unit test philosophy
├── src/
│   ├── main.ts
│   ├── view.ts
│   ├── settings.ts
│   ├── constants.ts
│   ├── types.ts                   ← merged from calendar-ui/src/types.ts
│   ├── localization.ts            ← merged from calendar-ui/src/localization.ts
│   ├── io/
│   │   ├── dailyNotes.ts
│   │   ├── weeklyNotes.ts
│   │   └── template.ts            ← NEW: Templater detection + application
│   └── ui/
│       ├── Calendar.svelte        ← merged calendar-ui Calendar (replaces thin wrapper)
│       ├── Day.svelte
│       ├── WeekNum.svelte
│       ├── Nav.svelte
│       ├── Arrow.svelte
│       ├── Dot.svelte
│       ├── Dots.svelte
│       ├── MetadataResolver.svelte
│       ├── Tooltip.svelte         ← NEW: CSS-only tooltip
│       ├── modal.ts
│       ├── fileMenu.ts
│       ├── stores.ts
│       ├── utils.ts               ← merged with calendar-ui utils
│       ├── context.ts             ← converted from calendar-ui context.js (.js → .ts)
│       ├── fileStore.ts           ← merged from calendar-ui
│       └── sources/
│           ├── index.ts
│           ├── wordCount.ts
│           ├── streak.ts
│           ├── tags.ts
│           └── tasks.ts
├── styles.css
├── manifest.json
├── versions.json
├── esbuild.config.mjs             ← replaces rollup.config.js
├── tsconfig.json
├── jest.config.js
├── package.json
├── eslint.config.js               ← ESLint 9 flat config
└── .prettierrc
```

### 1.2 package.json

**Runtime dependencies (bundled into main.js):**

| Package | Old | New | Notes |
|---|---|---|---|
| `svelte` | `3.35.0` | `^4.2.0` | Major bump |
| `obsidian-daily-notes-interface` | `0.9.0` | `0.9.4` | Latest; no breaking changes |
| `tslib` | `2.1.0` | `^2.8.1` | Minor bump |
| `obsidian-calendar-ui` | `0.3.12` | **removed** | Folded into `src/` |
| `@popperjs/core` | `2.9.2` | **removed** | CSS tooltip instead |
| `@popperjs/svelte` | `0.1.1` | **removed** | |
| `svelte-portal` | `2.1.2` | **removed** | |

**Dev dependencies:**

| Package | Old | New | Notes |
|---|---|---|---|
| `rollup` + all `@rollup/*` | various | **removed** | Replaced by esbuild |
| `rollup-plugin-svelte` | `7.1.0` | **removed** | |
| `esbuild` | *(absent)* | `^0.27.3` | |
| `esbuild-svelte` | *(absent)* | `^0.8.0` | |
| `svelte-preprocess` | `4.7.0` | `^5.1.0` | Svelte 4 compat |
| `svelte-check` | `1.3.0` | `^3.8.0` | Svelte 4 |
| `typescript` | `4.2.3` | `^5.9.3` | Major bump |
| `@tsconfig/svelte` | `1.0.10` | `^5.0.4` | Svelte 4 |
| `@typescript-eslint/*` | `4.20.0` | `^8.x` | Major bump |
| `eslint` | `7.23.0` | `^9.x` | Flat config |
| `jest` | `26.6.3` | `^29.x` | |
| `ts-jest` | `26.5.4` | `^29.x` | |
| `@types/jest` | `26.0.22` | `^29.x` | |
| `@testing-library/svelte` | *(absent)* | `^4.x` | Svelte component tests |
| `@testing-library/jest-dom` | *(absent)* | `^6.x` | DOM matchers |
| `dotenv` | *(absent)* | `^16.0.0` | Dev vault path from `.env` |
| `builtin-modules` | *(absent)* | `^3.3.0` | esbuild externals list |
| `svelte-jester` | `1.3.2` | **removed** | Replaced by `@testing-library/svelte` |
| `standard-version` | *(absent)* | `^9.x` | Changelog / version bumping |

**npm scripts:**

```json
{
  "dev":      "node esbuild.config.mjs",
  "build":    "node esbuild.config.mjs production",
  "lint":     "svelte-check && eslint . && tsc --noEmit",
  "test":     "jest",
  "test:watch": "jest --watch",
  "release":  "standard-version"
}
```

### 1.3 esbuild.config.mjs

Ported from `obsidian-periodic-notes` (the most up-to-date version):

- Input: `src/main.ts`
- Output: `main.js` (CJS)
- Externals: `obsidian`, `electron`, `@codemirror/*`, all Node built-ins (via `builtin-modules`)
- Dev: watch mode, output to `$TEST_VAULT/.obsidian/plugins/calendar/` (from `.env`)
- Prod: minified, tree-shaken, no source maps, target `es2018`
- `esbuild-svelte` plugin with `svelte-preprocess`

### 1.4 tsconfig.json

Based on `obsidian-periodic-notes` (most strict), with path alias from the plugin:

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": { "src/*": ["src/*"] },
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "importHelpers": true,
    "importsNotUsedAsValues": "remove",
    "lib": ["dom", "es2018"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 1.5 manifest.json

```json
{
  "id": "calendar",
  "name": "Calendar",
  "description": "Calendar view of your daily and weekly notes (community fork of liamcain/obsidian-calendar-plugin)",
  "version": "2.0.0",
  "author": "liamcain",
  "minAppVersion": "1.0.0",
  "isDesktopOnly": false
}
```

---

## Stage 2 — Merge calendar-ui Source ✅ DONE (non-Svelte files)

Copy all files from `obsidian-calendar-ui/src/` into the appropriate places in `src/`,
then fix all imports. No logic changes in this stage — only structural merging.

**Status:** All non-Svelte files are done. Svelte component files are deferred to Stage 10
(written after the non-Svelte core is tested). See file mapping below for individual status.

### 2.1 File mapping

| `calendar-ui` source | Destination | Status |
|---|---|---|
| `src/components/Calendar.svelte` | `src/ui/Calendar.svelte` | ⏳ Pending (Stage 10) |
| `src/components/Day.svelte` | `src/ui/Day.svelte` | ⏳ Pending (Stage 10) |
| `src/components/WeekNum.svelte` | `src/ui/WeekNum.svelte` | ⏳ Pending (Stage 10) |
| `src/components/Nav.svelte` | `src/ui/Nav.svelte` | ⏳ Pending (Stage 10) — remove `appHasMonthlyNotesPluginLoaded` |
| `src/components/Arrow.svelte` | `src/ui/Arrow.svelte` | ⏳ Pending (Stage 10) |
| `src/components/Dot.svelte` | `src/ui/Dot.svelte` | ⏳ Pending (Stage 10) |
| `src/components/Dots.svelte` | `src/ui/Dots.svelte` | ⏳ Pending (Stage 10) |
| `src/components/MetadataResolver.svelte` | `src/ui/MetadataResolver.svelte` | ⏳ Pending (Stage 10) |
| `src/components/popover/*.svelte` | **deleted** | ✅ Removed — replaced by `Tooltip.svelte` (Stage 6) |
| `src/fileStore.ts` | `src/ui/fileStore.ts` | ✅ Done — committed `cd57d7c` |
| `src/localization.ts` | `src/localization.ts` | ✅ Done — uses vault.getConfig instead of localStorage |
| `src/types.ts` | `src/types.ts` | ✅ Done — merged with plugin types |
| `src/utils.ts` | `src/ui/utils.ts` | ✅ Done — 53 tests passing |
| `src/context.js` | `src/ui/context.ts` | ✅ Done — converted to TypeScript |
| `index.d.ts` | **deleted** | ✅ Done — no longer a library |
| `popper.d.ts` | **deleted** | ✅ Done — Popper removed |

### 2.2 Nav.svelte: remove monthly notes detection

`appHasMonthlyNotesPluginLoaded()` in `Nav.svelte` / `Month.svelte` currently changes
the behaviour of clicking the month title. Since we are dropping Periodic Notes, clicking
the month title always uses the existing fallback: reset the displayed month to today.
Remove the `if (appHasMonthlyNotesPluginLoaded())` branch.

### 2.3 Import path surgery

- All `from "obsidian-calendar-ui"` in plugin files → local relative paths
- All `from "src/..."` path-aliased imports → verified against new tsconfig `paths`
- Remove any imports of the now-deleted Popper files (stubs only at this stage; wiring is
  removed in Stage 6)

### 2.4 Calendar.svelte: wire plugin instance

The v0.4.0 `Calendar` component requires a `plugin: Plugin` prop (used by
`PeriodicNotesCache` to register vault events). The merged `Calendar.svelte` receives
`plugin` from `view.ts`:

```ts
// view.ts — onOpen()
this.calendar = new Calendar({
  target: (this as any).contentEl,
  props: {
    plugin: this,
    showWeekNums: get(settings).showWeeklyNote,
    sources,
    eventHandlers: {
      onClick: this.handleClick,
      onHover:  this.handleHover,
      onContextMenu: this.handleContextMenu,
    },
    getSourceSettings: (id: string) => this.getSourceSettings(id),
  },
});
```

---

## Stage 3 — Fix Deprecated Obsidian API Calls ✅ DONE

All of these are mechanical, one-line changes. Affected files: `src/main.ts`,
`src/view.ts`, `src/ui/fileMenu.ts`, `src/io/dailyNotes.ts`, `src/io/weeklyNotes.ts`.

| Deprecated call | Replacement | File(s) | Status |
|---|---|---|---|
| `workspace.getUnpinnedLeaf()` | `workspace.getLeaf(false)` | `io/dailyNotes.ts`, `io/weeklyNotes.ts` | ✅ Done |
| `workspace.splitActiveLeaf()` | `workspace.getLeaf('split')` | Same | ✅ Done |
| `workspace.on('layout-ready', cb)` | `workspace.onLayoutReady(cb)` | `main.ts` | ⏳ Pending (`main.ts` not written) |
| `new Menu(app)` | `new Menu()` | `ui/fileMenu.ts` | ⏳ Pending (`fileMenu.ts` not written) |
| `workspace.setActiveLeaf(leaf, true, true)` | `workspace.setActiveLeaf(leaf, { focus: true })` | `view.ts` | ⏳ Pending (`view.ts` not written) |
| Bare `workspace.` references *(bug)* | `this.app.workspace.` | `view.ts` | ⏳ Pending |

---

## Stage 4 — Resolve the ICalendarSource Version Mismatch ✅ DONE

**Status: Done** — all four sources implemented with the unified API in `cd57d7c`.

The plugin's four sources used the **old v0.3.x API** (`getDailyMetadata` /
`getWeeklyMetadata`). The merged `calendar-ui` code at v0.4.0 expects the **unified API**
(`getMetadata(granularity, date, file)`). All four sources have been updated. Internal logic
(word counting, streak detection, tag reading, task counting) is unchanged.

### 4.1 New unified interface (already in `src/types.ts`)

```ts
interface ICalendarSource {
  id: string;
  name: string;
  description?: string;
  defaultSettings: Record<string, string | number>;
  getMetadata?: (
    granularity: IGranularity,
    date: Moment,
    file: TFile | null
  ) => Promise<IEvaluatedMetadata>;
  registerSettings?: (
    containerEl: HTMLElement,
    settings: ISourceSettings,
    saveSettings: (s: Partial<ISourceSettings>) => void
  ) => void;
}
```

### 4.2 Per-source changes

**wordCount.ts**
```ts
export const wordCountSource: ICalendarSource = {
  id: "word-count",
  name: "Word Count",
  defaultSettings: { color: "default", display: "calendar-and-menu", order: 1 },
  getMetadata: async (granularity, date, file) => {
    if (!file) return { dots: [] };
    const words = getWordCount(await window.app.vault.cachedRead(file));
    const numDots = Math.min(5, Math.floor(words / get(settings).wordsPerDot));
    return { value: words, dots: Array(numDots).fill({ isFilled: true }) };
  },
};
```

**streak.ts**
```ts
export const streakSource: ICalendarSource = {
  id: "streak",
  name: "Streak",
  defaultSettings: { color: "default", display: "calendar-and-menu", order: 4 },
  getMetadata: async (granularity, date, file) => ({
    classes: getStreakClasses(file),
    dots: [],
  }),
};
```

**tags.ts**
```ts
export const customTagsSource: ICalendarSource = {
  id: "tags",
  name: "Custom Tags",
  defaultSettings: { color: "default", display: "calendar-and-menu", order: 3 },
  getMetadata: async (granularity, date, file) => ({
    dataAttributes: getFormattedTagAttributes(file),
    dots: [],
  }),
};
```

**tasks.ts**
```ts
export const tasksSource: ICalendarSource = {
  id: "tasks",
  name: "Tasks",
  defaultSettings: { color: "default", display: "calendar-and-menu", order: 2 },
  getMetadata: async (granularity, date, file) => ({
    dots: await getDotsForFile(file),
  }),
};
```

---

## Stage 5 — Svelte 4 Migration ⏳ PENDING

Svelte 4 is largely backwards-compatible with Svelte 3. No `.svelte` files exist yet —
this stage is done in conjunction with Stage 10 (writing the components). Items to address:

| Change | Affected files | Action |
|---|---|---|
| `SvelteComponentTyped` removed | `index.d.ts` | Already deleted |
| CSS `:global()` scoping tightened | All `.svelte` files | Run `svelte-check`; add `:global` where flagged |
| Transition `\|global` modifier required on conditionally-mounted elements | `Tooltip.svelte` | Add `\|global` to any `transition:fade` |
| `svelte-preprocess` 4 → 5 | `esbuild.config.mjs` | Update plugin config |
| `createEventDispatcher` typed return | All `.svelte` files using `dispatch` | Verify types compile; no behaviour change |

---

## Stage 6 — CSS-only Tooltip (Replace Popper.js) ⏳ PENDING

### 6.1 Remove dependencies

Remove from `package.json`: `@popperjs/core`, `@popperjs/svelte`, `svelte-portal`.

### 6.2 New `Tooltip.svelte`

A lightweight CSS tooltip with no external dependencies:

- Absolutely positioned inside a `position: relative` wrapper on the calendar container
- Coordinates computed from `getBoundingClientRect()` of the hovered cell relative to the
  calendar container element
- Appears after **500 ms** delay on `pointerenter`; dismissed immediately on `pointerleave`
- Only rendered when `visible && metadata && metadata.some(m => m.value != null)`
- Styled with Obsidian CSS variables: `--background-secondary`, `--text-normal`,
  `--text-muted`, `--radius-m`, `--shadow-s`

```svelte
<!-- src/ui/Tooltip.svelte -->
<script lang="ts">
  import type { IDayMetadata } from "../types";
  export let metadata: IDayMetadata[] | null = null;
  export let visible: boolean = false;
  export let x: number = 0;
  export let y: number = 0;
  $: items = metadata?.filter(m => m.value != null) ?? [];
</script>

{#if visible && items.length > 0}
  <div class="calendar-tooltip" style="left:{x}px;top:{y}px;" transition:fade|global={{ duration: 100 }}>
    {#each items as item}
      <div class="tooltip-row">
        <span class="tooltip-name">{item.name}</span>
        <span class="tooltip-value">{item.value}</span>
      </div>
    {/each}
  </div>
{/if}
```

### 6.3 Calendar.svelte wiring

Replace all Popper / portal / popover state and imports with:

```svelte
<script>
  let tooltipVisible = false;
  let tooltipX = 0, tooltipY = 0;
  let tooltipMetadata: IDayMetadata[] | null = null;
  let tooltipTimer: ReturnType<typeof setTimeout>;
  let calendarEl: HTMLElement;

  function handleHoverDay({ detail: { metadata, target } }) {
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
</script>

<div class="calendar-container" bind:this={calendarEl}>
  <Nav ... />
  <table class="calendar">...</table>
  <Tooltip visible={tooltipVisible} metadata={tooltipMetadata} x={tooltipX} y={tooltipY} />
</div>
```

---

## Stage 7 — Templater Integration ✅ DONE (core logic; settings UI pending)

**Status:** `src/io/template.ts` is done (16 tests passing). `dailyNotes.ts` and
`weeklyNotes.ts` are wired. `ISettings.templateEngine` field exists. Settings UI (§7.4) is
pending — depends on `CalendarSettingsTab` in `main.ts`/`view.ts`.

### 7.1 New `src/io/template.ts`

```ts
import type { App, TFile } from "obsidian";

/** True if the Templater community plugin is installed and enabled. */
export function templaterIsAvailable(app: App): boolean {
  return !!((app as any).plugins?.plugins?.["templater-obsidian"]);
}

/**
 * Apply a template to an already-created file.
 *
 * If `engine === "templater"` and Templater is available, calls
 * `templater.write_template_to_file`. Otherwise does nothing (the built-in
 * template was already applied by createDailyNote / createWeeklyNote).
 *
 * Never throws — if the template file is missing, logs a warning and returns.
 */
export async function applyTemplate(
  app: App,
  engine: "obsidian" | "templater",
  templatePath: string,
  targetFile: TFile
): Promise<void> {
  if (engine !== "templater" || !templaterIsAvailable(app)) return;
  const templater = (app as any).plugins.plugins["templater-obsidian"];
  const templateFile = app.vault.getAbstractFileByPath(templatePath) as TFile | null;
  if (!templateFile) {
    console.warn(`[Calendar] Templater template not found: ${templatePath}`);
    return;
  }
  await templater.templater.write_template_to_file(templateFile, targetFile);
}
```

### 7.2 Updated `io/dailyNotes.ts`

```ts
import { createDailyNote, getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { applyTemplate } from "./template";
import { createConfirmationDialog } from "src/ui/modal";
import type { ISettings } from "src/settings";

export async function tryToCreateDailyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace } = window.app;
  const { format, template } = getDailyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const dailyNote = await createDailyNote(date);   // built-in template applied here
    if (settings.templateEngine === "templater" && template) {
      await applyTemplate(window.app, "templater", template, dailyNote);
    }
    const leaf = inNewSplit
      ? workspace.getLeaf("split")
      : workspace.getLeaf(false);
    await leaf.openFile(dailyNote, { active: true });
    cb?.(dailyNote);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File "${filename}" does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  } else {
    await createFile();
  }
}
```

Apply the same pattern to `io/weeklyNotes.ts`.

### 7.3 New `ISettings` field

```ts
export interface ISettings {
  // ... existing fields ...
  templateEngine: "obsidian" | "templater";   // NEW
}

export const defaultSettings: ISettings = {
  // ... existing defaults ...
  templateEngine: "obsidian",
};
```

### 7.4 Settings UI

In `CalendarSettingsTab.display()`, add (only when Templater is detected):

```ts
if (templaterIsAvailable(this.app)) {
  new Setting(containerEl)
    .setName("Template engine")
    .setDesc(
      "Choose which template engine to use when creating new notes. " +
      "Templater templates support dynamic content like dates and prompts."
    )
    .addDropdown((dd) =>
      dd
        .addOption("obsidian", "Obsidian built-in templates")
        .addOption("templater", "Templater plugin")
        .setValue(this.plugin.options.templateEngine)
        .onChange(async (value) =>
          this.plugin.writeOptions(() => ({
            templateEngine: value as "obsidian" | "templater",
          }))
        )
    );
}
```

---

## Stage 8 — Settings Cleanup ✅ DONE (non-UI portions)

### 8.1 Remove

- `appHasPeriodicNotesPluginLoaded()` function from `settings.ts` — ✅ not present
- Settings-tab branch that hides weekly note fields when Periodic Notes is loaded — ⏳ pending (`CalendarSettingsTab` not written yet)
- `periodic-notes:settings-updated` workspace event listener in `view.ts` — ⏳ pending (`view.ts` not written)

### 8.2 Keep

- All weekly note settings (format, template, folder) — ✅ in `ISettings`
- `shouldConfirmBeforeCreate` confirmation dialog — ✅ in `ISettings`
- `calendar:open` workspace event (third-party extensibility) — ⏳ pending (`main.ts`)

### 8.3 Add

- `templateEngine: "obsidian" | "templater"` — ✅ done, default `"obsidian"`

---

## Stage 9 — Known Bug Fixes ✅ DONE (in implemented files)

| Bug | Location | Fix | Status |
|---|---|---|---|
| Bare `workspace.` references (not `this.app.workspace.`) | `view.ts` | Prefix with `this.app.` | ⏳ Pending (`view.ts` not written) |
| `activeFile.setFile(null)` crashes (`getDateUIDFromFile(null)`) | `ui/stores.ts` | Guard: `if (file === null) { store.set(null); return; }` | ✅ Fixed |
| Sources call `getMetadata` with `null` file and crash | All four source files | Each source returns `{ dots: [] }` when `file` is null | ✅ Fixed |
| `PeriodicNotesCache.getEvaluatedMetadata` uncaught source rejection | `ui/fileStore.ts` | Each `source.getMetadata?.()` call wrapped in try/catch | ✅ Fixed |

---

## Stage 10 — Write Svelte Components + main.ts/view.ts ⏳ PENDING

This is the largest remaining block of work. All non-Svelte logic is done; the plugin
cannot be loaded in Obsidian until these files exist.

### 10.1 Files to write

- `src/main.ts` — Plugin class, `onload`/`onunload`, settings load/save, command registration,
  ribbon icon, `CalendarSettingsTab`, `calendar:open` event
- `src/view.ts` — `CalendarView extends ItemView`, `onOpen`/`onClose`, mounts `Calendar.svelte`
- `src/ui/fileMenu.ts` — right-click context menu (`new Menu()`, not `new Menu(app)`)
- `src/ui/sources/index.ts` — exports the four source objects as a list
- `src/ui/Calendar.svelte` — ported from `calendar-ui`, Popper removed, Tooltip wired
- `src/ui/Day.svelte`
- `src/ui/WeekNum.svelte`
- `src/ui/Nav.svelte` — remove `appHasMonthlyNotesPluginLoaded()` branch
- `src/ui/Arrow.svelte`
- `src/ui/Dot.svelte`
- `src/ui/Dots.svelte`
- `src/ui/MetadataResolver.svelte`
- `src/ui/Tooltip.svelte` — new CSS-only tooltip (see Stage 6 spec)
- `styles.css`
- `esbuild.config.mjs`

### 10.2 Svelte 4 migration checklist (apply while writing components)

See Stage 5 table for the full list. Key items:
- `transition:fade|global` modifier on conditionally-mounted elements
- CSS `:global()` scoping — run `svelte-check` and address all warnings
- `svelte-preprocess` version 5 config in `esbuild.config.mjs`

## Stage 11 — Fill in `it.todo` Test Bodies ⏳ PENDING

149 test stubs remain. Priority order:

1. `src/ui/__tests__/stores.test.ts` — 25 todos (stores are fully implemented)
2. `src/ui/__tests__/fileStore.test.ts` — 19 todos
3. `src/io/__tests__/dailyNotes.test.ts` — 20 todos
4. `src/io/__tests__/weeklyNotes.test.ts` — 14 todos
5. `src/ui/sources/__tests__/*.test.ts` — 58 todos across four files
6. `src/ui/__tests__/Tooltip.test.ts` — 8 todos (blocked until `Tooltip.svelte` exists)
7. `src/ui/__tests__/Nav.test.ts` — smoke (blocked until `Nav.svelte` exists)
8. `src/ui/__tests__/Day.test.ts` — smoke (blocked until `Day.svelte` exists)

## Stage 12 — Final Cleanup, Lint, Build, Smoke Test ⏳ PENDING

- Convert any remaining `.js` files to `.ts`
- ESLint: `eslint.config.js` (flat config, ESLint 9)
- Run `svelte-check` and `tsc --noEmit` — zero type errors
- Run `jest` — 0 failures, 0 todos remaining
- Manual build: `node esbuild.config.mjs production` → verify `main.js` is produced
- Smoke test in Obsidian:
  - Enable plugin → calendar sidebar appears
  - Click a day → confirmation dialog → daily note created and opened
  - Click a week number → weekly note created and opened
  - Cmd/Ctrl+click → note opens in a split pane
  - Right-click a note cell → context menu appears with Delete item
  - With Templater installed: toggle template engine in settings, create note, verify
    Templater template is executed

---

## Implementation Order Summary

| Step | Stage | Description | Status |
|---|---|---|---|
| 0 | Stage 0 | Write all unit test stubs (fail-first) | ✅ Done |
| 1 | Stage 1 | Create repo skeleton: `package.json`, `tsconfig.json`, `jest.config.js`, `manifest.json` | ✅ Done |
| 2 | Stage 2 | Merge calendar-ui non-Svelte files into `src/`; fix imports | ✅ Done |
| 3 | Stage 3 | Fix deprecated Obsidian API calls in `io/dailyNotes.ts`, `io/weeklyNotes.ts` | ✅ Done (partial — `view.ts`/`main.ts` pending) |
| 4 | Stage 4 | Migrate all four sources to unified `getMetadata` API | ✅ Done |
| 5 | Stage 5 | Svelte 4 migration | ⏳ Pending (no `.svelte` files yet) |
| 6 | Stage 6 | Write `Tooltip.svelte`; wire into `Calendar.svelte`; remove Popper | ⏳ Pending |
| 7 | Stage 7 | `io/template.ts`; update `dailyNotes.ts` + `weeklyNotes.ts`; settings field | ✅ Done (settings UI pending) |
| 8 | Stage 8 | Settings cleanup (`ISettings`, remove Periodic Notes references) | ✅ Done (settings tab UI pending) |
| 9 | Stage 9 | Fix known bugs (setFile null, source null guard, fileStore try/catch) | ✅ Done |
| 10 | Stage 10 | Write all Svelte components + `main.ts` + `view.ts` + `fileMenu.ts` | ⏳ Pending |
| 11 | Stage 11 | Fill in 149 `it.todo` test bodies | ⏳ Pending |
| 12 | Stage 12 | ESLint, `svelte-check`, `tsc --noEmit`, build, smoke test in Obsidian | ⏳ Pending |

---

## Final Dependency Inventory

### Runtime (bundled into main.js)

| Package | Version |
|---|---|
| `svelte` | `^4.2.0` |
| `obsidian-daily-notes-interface` | `0.9.4` |
| `tslib` | `^2.8.1` |

### Dev / Build

| Package | Version |
|---|---|
| `obsidian` | `obsidianmd/obsidian-api#master` |
| `esbuild` | `^0.27.3` |
| `esbuild-svelte` | `^0.8.0` |
| `svelte-preprocess` | `^5.1.0` |
| `svelte-check` | `^3.8.0` |
| `typescript` | `^5.9.3` |
| `@tsconfig/svelte` | `^5.0.4` |
| `@typescript-eslint/eslint-plugin` | `^8.x` |
| `@typescript-eslint/parser` | `^8.x` |
| `eslint` | `^9.x` |
| `jest` | `^29.x` |
| `ts-jest` | `^29.x` |
| `@types/jest` | `^29.x` |
| `@testing-library/svelte` | `^4.x` |
| `@testing-library/jest-dom` | `^6.x` |
| `@types/moment` | `^2.13.0` |
| `dotenv` | `^16.0.0` |
| `builtin-modules` | `^3.3.0` |
| `standard-version` | `^9.x` |

**Removed entirely:** `@popperjs/core`, `@popperjs/svelte`, `svelte-portal`,
`obsidian-calendar-ui`, all `@rollup/*`, `rollup`, `rollup-plugin-svelte`, `svelte-jester`.
