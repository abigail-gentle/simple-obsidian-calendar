# Unit Test Philosophy & Specification

All tests in Stage 0 are written **before** any implementation. Every test listed here
must fail on an empty codebase and pass after the corresponding implementation stage is
complete. This is the contract between the test suite and the implementation.

---

## 1. Philosophy & Principles

### 1.1 Test behaviour, not implementation

A test should describe **what** a function does from the caller's perspective, not **how**
it does it internally. If you can refactor a function's internals without touching any
test, the tests are written correctly.

```ts
// BAD — tests implementation detail (uses regex internally)
expect(text.match(/[^\s]+/gu)?.length).toBe(3);

// GOOD — tests observable behaviour
expect(getWordCount("one two three")).toBe(3);
```

### 1.2 Arrange — Act — Assert

Every test follows a strict three-section structure with a blank line separating each
section. This makes the intent of each test scannable without reading the implementation.

```ts
it("opens the note in a split pane when inNewSplit is true", async () => {
  // Arrange
  const mockLeaf = { openFile: jest.fn() };
  mockWorkspace.getLeaf.mockReturnValue(mockLeaf);
  const date = moment("2024-01-15");

  // Act
  await tryToCreateDailyNote(date, /* inNewSplit */ true, noConfirmSettings);

  // Assert
  expect(mockWorkspace.getLeaf).toHaveBeenCalledWith("split");
  expect(mockLeaf.openFile).toHaveBeenCalledTimes(1);
});
```

### 1.3 Mock at the boundary, not the interior

We mock the **Obsidian API**, the **obsidian-daily-notes-interface** library, and
`window.app` / `window.moment`. We do **not** mock our own internal functions — if a
function is hard to test without mocking its own helpers, that is a signal to refactor.

The only exception is `createConfirmationDialog` in IO tests, because it opens a real
modal in Obsidian's DOM which is unavailable in Jest.

### 1.4 Isolation and repeatability

- Reset all mocks in `beforeEach` (configured globally in `jest.config.js`)
- Reset moment's global locale in `afterEach` in any test that calls
  `configureGlobalMomentLocale`
- Never share mutable state between tests (each test gets a fresh store via the factory
  functions)
- Tests must pass in any order and in any subset

### 1.5 Tests as documentation

Test names are written in plain English as complete sentences. Reading the list of test
names for a module should give a developer an accurate mental model of that module's
behaviour without reading the source.

```ts
describe("templaterIsAvailable", () => {
  it("returns true when the templater-obsidian plugin is present in the plugin registry");
  it("returns false when the plugin registry has no entry for templater-obsidian");
  it("returns false when the plugins object itself is missing");
});
```

### 1.6 Coverage targets

| Category | Target | Rationale |
|---|---|---|
| Pure functions | 100 % branch | Zero mocking overhead; high ROI |
| IO functions | 100 % branch | These contain the most user-visible bugs |
| Store state transitions | 100 % branch | State bugs are silent and hard to debug |
| `ICalendarSource` implementations | 100 % branch | Null-safety gaps cause runtime crashes |
| `PeriodicNotesCache` | Key methods only | Constructor registers vault events — test `initialize`, `getFile`, `getEvaluatedMetadata` |
| Svelte components | Smoke tests only | Rendering tests are brittle; behaviour tested via unit tests of the logic they call |

### 1.7 What we deliberately do not test

- **Obsidian plugin lifecycle** (`onload`, `onunload`, `initLeaf`): depends on
  `WorkspaceLeaf` internals that cannot be meaningfully faked
- **Full Svelte rendering pipelines** beyond smoke tests: the rendering depends on DOM
  APIs (`ResizeObserver`, etc.) that are not present in jsdom
- **Actual disk I/O**: vault operations are mocked at the `vault.*` call sites
- **End-to-end Templater execution**: we verify the correct Templater method is called
  with the correct arguments; we do not execute Templater itself

---

## 2. Tools & Configuration

### 2.1 jest.config.js

```js
/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/src/__setup__/jest.setup.ts"],
  moduleNameMapper: {
    // Path alias matching tsconfig
    "^src/(.*)$": "<rootDir>/src/$1",
    // Block .svelte imports in unit tests (mocked individually if needed)
    "\\.svelte$": "<rootDir>/src/__mocks__/svelte-component.ts",
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  testMatch: ["**/__tests__/**/*.test.ts"],
};
```

