// Framework smoke test — verifies the test infrastructure itself works.
// This file should PASS after npm install.  It does not test any plugin code.

import moment from "moment";

// Mocked modules — resolved via moduleNameMapper in jest.config.js
import { TFile, Modal, Menu, Setting } from "obsidian";
import {
  getDailyNoteSettings,
  createDailyNote,
  getAllDailyNotes,
  getDateUID,
  appHasDailyNotesPluginLoaded,
} from "obsidian-daily-notes-interface";

// ---------------------------------------------------------------------------
// Module resolution
// ---------------------------------------------------------------------------
describe("Mock module resolution", () => {
  it("resolves the obsidian mock and TFile can be instantiated", () => {
    const f = new TFile("Notes/2024-01-15.md");
    expect(f.path).toBe("Notes/2024-01-15.md");
    expect(f.extension).toBe("md");
  });

  it("resolves obsidian-daily-notes-interface mock with jest.fn() stubs", () => {
    expect(typeof getDailyNoteSettings).toBe("function");
    expect(getDailyNoteSettings()).toEqual({
      format: "YYYY-MM-DD",
      folder: "",
      template: "",
    });
  });

  it("obsidian-daily-notes-interface mock functions are jest mocks (can be reconfigured)", () => {
    (getDailyNoteSettings as jest.Mock).mockReturnValueOnce({ format: "DD-MM-YYYY", folder: "daily", template: "" });
    expect(getDailyNoteSettings().format).toBe("DD-MM-YYYY");
    // Default is restored on the next call because mockReturnValueOnce was used
    expect(getDailyNoteSettings().format).toBe("YYYY-MM-DD");
  });

  it("createDailyNote mock returns a TFile by default", async () => {
    const file = await createDailyNote(moment());
    expect(file).toBeInstanceOf(TFile);
  });

  it("getAllDailyNotes returns an empty object by default", () => {
    expect(getAllDailyNotes()).toEqual({});
  });

  it("getDateUID returns a string", () => {
    const uid = getDateUID(moment("2024-01-15"), "day");
    expect(typeof uid).toBe("string");
    expect(uid).toContain("2024-01-15");
  });

  it("appHasDailyNotesPluginLoaded returns true by default", () => {
    expect(appHasDailyNotesPluginLoaded()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------
describe("Global test setup", () => {
  it("window.moment is real moment", () => {
    const m = (window as any).moment("2024-01-15");
    expect(m.format("YYYY-MM-DD")).toBe("2024-01-15");
  });

  it("window.app.vault is the mock vault", () => {
    expect(typeof (window as any).app.vault.cachedRead).toBe("function");
  });

  it("window.app.workspace is the mock workspace", () => {
    expect(typeof (window as any).app.workspace.getLeaf).toBe("function");
  });

  it("window.app mocks are reset before each test (plugins starts empty)", () => {
    // This test verifies the beforeEach in jest.setup.ts resets plugins
    expect((window as any).app.plugins.plugins).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// moment.js availability
// ---------------------------------------------------------------------------
describe("moment.js", () => {
  it("parses a date string", () => {
    expect(moment("2024-01-15").isValid()).toBe(true);
  });

  it("formats a date", () => {
    expect(moment("2024-01-15").format("YYYY-MM-DD")).toBe("2024-01-15");
  });

  it("computes week number", () => {
    // ISO week 3 of 2024
    expect(moment("2024-01-15").isoWeek()).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Mock class sanity checks
// ---------------------------------------------------------------------------
describe("Mock classes", () => {
  it("Modal can be instantiated", () => {
    const modal = new Modal((window as any).app);
    expect(modal.open).toBeDefined();
    expect(modal.close).toBeDefined();
  });

  it("Menu can be instantiated", () => {
    const menu = new Menu();
    expect(menu.addItem).toBeDefined();
    expect(menu.showAtPosition).toBeDefined();
  });

  it("Setting can be instantiated with a container element", () => {
    const el = document.createElement("div");
    const setting = new Setting(el);
    expect(setting.setName).toBeDefined();
  });
});
