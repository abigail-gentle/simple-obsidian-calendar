// CalendarView — the ItemView that hosts the Calendar Svelte component.
//
// Ported from obsidian-calendar-plugin/src/view.ts with these changes:
//   CHANGED: workspace.splitActiveLeaf() → workspace.getLeaf("split")  (deprecated)
//   CHANGED: workspace.getUnpinnedLeaf() → workspace.getLeaf(false)    (deprecated)
//   CHANGED: workspace.setActiveLeaf(leaf, true, true) →
//            workspace.setActiveLeaf(leaf, { focus: true })             (deprecated)
//   CHANGED: bare workspace.* references → this.app.workspace.*        (bug fix)
//   CHANGED: Calendar.svelte props use unified event-handler API
//            (onClick/onHover/onContextMenu all dispatched via granularity parameter)
//            replaces the old per-granularity onClickDay/onClickWeek/onHoverDay/… props
//   CHANGED: showFileMenu() no longer takes `app` as first argument (see fileMenu.ts)
//   CHANGED: getSourceSettings() provides a fallback ISourceSettings for every source
//            (uses each source's own defaultSettings as the runtime value)
//   CHANGED: vault.on types cast through `any` — the obsidian-api typings only declare
//            "rename" for Vault.on; cast is safe and matches runtime behaviour
//   CHANGED: store .get() calls guard against the initial null state of the stores