### 2.2 jest.setup.ts

```ts
// src/__setup__/jest.setup.ts
import moment from "moment";
import "@testing-library/jest-dom";

// Make window.moment available (Obsidian injects this globally)
(global as any).window = global;
(global as any).window.moment = moment;

// Default mock for window.app — overridden per test as needed
(global as any).window.app = {
  vault: {
    cachedRead: jest.fn(),
    getAbstractFileByPath: jest.fn(),
    on: jest.fn(),
  },
  workspace: {
    getLeaf: jest.fn(),
    setActiveLeaf: jest.fn(),
    onLayoutReady: jest.fn(),
    trigger: jest.fn(),
    on: jest.fn(),
  },
  metadataCache: {
    getFileCache: jest.fn(),
    on: jest.fn(),
  },
  plugins: {
    plugins: {},
  },
  internalPlugins: {
    plugins: {
      "daily-notes": { enabled: true, instance: { options: { format: "YYYY-MM-DD", folder: "", template: "" } } },
    },
  },
};
```

---

## 3. Mock Strategy

### 3.1 `src/__mocks__/obsidian.ts`

The entire `obsidian` module is auto-mocked. Key classes need minimal manual
implementations:

```ts
// src/__mocks__/obsidian.ts

export class Plugin {}
export class ItemView { contentEl = document.createElement("div"); }
export class WorkspaceLeaf {}
export class TFile {
  constructor(public path: string, public name: string = path) {}
  stat = { ctime: 0, mtime: 0, size: 0 };
  extension = "md";
  basename = this.name.replace(/\.md$/, "");
  parent = null;
}
export class Modal {
  constructor(public app: any) {}
  open = jest.fn();
  close = jest.fn();
  contentEl = document.createElement("div");
  titleEl = document.createElement("div");
}
export class Setting {
  constructor(containerEl: HTMLElement) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
  addButton = jest.fn().mockReturnThis();
}
export class PluginSettingTab {
  constructor(public app: any, public plugin: any) {}
  containerEl = document.createElement("div");
}
export class Menu {
  addItem = jest.fn().mockImplementation((cb) => { cb(new MenuItem()); return this; });
  showAtPosition = jest.fn();
}
export class MenuItem {
  setTitle = jest.fn().mockReturnThis();
  setIcon = jest.fn().mockReturnThis();
  onClick = jest.fn().mockReturnThis();
}
export const normalizePath = (p: string) => p.replace(/\\/g, "/");
```

### 3.2 `src/__mocks__/obsidian-daily-notes-interface.ts`

```ts
// src/__mocks__/obsidian-daily-notes-interface.ts
import { TFile } from "obsidian";

export const getDailyNoteSettings = jest.fn().mockReturnValue({
  format: "YYYY-MM-DD",
  folder: "",
  template: "",
});
export const getWeeklyNoteSettings = jest.fn().mockReturnValue({
  format: "gggg-[W]ww",
  folder: "",
  template: "",
});
export const createDailyNote = jest.fn().mockResolvedValue(
  new TFile("2024-01-15.md", "2024-01-15")
);
export const createWeeklyNote = jest.fn().mockResolvedValue(
  new TFile("2024-W03.md", "2024-W03")
);
export const getDailyNote = jest.fn().mockReturnValue(null);
export const getWeeklyNote = jest.fn().mockReturnValue(null);
export const getAllDailyNotes = jest.fn().mockReturnValue({});
export const getAllWeeklyNotes = jest.fn().mockReturnValue({});
export const getAllMonthlyNotes = jest.fn().mockReturnValue({});
export const getDateUID = jest.fn().mockImplementation(
  (date: any, granularity: string) => `${granularity}-${date.format("YYYY-MM-DD")}`
);
export const getDateFromFile = jest.fn().mockReturnValue(null);
export const appHasDailyNotesPluginLoaded = jest.fn().mockReturnValue(true);
export const appHasWeeklyNotesPluginLoaded = jest.fn().mockReturnValue(false);
export const appHasMonthlyNotesPluginLoaded = jest.fn().mockReturnValue(false);
```

