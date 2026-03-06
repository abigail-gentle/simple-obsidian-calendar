// CalendarPlugin — Obsidian plugin entry point.
//
// Ported from obsidian-calendar-plugin/src/main.ts with these changes:
//   CHANGED: workspace.on("layout-ready", ...) → workspace.onLayoutReady(...)
//            (the "layout-ready" event was deprecated in favour of this callback method)
//   CHANGED: Removed appHasPeriodicNotesPluginLoaded() check from "open-weekly-note"
//            command. The original suppressed this command when Periodic Notes was
//            installed. This fork owns weekly notes permanently — command always registers.
//   CHANGED: CalendarSettingsTab moved from settings.ts into this file for clarity,
//            since it references main.ts types (CalendarPlugin) and src/ui/sources imports.
//   ADDED:   "Template engine" setting in CalendarSettingsTab (shown only when Templater
//            is installed) — new functionality added in this fork.
//   CHANGED: Weekly notes section note about "moving to Periodic Notes" removed —
//            this fork owns the weekly note settings permanently.

import type { Moment, WeekSpec } from "moment";
import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";

import { VIEW_TYPE_CALENDAR, DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";
import { configureGlobalMomentLocale } from "src/localization";
import type { ILocaleOverride, IWeekStartOption } from "src/localization";
import { defaultSettings } from "src/settings";
import type { ISettings } from "src/settings";
import { templaterIsAvailable } from "src/io/template";
import { hasWeekTokenMismatch } from "src/io/weekFormat";
import { settings } from "src/ui/stores";
import { dailyNotes, weeklyNotes } from "src/ui/stores";
import CalendarView from "src/view";

declare global {
  interface Window {
    app: App;
    moment: typeof import("moment");
    _bundledLocaleWeekSpec: WeekSpec;
  }
}

export default class CalendarPlugin extends Plugin {
  // The current plugin settings; kept in sync with the Svelte `settings` store.
  // CHANGED: Initialised to defaultSettings to satisfy TypeScript's strict
  // property initialisation check. The subscribe() call in onload() immediately
  // overwrites this with the stored (or default) value from the Svelte store.
  public options: ISettings = defaultSettings;

  onunload(): void {
    // Detach all open calendar leaves so the view is fully cleaned up.
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_CALENDAR)
      .forEach((leaf) => leaf.detach());
  }

  async onload(): Promise<void> {
    // Mirror the Svelte settings store into this.options so settings-tab and
    // command callbacks can read the latest value synchronously.
    this.register(
      settings.subscribe((value) => {
        this.options = value;
      })
    );

    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf: WorkspaceLeaf) => new CalendarView(leaf)
    );

    // ── Commands ──────────────────────────────────────────────────────────────

    // Open the calendar sidebar (only shown when no leaf already exists).
    this.addCommand({
      id: "show-calendar-view",
      name: "Open view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return (
            this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length === 0
          );
        }
        this.initLeaf();
      },
    });

    // Open today's weekly note.
    // CHANGED from original: no longer suppressed when Periodic Notes is installed.
    // This fork owns weekly notes permanently.
    this.addCommand({
      id: "open-weekly-note",
      name: "Open Weekly Note",
      checkCallback: (checking: boolean) => {
        if (checking) {
          // Only show the command if showWeeklyNote is enabled.
          return this.options.showWeeklyNote;
        }
        const view = this.getCalendarView();
        view?.openOrCreateWeeklyNote(window.moment(), false);
      },
    });

    // Scroll the calendar to the month of the currently open note.
    this.addCommand({
      id: "reveal-active-note",
      name: "Reveal active note",
      callback: () => this.getCalendarView()?.revealActiveNote(),
    });

    // ── Load settings and open view ───────────────────────────────────────────

    await this.loadOptions();
    this.addSettingTab(new CalendarSettingsTab(this.app, this));

    // CHANGED: workspace.onLayoutReady() replaces deprecated
    //          workspace.on("layout-ready", ...) event.
    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.app.workspace.onLayoutReady(() => this.initLeaf());
    }
  }

  /** Open the calendar in the right sidebar leaf if one does not already exist. */
  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false)?.setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }

  /** Returns the active CalendarView, or null if no leaf is open. */
  private getCalendarView(): CalendarView | null {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
    if (leaves.length === 0) return null;
    const view = leaves[0].view;
    return view instanceof CalendarView ? view : null;
  }

  /** Load plugin data from disk and merge into the Svelte settings store. */
  async loadOptions(): Promise<void> {
    const savedData = await this.loadData();
    settings.update((current) => ({
      ...current,
      ...(savedData ?? {}),
    }));
    // Persist the merged settings immediately so defaults are written to disk.
    await this.saveData(this.options);

    // Apply locale/week-start configuration now that settings are loaded.
    configureGlobalMomentLocale(
      this.options.localeOverride,
      this.options.weekStart
    );

    // Reindex the note stores now that settings (format/folder) are known.
    dailyNotes.reindex();
    weeklyNotes.reindex();
  }

  /**
   * Apply a partial settings update and persist to disk.
   *
   * Usage: `this.plugin.writeOptions(() => ({ wordsPerDot: 300 }))`
   */
  async writeOptions(
    changeOpts: (current: ISettings) => Partial<ISettings>
  ): Promise<void> {
    settings.update((current) => ({ ...current, ...changeOpts(current) }));
    await this.saveData(this.options);

    // Re-apply locale configuration whenever settings change, in case
    // localeOverride or weekStart were modified.
    configureGlobalMomentLocale(
      this.options.localeOverride,
      this.options.weekStart
    );
  }
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

