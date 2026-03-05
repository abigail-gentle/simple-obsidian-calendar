# simple-obsidian-calendar

A community fork of [liamcain/obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin), consolidated into a single repository and updated for modern Obsidian.

---

## What this plugin does

Adds a calendar panel to Obsidian's sidebar. Each day cell and week-number cell represents a daily or weekly note. Clicking a cell opens the note if it exists, or creates it if it does not. Cells are decorated with dots and CSS classes derived from note content (word count, open tasks, streaks, custom tags). A CSS-only tooltip shows metadata on hover.

---

## Goals of this fork

- **Single repository** — the original plugin was split across three repos (`obsidian-calendar-plugin`, `obsidian-calendar-ui`, `obsidian-periodic-notes`); this fork merges the first two and drops the third
- **Modern Obsidian API** — all deprecated calls replaced (`getUnpinnedLeaf`, `splitActiveLeaf`, `layout-ready` event, `new Menu(app)`, etc.); `minAppVersion` raised to `1.0.0`
- **Svelte 4** — migrated from Svelte 3
- **Updated build tooling** — esbuild replaces Rollup; TypeScript 5.9; latest `obsidian-daily-notes-interface`
- **Templater support** — when the [Templater](https://github.com/SilentVoid13/Templater) plugin is installed, note creation can use Templater templates; the template engine is user-selectable in settings
- **CSS-only tooltip** — the `@popperjs/svelte` hover popover replaced with a lightweight, dependency-free CSS tooltip
- **All four decoration sources preserved** — word count dots, streak classes, task dots, custom tag attributes

---

## Repository structure

```
simple-obsidian-calendar/
├── docs/
│   └── plan.md              ← full implementation plan and porting reference
├── src/
│   ├── global.d.ts          ← Window augmentation (app, moment, _bundledLocaleWeekSpec)
│   ├── types.ts             ← IDot, ICalendarSource, IEvaluatedMetadata, IWeek, IMonth, ...
│   ├── constants.ts         ← VIEW_TYPE_CALENDAR, DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT
│   ├── localization.ts      ← configureGlobalMomentLocale, overrideGlobalMomentWeekStart
│   ├── settings.ts          ← ISettings, defaultSettings
│   ├── io/
│   │   ├── template.ts      ← templaterIsAvailable, applyTemplate
│   │   ├── dailyNotes.ts    ← tryToCreateDailyNote
│   │   └── weeklyNotes.ts   ← tryToCreateWeeklyNote
│   ├── ui/
│   │   ├── context.ts       ← IS_MOBILE, DISPLAYED_MONTH symbols
│   │   ├── fileMenu.ts      ← showFileMenu (right-click context menu)
│   │   ├── fileStore.ts     ← PeriodicNotesCache
│   │   ├── modal.ts         ← ConfirmationModal, createConfirmationDialog
│   │   ├── stores.ts        ← dailyNotes, weeklyNotes, activeFile, settings
│   │   ├── utils.ts         ← classList, clamp, partition, getWordCount, getMonth, ...
│   │   ├── Calendar.svelte  ← root component (tooltip, heartbeat, context setup)
│   │   ├── Nav.svelte       ← month navigation header
│   │   ├── Month.svelte     ← month/year title (click resets to today)
│   │   ├── Day.svelte       ← individual day cell
│   │   ├── WeekNum.svelte   ← week number cell
│   │   ├── Arrow.svelte     ← prev/next chevron button
│   │   ├── Dot.svelte       ← single SVG dot
│   │   ├── Dots.svelte      ← dot row for a cell
│   │   ├── MetadataResolver.svelte  ← async slot wrapper for metadata promises
│   │   ├── Tooltip.svelte   ← CSS-only hover tooltip
│   │   └── sources/
│   │       ├── index.ts     ← re-exports all four sources
│   │       ├── wordCount.ts ← solid dots proportional to word count
│   │       ├── tasks.ts     ← hollow dot for days with unchecked tasks
│   │       ├── tags.ts      ← data-tags / data-emoji-tag attributes from frontmatter
│   │       └── streak.ts    ← has-note CSS class
│   ├── main.ts              ← CalendarPlugin (plugin entry point)
│   └── view.ts              ← CalendarView (ItemView)
├── styles.css               ← settings banner CSS (component CSS is scoped in .svelte files)
├── esbuild.config.mjs       ← build config
├── manifest.json
├── versions.json
├── tsconfig.json
└── package.json
```

---

## Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Development build (watch mode)

Create a `.env` file at the repo root pointing to a local Obsidian vault:

```
TEST_VAULT=/path/to/your/obsidian/vault
```

Then run:

```bash
npm run dev
```

Built files are written directly to `$TEST_VAULT/.obsidian/plugins/calendar/`. Enable
the plugin in Obsidian's community plugin settings.

### Production build

```bash
npm run build
```

Produces a minified `main.js` and copies `styles.css` to the output directory.

### Typecheck and lint

```bash
npm run lint   # runs svelte-check, eslint, and tsc --noEmit
```

---

## Implementation plan

See [`docs/plan.md`](docs/plan.md) for the full staged implementation plan, porting
reference, and risk register.

---

## Dependencies

### Runtime (bundled into `main.js`)

| Package | Version |
|---|---|
| `svelte` | 4.2.20 |
| `obsidian-daily-notes-interface` | 0.9.4 |
| `tslib` | 2.8.1 |

### Removed from the original three-repo system

`@popperjs/core`, `@popperjs/svelte`, `svelte-portal`, `obsidian-calendar-ui`,
`rollup`, `rollup-plugin-svelte`, all `@rollup/*` packages.

---

## Credits

Original plugin by [Liam Cain](https://github.com/liamcain). MIT licensed.