### 3.3 `src/__mocks__/svelte-component.ts`

A stub for `.svelte` files imported by unit tests:

```ts
// src/__mocks__/svelte-component.ts
export default class SvelteComponentStub {
  constructor(_options: any) {}
  $destroy = jest.fn();
  $set = jest.fn();
  $on = jest.fn();
}
```

---

## 4. Coverage Map

| Module | Tested? | Test file |
|---|---|---|
| `src/ui/utils.ts` | Full | `src/ui/__tests__/utils.test.ts` |
| `src/localization.ts` | Full | `src/__tests__/localization.test.ts` |
| `src/ui/context.ts` | Smoke | `src/ui/__tests__/context.test.ts` |
| `src/io/template.ts` | Full | `src/io/__tests__/template.test.ts` |
| `src/io/dailyNotes.ts` | Full | `src/io/__tests__/dailyNotes.test.ts` |
| `src/io/weeklyNotes.ts` | Full | `src/io/__tests__/weeklyNotes.test.ts` |
| `src/ui/stores.ts` | Full | `src/ui/__tests__/stores.test.ts` |
| `src/ui/sources/wordCount.ts` | Full | `src/ui/sources/__tests__/wordCount.test.ts` |
| `src/ui/sources/tasks.ts` | Full | `src/ui/sources/__tests__/tasks.test.ts` |
| `src/ui/sources/tags.ts` | Full | `src/ui/sources/__tests__/tags.test.ts` |
| `src/ui/sources/streak.ts` | Full | `src/ui/sources/__tests__/streak.test.ts` |
| `src/ui/fileStore.ts` | Key methods | `src/ui/__tests__/fileStore.test.ts` |
| `src/settings.ts` | `defaultSettings` shape + `templaterIsAvailable` | `src/__tests__/settings.test.ts` |
| `src/ui/Calendar.svelte` | Smoke (renders) | `src/ui/__tests__/Calendar.test.ts` |
| `src/ui/Day.svelte` | Key interactions | `src/ui/__tests__/Day.test.ts` |
| `src/ui/Nav.svelte` | Month navigation | `src/ui/__tests__/Nav.test.ts` |
| `src/ui/Tooltip.svelte` | Visibility logic | `src/ui/__tests__/Tooltip.test.ts` |
| `src/main.ts` | Not tested | Plugin lifecycle requires Obsidian host |
| `src/view.ts` | Not tested | ItemView requires Obsidian host |
| `src/ui/fileMenu.ts` | Not tested | Menu requires Obsidian DOM |
| `src/ui/modal.ts` | Not tested | Modal requires Obsidian DOM |

---

## 5. Test Specifications

Each section below is a complete specification for one test file. Implementations must
match these specifications exactly, including test names (which are the public contract).

---

### 5.1 `src/ui/__tests__/utils.test.ts`