/**
 * Obsidian settings tab for the Calendar plugin.
 *
 * Ported from obsidian-calendar-plugin/src/settings.ts (CalendarSettingsTab) with:
 *   ADDED:   "Template engine" dropdown shown when Templater plugin is installed.
 *   CHANGED: Removed "Weekly Note settings are moving to Periodic Notes" notice.
 *   CHANGED: Removed appHasPeriodicNotesPluginLoaded() check on weekly note section.
 *            Weekly note settings are always available when showWeeklyNote is true.
 */
class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    // Warn the user if the Daily Notes core plugin is not enabled, as the
    // calendar relies on it for daily note creation.
    if (!appHasDailyNotesPluginLoaded()) {
      this.containerEl.createDiv("settings-banner", (banner) => {
        banner.createEl("h3", {
          text: "Daily Notes plugin not enabled",
        });
        banner.createEl("p", {
          cls: "setting-item-description",
          text: "The calendar works best alongside the Daily Notes core plugin. Enable it in Settings → Core plugins.",
        });
      });
    }

    this.containerEl.createEl("h3", { text: "General Settings" });
    this.addDotThresholdSetting();
    this.addWeekStartSetting();
    this.addConfirmCreateSetting();
    this.addShowWeeklyNoteSetting();

    // Show the weekly-note sub-section only when the toggle is enabled.
    // CHANGED from original: removed the appHasPeriodicNotesPluginLoaded() check —
    // this fork always owns these settings.
    if (this.plugin.options.showWeeklyNote) {
      this.containerEl.createEl("h3", { text: "Weekly Note Settings" });
      this.addWeeklyNoteFormatSetting();
      this.addWeeklyNoteTemplateSetting();
      this.addWeeklyNoteFolderSetting();
    }

    this.containerEl.createEl("h3", { text: "Advanced Settings" });
    this.addLocaleOverrideSetting();

    // ADDED: Show the Templater engine selector only when Templater is installed.
    if (templaterIsAvailable()) {
      this.addTemplateEngineSetting();
    }
  }

  /** How many words are represented by one dot (default 250). */
  private addDotThresholdSetting(): void {
    new Setting(this.containerEl)
      .setName("Words per dot")
      .setDesc("How many words should be represented by a single dot?")
      .addText((text) => {
        text.setPlaceholder(String(DEFAULT_WORDS_PER_DOT));
        text.inputEl.type = "number";
        text.setValue(String(this.plugin.options.wordsPerDot));
        text.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            wordsPerDot: value !== "" ? Number(value) : DEFAULT_WORDS_PER_DOT,
          }));
        });
      });
  }

  /** First day of the week (locale default or an explicit weekday). */
  private addWeekStartSetting(): void {
    const { moment } = window;
    const localizedWeekdays = moment.weekdays();
    const localeWeekStartNum = window._bundledLocaleWeekSpec?.dow ?? 0;
    const localeWeekStart = moment.weekdays()[localeWeekStartNum];

    const weekdayKeys: IWeekStartOption[] = [
      "sunday", "monday", "tuesday", "wednesday",
      "thursday", "friday", "saturday",
    ];

    new Setting(this.containerEl)
      .setName("Start week on:")
      .setDesc(
        "Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js."
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("locale", `Locale default (${localeWeekStart})`);
        localizedWeekdays.forEach((day, i) => {
          dropdown.addOption(weekdayKeys[i], day);
        });
        dropdown.setValue(this.plugin.options.weekStart);
        dropdown.onChange((value) => {
          this.plugin.writeOptions(() => ({
            weekStart: value as IWeekStartOption,
          }));
        });
      });
  }

  /** Whether to show a confirmation dialog before creating a note. */
  private addConfirmCreateSetting(): void {
    new Setting(this.containerEl)
      .setName("Confirm before creating new note")
      .setDesc("Show a confirmation modal before creating a new note.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldConfirmBeforeCreate);
        toggle.onChange((value) => {
          this.plugin.writeOptions(() => ({
            shouldConfirmBeforeCreate: value,
          }));
        });
      });
  }

  /** Toggle the week-number column and the weekly-note sub-section. */
  private addShowWeeklyNoteSetting(): void {
    new Setting(this.containerEl)
      .setName("Show week number")
      .setDesc(
        "Enable this to add a column with the week number. Clicking a week number opens or creates the weekly note for that week."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showWeeklyNote);
        toggle.onChange((value) => {
          this.plugin.writeOptions(() => ({ showWeeklyNote: value }));
          // Re-render the settings tab to show/hide the Weekly Note section.
          this.display();
        });
      });
  }

  /** Date format string for the weekly note filename. */
  private addWeeklyNoteFormatSetting(): void {
    const setting = new Setting(this.containerEl)
      .setName("Weekly note format")
      .setDesc(
        "For more syntax help, refer to the moment.js format reference."
      )
      .addText((text) => {
        text.setValue(this.plugin.options.weeklyNoteFormat);
        text.setPlaceholder(DEFAULT_WEEK_FORMAT);
        text.onChange((value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteFormat: value }));
          updateFormatWarning(value);
        });
      });

    // Inline warning element shown when the format has mismatched week tokens.
    // Appended beneath the setting control row, hidden by default.
    const warningEl = setting.settingEl.createDiv("weekly-format-warning");
    warningEl.hide();

    const updateFormatWarning = (format: string) => {
      if (hasWeekTokenMismatch(format)) {
        warningEl.setText(
          "⚠ Mismatched locale and ISO week tokens — notes may appear on the wrong week. " +
          "Use gggg+ww or GGGG+WW, not gggg+WW or GGGG+ww."
        );
        warningEl.show();
      } else {
        warningEl.hide();
      }
    };

    // Run immediately so the warning appears on settings-tab open if already bad.
    updateFormatWarning(this.plugin.options.weeklyNoteFormat);
  }

  /** Path to the template file used for new weekly notes. */
  private addWeeklyNoteTemplateSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note template")
      .setDesc(
        "Choose the file to use as the template for your weekly notes."
      )
      .addText((text) => {
        text.setValue(this.plugin.options.weeklyNoteTemplate);
        text.onChange((value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteTemplate: value }));
        });
      });
  }

  /** Vault folder where new weekly notes are saved. */
  private addWeeklyNoteFolderSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note folder")
      .setDesc("New weekly notes will be placed here.")
      .addText((text) => {
        text.setValue(this.plugin.options.weeklyNoteFolder);
        text.onChange((value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteFolder: value }));
        });
      });
  }

  /** Override the moment.js locale used by the calendar. */
  private addLocaleOverrideSetting(): void {
    const sysLocale = navigator.language?.toLowerCase();

    new Setting(this.containerEl)
      .setName("Override locale:")
      .setDesc(
        "Set this if you want to use a locale different from the default."
      )
      .addDropdown((dropdown) => {
        dropdown.addOption(
          "system-default",
          `Same as system (${sysLocale})`
        );
        window.moment.locales().forEach((locale) => {
          dropdown.addOption(locale, locale);
        });
        dropdown.setValue(this.plugin.options.localeOverride);
        dropdown.onChange((value) => {
          this.plugin.writeOptions(() => ({
            localeOverride: value as ILocaleOverride,
          }));
        });
      });
  }

  /**
   * ADDED: Choose between Obsidian's built-in template system and the Templater
   * community plugin. This setting is only rendered when Templater is installed.
   */
  private addTemplateEngineSetting(): void {
    new Setting(this.containerEl)
      .setName("Template engine")
      .setDesc(
        "Choose which template engine to use when creating new notes. " +
          "Templater templates support dynamic content like dates and prompts."
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("obsidian", "Obsidian built-in templates");
        dropdown.addOption("templater", "Templater plugin");
        dropdown.setValue(this.plugin.options.templateEngine);
        dropdown.onChange((value) => {
          this.plugin.writeOptions(() => ({
            templateEngine: value as "obsidian" | "templater",
          }));
        });
      });
  }
}