import type { Moment } from "moment";
import {
  getDailyNote,
  getDailyNoteSettings,
  getDateFromFile,
  getWeeklyNote,
  getWeeklyNoteSettings,
} from "src/periodicNotes";
import type { IGranularity } from "src/periodicNotes";
import { FileView, ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import type { ISettings } from "src/settings";
import type { ISourceSettings } from "src/types";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import { activeFile, dailyNotes, settings, weeklyNotes } from "./ui/stores";
import {
  customTagsSource,
  streakSource,
  tasksSource,
  wordCountSource,
} from "./ui/sources";

export default class CalendarView extends ItemView {
  // The Calendar Svelte component instance. Defined on onOpen; may be undefined
  // before the view is opened or after it is closed.
  private calendar: Calendar | undefined;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    // Bind all handlers so they can be detached cleanly and used as callbacks.
    this.handleClick = this.handleClick.bind(this);
    this.handleHover = this.handleHover.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    this.onNoteSettingsUpdate = this.onNoteSettingsUpdate.bind(this);
    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);
    this.onFileModified = this.onFileModified.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);

    // Keep the daily/weekly note stores current with vault changes.
    // CHANGED: cast through `any` — the obsidian-api typings only declare "rename"
    // for Vault.on, but the vault emits create/delete/modify at runtime.
    this.registerEvent((this.app.vault as any).on("create", this.onFileCreated));
    this.registerEvent((this.app.vault as any).on("delete", this.onFileDeleted));
    this.registerEvent((this.app.vault as any).on("modify", this.onFileModified));
    this.registerEvent(
      (this.app.workspace as any).on("file-open", this.onFileOpen)
    );

    // Initialise settings from the store default; the subscription keeps it current.
    this.settings = get(settings);
    settings.subscribe((val) => {
      this.settings = val;
    });
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return "Calendar";
  }

  getIcon(): string {
    return "calendar-with-checkmark";
  }

  onClose(): Promise<void> {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  async onOpen(): Promise<void> {
    // Seed the four built-in sources; external plugins may push additional sources
    // via the calendar:open workspace event before the component mounts.
    const sources = [
      customTagsSource,
      streakSource,
      wordCountSource,
      tasksSource,
    ];
    this.app.workspace.trigger(TRIGGER_ON_OPEN, sources);

    // Seed the stores so the calendar doesn't open with empty note lists.
    dailyNotes.reindex();
    weeklyNotes.reindex();

    this.calendar = new Calendar({
      target: (this as any).contentEl,
      props: {
        // Calendar.svelte expects a Plugin instance for NoteCache.
        // ItemView does not extend Plugin, but this.app is the Obsidian App.
        // We pass `this` (the ItemView) — NoteCache only uses
        // plugin.app and plugin.registerEvent(), both of which ItemView has.
        plugin: this as any,
        showWeekNums: get(settings).showWeeklyNote,
        sources,
        today: window.moment(),
        localeData: window.moment().localeData(),
        // Unified event handlers — granularity is the first argument so a single
        // function handles both "day" and "week" interactions.
        eventHandlers: {
          onClick: this.handleClick,
          onHover: this.handleHover,
          onContextMenu: this.handleContextMenu,
        },
        getSourceSettings: (id: string) => this.getSourceSettings(id),
      },
    });
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  /**
   * Unified click handler for day and week cells.
   * Dispatches to openOrCreateDailyNote or openOrCreateWeeklyNote based on granularity.
   */
  private handleClick(
    granularity: IGranularity,
    date: Moment,
    _file: TFile,
    inNewSplit: boolean
  ): void {
    if (granularity === "day") {
      this.openOrCreateDailyNote(date, inNewSplit);
    } else if (granularity === "week") {
      this.openOrCreateWeeklyNote(date, inNewSplit);
    }
  }

  /**
   * Unified hover handler. Only fires Obsidian's link-hover preview when the
   * meta/ctrl key is held (mirrors original onHoverDay / onHoverWeek behaviour).
   */
  private handleHover(
    granularity: IGranularity,
    date: Moment,
    _file: TFile,
    targetEl: EventTarget,
    isMetaHeld: boolean
  ): void {
    if (!isMetaHeld) return;

    const dailyNotesMap = get(dailyNotes) ?? {};
    const weeklyNotesMap = get(weeklyNotes) ?? {};

    if (granularity === "day") {
      const { format } = getDailyNoteSettings();
      const note = getDailyNote(date, dailyNotesMap);
      this.app.workspace.trigger(
        "link-hover",
        this,
        targetEl,
        date.format(format),
        note?.path
      );
    } else if (granularity === "week") {
      const { format } = getWeeklyNoteSettings();
      const note = getWeeklyNote(date, weeklyNotesMap);
      this.app.workspace.trigger(
        "link-hover",
        this,
        targetEl,
        date.format(format),
        note?.path
      );
    }
  }

  /**
   * Unified right-click handler. Shows the file context menu for the note
   * associated with the clicked cell. No-ops if no note exists yet.
   */
  private handleContextMenu(
    granularity: IGranularity,
    date: Moment,
    _file: TFile,
    event: MouseEvent
  ): void {
    const dailyNotesMap = get(dailyNotes) ?? {};
    const weeklyNotesMap = get(weeklyNotes) ?? {};

    let note: TFile | null = null;

    if (granularity === "day") {
      note = getDailyNote(date, dailyNotesMap);
    } else if (granularity === "week") {
      note = getWeeklyNote(date, weeklyNotesMap);
    }

    if (!note) return;
    // CHANGED: showFileMenu no longer takes `app` as first argument.
    showFileMenu(note, { x: event.pageX, y: event.pageY });
  }

  // ── Source settings ─────────────────────────────────────────────────────────

  /**
   * Returns the display/color/order settings for a given source.
   *
   * CHANGED from original: the original plugin stored per-source settings
   * persistently (user-overridable color, display, order). This fork uses each
   * source's own defaultSettings directly — a simpler approach that produces
   * correct output. Per-source customisation can be layered on later.
   */
  private getSourceSettings(id: string): ISourceSettings {
    const allSources = [
      customTagsSource,
      streakSource,
      wordCountSource,
      tasksSource,
    ];
    const source = allSources.find((s) => s.id === id);
    if (source) {
      // defaultSettings satisfies the ISourceSettings shape (color, display, order).
      return source.defaultSettings as unknown as ISourceSettings;
    }
    // Fallback for external sources injected via calendar:open.
    return { color: "default", display: "calendar-and-menu", order: 99 };
  }

  // ── Vault event handlers ─────────────────────────────────────────────────────

  private onNoteSettingsUpdate(): void {
    dailyNotes.reindex();
    weeklyNotes.reindex();
    this.updateActiveFile();
  }

  private onFileDeleted(file: TFile): void {
    if (getDateFromFile(file, "day")) {
      dailyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "week")) {
      weeklyNotes.reindex();
      this.updateActiveFile();
    }
  }

  private onFileModified(file: TFile): void {
    // A modification doesn't change note existence — reindex so dot counts
    // (word count, tasks) update on the next metadata evaluation.
    const date = getDateFromFile(file, "day") || getDateFromFile(file, "week");
    if (date) {
      dailyNotes.reindex();
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady && this.calendar) {
      if (getDateFromFile(file, "day")) {
        dailyNotes.reindex();
      }
      if (getDateFromFile(file, "week")) {
        weeklyNotes.reindex();
      }
    }
  }

  public onFileOpen(_file: TFile): void {
    if (this.app.workspace.layoutReady) {
      this.updateActiveFile();
    }
  }

  private updateActiveFile(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    let file: TFile | null = null;
    if (activeLeaf?.view instanceof FileView) {
      // file may be null on a blank FileView (e.g. new empty pane).
      file = activeLeaf.view.file ?? null;
    }
    activeFile.setFile(file);
  }

  // ── Note navigation ──────────────────────────────────────────────────────────

  /**
   * Scroll the calendar to show the month containing the currently open note.
   * Called by the "reveal-active-note" command in main.ts.
   */
  public revealActiveNote(): void {
    const { moment } = window;
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf?.view instanceof FileView) {
      const file = activeLeaf.view.file;
      if (!file) return;

      // Try daily note format first.
      let date = getDateFromFile(file, "day");
      if (date) {
        this.calendar?.$set({ displayedMonth: date });
        return;
      }
      // Try weekly note format.
      const { format } = getWeeklyNoteSettings();
      date = moment(file.basename, format, true);
      if (date.isValid()) {
        this.calendar?.$set({ displayedMonth: date });
      }
    }
  }

  /**
   * Open an existing weekly note or create a new one.
   * Public so main.ts can call it from the "open-weekly-note" command.
   */
  public async openOrCreateWeeklyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    // Weekly notes are keyed to the start of the ISO week.
    const startOfWeek = date.clone().startOf("week");
    const weeklyNotesMap = get(weeklyNotes) ?? {};
    const existingFile = getWeeklyNote(date, weeklyNotesMap);

    if (!existingFile) {
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    // CHANGED: getLeaf("split") replaces deprecated splitActiveLeaf()
    // CHANGED: getLeaf(false) replaces deprecated getUnpinnedLeaf()
    const leaf = inNewSplit
      ? workspace.getLeaf("split")
      : workspace.getLeaf(false);
    await leaf.openFile(existingFile);
    activeFile.setFile(existingFile);
    // CHANGED: { focus: true } object form replaces deprecated setActiveLeaf(leaf, true, true)
    workspace.setActiveLeaf(leaf, { focus: true });
  }

  /**
   * Open an existing daily note or create a new one.
   */
  public async openOrCreateDailyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    const dailyNotesMap = get(dailyNotes) ?? {};
    const existingFile = getDailyNote(date, dailyNotesMap);

    if (!existingFile) {
      tryToCreateDailyNote(date, inNewSplit, this.settings, (dailyNote: TFile) => {
        activeFile.setFile(dailyNote);
      });
      return;
    }

    const mode = (this.app.vault as any).getConfig("defaultViewMode");
    // CHANGED: getLeaf("split") replaces deprecated splitActiveLeaf()
    // CHANGED: getLeaf(false) replaces deprecated getUnpinnedLeaf()
    const leaf = inNewSplit
      ? workspace.getLeaf("split")
      : workspace.getLeaf(false);
    // Cast to `any` to allow the `mode` field which is not in the public OpenViewState type.
    await leaf.openFile(existingFile, { active: true, mode } as any);
    activeFile.setFile(existingFile);
  }
}