```
describe("getWordCount")
  it("returns 0 for an empty string")
  it("returns 0 for a whitespace-only string")
  it("returns 1 for a single word with no whitespace")
  it("counts words separated by spaces")
  it("counts words separated by newlines")
  it("counts words separated by tabs")
  it("handles mixed whitespace (space, tab, newline) as delimiters")
  it("treats punctuation attached to a word as part of the word")
  it("counts CJK characters separated by spaces as individual words")

describe("classList")
  it("returns an empty string for an empty object")
  it("returns a single class name for a single truthy entry")
  it("omits keys whose values are falsy")
  it("includes all keys whose values are truthy")
  it("returns class names separated by spaces")

describe("clamp")
  it("returns the value unchanged when within [min, max]")
  it("returns min when the value is below min")
  it("returns max when the value is above max")
  it("returns min when value equals min (inclusive boundary)")
  it("returns max when value equals max (inclusive boundary)")

describe("partition")
  it("returns two empty arrays for an empty input")
  it("puts all elements in the first array when all match the predicate")
  it("puts all elements in the second array when none match the predicate")
  it("correctly separates mixed elements")
  it("does not modify the original array")

describe("getDateUIDFromFile")
  it("returns null for a null input")
  it("returns the day UID for a file whose name matches the daily note format")
  it("returns the week UID for a file whose name matches the weekly note format")
  it("returns null for a file whose name matches neither format")

describe("isMetaPressed")
  it("returns true on macOS when metaKey is pressed")
  it("returns false on macOS when only ctrlKey is pressed")
  it("returns true on non-macOS when ctrlKey is pressed")
  it("returns false on non-macOS when only metaKey is pressed")

describe("isWeekend")
  it("returns true for Saturday (isoWeekday 6)")
  it("returns true for Sunday (isoWeekday 7)")
  it("returns false for Monday (isoWeekday 1)")
  it("returns false for Friday (isoWeekday 5)")

describe("getDaysOfWeek")
  it("returns exactly 7 strings")
  it("returns non-empty strings")

describe("getMonth")
  it("returns exactly 6 weeks")
  it("each week contains exactly 7 days")
  it("each day is a Moment object")
  it("all 7 days of a given week are consecutive")
  it("weeks are in ascending chronological order")
  it("the displayed month appears in the middle weeks")
  it("includes days from the previous month to fill the first week")
  it("includes days from the next month to fill the last week")

  describe("with Monday as week start (locale: en-gb)")
    it("starts the grid on Monday 2024-01-01 for January 2024")
    it("ends the grid on Sunday 2024-02-11 for January 2024")

  describe("with Sunday as week start (locale: en)")
    it("starts the grid on Sunday 2023-12-31 for January 2024")

  describe("February 2024 (leap year)")
    it("includes 29 days for February when it is a leap year")
```

---

### 5.2 `src/__tests__/localization.test.ts`

```
describe("configureGlobalMomentLocale")
  beforeEach: save moment.locale()
  afterEach: restore moment.locale() and locale data

  it("returns a string in all cases")
  it("does not throw for any valid ILocaleOverride value")

  describe("with localeOverride = 'system-default'")
    it("reads the Obsidian language setting from window.app.vault.getConfig('language')")
    it("falls back to navigator.language when vault config returns an empty string")

  describe("with an explicit locale string")
    it("sets the moment locale to the specified value")
    it("returns the locale string that was applied")

  describe("week start override")
    it("sets week start to 0 (Sunday) when weekStart is 'sunday'")
    it("sets week start to 1 (Monday) when weekStart is 'monday'")
    it("sets week start to 2 (Tuesday) when weekStart is 'tuesday'")
    it("sets week start to 6 (Saturday) when weekStart is 'saturday'")
    it("does not override the week start when weekStart is 'locale'")

  describe("idempotency")
    it("produces the same result when called twice with the same arguments")
```

---

### 5.3 `src/ui/__tests__/context.test.ts`

```
describe("context symbols")
  it("IS_MOBILE is a Symbol")
  it("DISPLAYED_MONTH is a Symbol")
  it("IS_MOBILE and DISPLAYED_MONTH are distinct symbols")
```

---

### 5.4 `src/io/__tests__/template.test.ts`

```
describe("templaterIsAvailable")
  it("returns true when app.plugins.plugins['templater-obsidian'] is an object")
  it("returns false when 'templater-obsidian' is absent from the plugin registry")
  it("returns false when app.plugins.plugins is an empty object")
  it("returns false when app.plugins is undefined")
  it("returns false when app is missing the plugins property entirely")

describe("applyTemplate")
  describe("when engine is 'obsidian'")
    it("returns without calling any Templater method")
    it("does not throw even if Templater is not installed")

  describe("when engine is 'templater' and Templater is available")
    it("calls write_template_to_file with the template TFile and the target TFile")
    it("resolves the template path via app.vault.getAbstractFileByPath")

    describe("when the template file does not exist in the vault")
      it("does not call write_template_to_file")
      it("logs a warning to the console")
      it("does not throw")

    describe("when templatePath is an empty string")
      it("does not call write_template_to_file")
      it("does not throw")

  describe("when engine is 'templater' but Templater is NOT available")
    it("does not call write_template_to_file")
    it("does not throw")
```

---

### 5.5 `src/io/__tests__/dailyNotes.test.ts`

