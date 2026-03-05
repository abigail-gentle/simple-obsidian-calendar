// Manual mock for the 'obsidian-daily-notes-interface' module.
// All functions are jest.fn() so tests can configure return values with
// mockReturnValue / mockResolvedValue as needed.

import { TFile } from "obsidian";

// ---------------------------------------------------------------------------
// Settings mocks — return sensible defaults for basic test coverage
// ---------------------------------------------------------------------------
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

export const getMonthlyNoteSettings = jest.fn().mockReturnValue({
  format: "YYYY-MM",
  folder: "",
  template: "",
});

export const getPeriodicNoteSettings = jest.fn().mockImplementation(
  (granularity: string) => {
    switch (granularity) {
      case "week":  return getWeeklyNoteSettings();
      case "month": return getMonthlyNoteSettings();
      default:      return getDailyNoteSettings();
    }
  }
);

// ---------------------------------------------------------------------------
// Creation mocks — return a TFile by default
// ---------------------------------------------------------------------------
export const createDailyNote = jest.fn().mockResolvedValue(
  new TFile("2024-01-15.md", "2024-01-15")
);

export const createWeeklyNote = jest.fn().mockResolvedValue(
  new TFile("2024-W03.md", "2024-W03")
);

export const createMonthlyNote = jest.fn().mockResolvedValue(
  new TFile("2024-01.md", "2024-01")
);

export const createPeriodicNote = jest.fn().mockResolvedValue(
  new TFile("2024-01-15.md", "2024-01-15")
);

// ---------------------------------------------------------------------------
// Lookup mocks — return null by default (note doesn't exist yet)
// ---------------------------------------------------------------------------
export const getDailyNote = jest.fn().mockReturnValue(null);
export const getWeeklyNote = jest.fn().mockReturnValue(null);
export const getMonthlyNote = jest.fn().mockReturnValue(null);

export const getAllDailyNotes = jest.fn().mockReturnValue({} as Record<string, TFile>);
export const getAllWeeklyNotes = jest.fn().mockReturnValue({} as Record<string, TFile>);
export const getAllMonthlyNotes = jest.fn().mockReturnValue({} as Record<string, TFile>);

// ---------------------------------------------------------------------------
// Utility mocks
// ---------------------------------------------------------------------------
export const getDateUID = jest.fn().mockImplementation(
  (date: any, granularity: string) =>
    `${granularity}-${date.format("YYYY-MM-DD")}`
);

export const getDateFromFile = jest.fn().mockReturnValue(null);
export const getDateFromPath = jest.fn().mockReturnValue(null);
export const getTemplateInfo = jest.fn().mockResolvedValue(["", ""]);

// ---------------------------------------------------------------------------
// Plugin detection mocks
// ---------------------------------------------------------------------------
export const appHasDailyNotesPluginLoaded = jest.fn().mockReturnValue(true);
export const appHasWeeklyNotesPluginLoaded = jest.fn().mockReturnValue(false);
export const appHasMonthlyNotesPluginLoaded = jest.fn().mockReturnValue(false);
export const appHasQuarterlyNotesPluginLoaded = jest.fn().mockReturnValue(false);
export const appHasYearlyNotesPluginLoaded = jest.fn().mockReturnValue(false);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
export const DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";
export const DEFAULT_MONTHLY_NOTE_FORMAT = "YYYY-MM";
export const DEFAULT_QUARTERLY_NOTE_FORMAT = "YYYY-[Q]Q";
export const DEFAULT_YEARLY_NOTE_FORMAT = "YYYY";
