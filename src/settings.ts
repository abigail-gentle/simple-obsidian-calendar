/**
 * Plugin settings for simple-obsidian-calendar.
 * Ported from obsidian-calendar-plugin/src/settings.ts with additions:
 *   - templateEngine: 'obsidian' | 'templater'
 *
 * The CalendarSettingsTab class (requires Obsidian DOM) is omitted here;
 * it lives in src/ui/settingsTab.ts when needed.
 */

import type { ILocaleOverride, IWeekStartOption } from "src/localization";
import { DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";

export type ITemplateEngine = "obsidian" | "templater";

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;

  // Weekly Note settings
  showWeeklyNote: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;

  localeOverride: ILocaleOverride;

  // Template engine selection (new in v2)
  templateEngine: ITemplateEngine;
}

export const defaultSettings: Readonly<ISettings> = Object.freeze({
  shouldConfirmBeforeCreate: true,
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default" as ILocaleOverride,

  templateEngine: "obsidian" as ITemplateEngine,
});