```
describe("tryToCreateDailyNote")

  describe("when shouldConfirmBeforeCreate is false")
    it("calls createDailyNote with the provided date")
    it("does not show a confirmation dialog")

    describe("inNewSplit = false")
      it("opens the file in a non-splitting leaf via workspace.getLeaf(false)")
      it("passes { active: true } to leaf.openFile")

    describe("inNewSplit = true")
      it("opens the file in a split leaf via workspace.getLeaf('split')")

    it("calls the callback with the newly created TFile")
    it("calls the callback after the file is opened")

    describe("template engine = 'obsidian'")
      it("does NOT call applyTemplate with 'templater'")

    describe("template engine = 'templater' and a template is configured")
      it("calls applyTemplate with engine='templater', the template path, and the created file")
      it("calls applyTemplate after createDailyNote returns the file")

    describe("template engine = 'templater' but template path is empty string")
      it("does not call applyTemplate")

  describe("when shouldConfirmBeforeCreate is true")
    it("calls createConfirmationDialog instead of creating the note immediately")
    it("passes title 'New Daily Note' to the dialog")
    it("includes the formatted filename in the dialog text")
    it("passes a CTA of 'Create' to the dialog")
    it("does not call createDailyNote before the dialog is accepted")

    describe("when the dialog onAccept callback is invoked")
      it("then calls createDailyNote")
      it("then opens the file")
      it("then calls the callback")

  describe("error propagation")
    it("propagates an error thrown by createDailyNote to the caller")
```

---

### 5.6 `src/io/__tests__/weeklyNotes.test.ts`

```
describe("tryToCreateWeeklyNote")

  describe("when shouldConfirmBeforeCreate is false")
    it("calls createWeeklyNote with the provided date")
    it("does not show a confirmation dialog")

    describe("inNewSplit = false")
      it("opens the file in a non-splitting leaf via workspace.getLeaf(false)")

    describe("inNewSplit = true")
      it("opens the file in a split leaf via workspace.getLeaf('split')")

    it("calls the callback with the newly created TFile")

    describe("template engine = 'templater' and a template is configured")
      it("calls applyTemplate with engine='templater', the template path, and the created file")

  describe("when shouldConfirmBeforeCreate is true")
    it("calls createConfirmationDialog instead of creating the note immediately")
    it("passes title 'New Weekly Note' to the dialog")
    it("includes the formatted week filename in the dialog text")

  describe("error propagation")
    it("propagates an error thrown by createWeeklyNote to the caller")
```

---

### 5.7 `src/ui/__tests__/stores.test.ts`

```
describe("dailyNotes store")
  it("has an initial value of null")

  describe("reindex()")
    it("sets the store value to the result of getAllDailyNotes()")
    it("calls getAllDailyNotes exactly once per reindex() call")

    describe("when getAllDailyNotes() throws")
      it("sets the store value to an empty object {}")
      it("does not rethrow the error")
      it("logs the error to the console on the first failure")
      it("does not log the error again on subsequent failures until a success resets the flag")

describe("weeklyNotes store")
  it("has an initial value of null")

  describe("reindex()")
    it("sets the store value to the result of getAllWeeklyNotes()")

    describe("when getAllWeeklyNotes() throws")
      it("sets the store value to an empty object {}")
      it("does not rethrow the error")

describe("activeFile store")
  it("has an initial value of null")

  describe("setFile(file)")
    it("sets the store to the UID returned by getDateUIDFromFile(file)")

  describe("setFile(null)")
    it("sets the store to null")
    it("does not throw or call getDateUIDFromFile with null")

describe("settings store")
  it("is initialized with the defaultSettings values")
  it("has the correct default for shouldConfirmBeforeCreate (true)")
  it("has the correct default for showWeeklyNote (false)")
  it("has the correct default for wordsPerDot (250)")
  it("has the correct default for weekStart ('locale')")
  it("has the correct default for localeOverride ('system-default')")
  it("has the correct default for templateEngine ('obsidian')")
  it("has the correct default for weeklyNoteFormat ('')")
  it("has the correct default for weeklyNoteTemplate ('')")
  it("has the correct default for weeklyNoteFolder ('')")
```

---

### 5.8 `src/ui/sources/__tests__/wordCount.test.ts`

```
describe("wordCountSource")
  it("has id 'word-count'")
  it("has defaultSettings with display 'calendar-and-menu'")

  describe("getMetadata('day', date, null)")
    it("returns { dots: [] } without reading from the vault")

  describe("getMetadata('day', date, file)")
    it("reads the file content via app.vault.cachedRead")
    it("returns value = 0 and dots = [] when the file is empty")
    it("returns value = 0 and dots = [] when word count is below wordsPerDot (249 words, default 250/dot)")
    it("returns 1 dot and value = 250 when word count equals wordsPerDot")
    it("returns 2 dots for 500 words")
    it("returns 5 dots for 1250 words (the maximum)")
    it("returns 5 dots (capped) for 2000 words")
    it("all returned dots have isFilled = true")

  describe("getMetadata('week', date, file)")
    it("behaves identically to the 'day' case (unified API)")

  describe("wordsPerDot setting")
    it("uses the current value of the settings store for wordsPerDot")
    it("recalculates dot count when wordsPerDot changes")
```

---

### 5.9 `src/ui/sources/__tests__/tasks.test.ts`

```
describe("tasksSource")
  it("has id 'tasks'")
  it("has defaultSettings with display 'calendar-and-menu'")

  describe("getMetadata('day', date, null)")
    it("returns { dots: [] } without reading from the vault")

  describe("getMetadata('day', date, file) — file has no tasks")
    it("returns { dots: [] }")

  describe("getMetadata with unchecked tasks")
    it("returns one unfilled dot for a file containing '- [ ] a task'")
    it("returns one unfilled dot for a file containing '* [ ] a task'")
    it("treats multiple unchecked tasks as still one unfilled dot")

  describe("getMetadata with checked tasks")
    it("returns one filled dot for a file where all tasks are checked")

  describe("getMetadata with mixed tasks")
    it("returns one unfilled dot when at least one task is unchecked")

  describe("getMetadata('week', date, file)")
    it("behaves identically to the 'day' case")
```

---

### 5.10 `src/ui/sources/__tests__/tags.test.ts`

```
describe("customTagsSource")
  it("has id 'tags'")
  it("has defaultSettings with display 'calendar-and-menu'")

  describe("getMetadata('day', date, null)")
    it("returns { dots: [], dataAttributes: {} } without accessing metadataCache")

  describe("getMetadata with a file that has no frontmatter")
    it("returns empty dataAttributes")

  describe("getMetadata with a file that has no tags in frontmatter")
    it("returns empty dataAttributes")

  describe("getMetadata with a file that has text tags")
    it("sets a non-empty data-tags attribute")
    it("includes each tag in the attribute value")

  describe("getMetadata with a file that has emoji tags")
    it("separates emoji tags into a data-emoji-tag attribute")
    it("does not include emoji tags in the data-tags attribute")

  describe("getMetadata with a file that has both text and emoji tags")
    it("puts emoji tags in data-emoji-tag and text tags in data-tags")

  describe("when metadataCache.getFileCache returns null")
    it("returns empty dataAttributes without throwing")

  describe("getMetadata('week', date, file)")
    it("behaves identically to the 'day' case")
```

---

### 5.11 `src/ui/sources/__tests__/streak.test.ts`

```
describe("streakSource")
  it("has id 'streak'")
  it("has defaultSettings with display 'calendar-and-menu'")

  describe("getMetadata('day', date, null)")
    it("returns no streak-related CSS classes")
    it("returns dots: []")

  describe("getMetadata('day', date, file) — isolated day (no neighbours exist)")
    it("returns an 'active' class or equivalent indicating a single-day entry")

  describe("getMetadata — consecutive days")
    it("adds a 'streak-start' or equivalent class when today has a note but yesterday does not")
    it("adds a 'streak-end' or equivalent class when today has a note but tomorrow does not")
    it("adds a 'streak-middle' or equivalent class when both yesterday and tomorrow have notes")

  describe("getMetadata('week', date, file)")
    it("returns dots: [] regardless of file existence")
    it("does not throw when file is null")

  describe("getStreakClasses (internal helper, if exported)")
    it("returns an empty array for a null file")
    it("returns classes for an existing file")
```

---

### 5.12 `src/ui/__tests__/fileStore.test.ts`

```
describe("PeriodicNotesCache")

  describe("initialize()")
    it("populates the store with all daily notes from getAllDailyNotes()")
    it("merges in all weekly notes from getAllWeeklyNotes()")
    it("merges in all monthly notes from getAllMonthlyNotes()")
    it("the store value is an object keyed by dateUID strings")

  describe("getFile(date, granularity)")
    it("returns the TFile when the corresponding dateUID is in the store")
    it("returns null when the dateUID is not in the store")
    it("returns null when the store is empty")

  describe("getEvaluatedMetadata(granularity, date, getSourceSettings)")
    it("returns an empty array when sources is empty")

    describe("with one source that implements getMetadata")
      it("calls source.getMetadata with granularity, date, and the resolved file")
      it("merges the source's resolved metadata into the result")
      it("merges the sourceSettings from getSourceSettings(source.id) into the result")
      it("includes the source's id, name, and description in the result item")

    describe("with one source that does NOT implement getMetadata")
      it("returns a result item with empty metadata for that source")
      it("does not throw")

    describe("when a source's getMetadata throws")
      it("catches the error without rethrowing")
      it("logs a warning to the console")
      it("continues processing remaining sources")

    describe("with multiple sources")
      it("returns one result item per source")
      it("preserves source order")
```

---

### 5.13 `src/__tests__/settings.test.ts`

```
describe("defaultSettings")
  it("includes all required ISettings keys")
  it("shouldConfirmBeforeCreate defaults to true")
  it("showWeeklyNote defaults to false")
  it("wordsPerDot defaults to 250")
  it("weekStart defaults to 'locale'")
  it("localeOverride defaults to 'system-default'")
  it("templateEngine defaults to 'obsidian'")
  it("weeklyNoteFormat defaults to empty string")
  it("weeklyNoteTemplate defaults to empty string")
  it("weeklyNoteFolder defaults to empty string")

describe("templaterIsAvailable (re-exported from io/template)")
  it("returns false when called with the default mock app (no Templater)")
  it("returns true when the mock app has a 'templater-obsidian' plugin entry")
```

---

### 5.14 Svelte component smoke tests

These tests use `@testing-library/svelte` and only verify basic DOM output. They do not
test event wiring (which is covered by the unit tests above).

**`src/ui/__tests__/Tooltip.test.ts`**

```
describe("Tooltip")
  it("is not rendered when visible is false")
  it("is not rendered when visible is true but metadata is null")
  it("is not rendered when visible is true but all metadata items have null values")
  it("renders when visible is true and at least one item has a non-null value")
  it("renders the source name for each visible metadata item")
  it("renders the value for each visible metadata item")
  it("applies inline left/top styles matching the x/y props")
```

**`src/ui/__tests__/Nav.test.ts`**

```
describe("Nav")
  it("renders a previous-month button")
  it("renders a next-month button")
  it("clicking the next button updates the displayed month context forward by one month")
  it("clicking the prev button updates the displayed month context back by one month")
  it("renders the current month and year as text")
```

**`src/ui/__tests__/Day.test.ts`**

```
describe("Day")
  it("renders the day number as text content")
  it("adds the 'today' CSS class when the date is today")
  it("does not add the 'today' class for a past date")
  it("adds the 'has-note' CSS class when a file is provided")
  it("does not add the 'has-note' class when file is null")
  it("adds the 'active' CSS class when selectedId matches the day's dateUID")
  it("calls the onClick handler when clicked")
  it("passes the correct granularity ('day'), date, file, and inNewSplit to onClick")
  it("calls the onContextMenu handler on right-click")
```

---

## 6. Running Tests

```bash
# Run all tests once
npm test

# Watch mode during development
npm run test:watch

# Verify all tests FAIL before implementation (Stage 0 gate)
npm test -- --passWithNoTests=false 2>&1 | grep -E "FAIL|PASS"
# Expected output: all suites should show FAIL
```

The CI gate for Stage 0 completion is that the test suite exists, all tests are
syntactically valid TypeScript, and all tests fail with "not yet implemented" errors
(not syntax or import errors).
