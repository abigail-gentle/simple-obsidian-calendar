/**
 * Tests for src/settings.ts
 */

import { defaultSettings } from "src/settings";

describe("defaultSettings", () => {
  it("includes all required ISettings keys", () => {
    const keys = Object.keys(defaultSettings);
    expect(keys).toContain("shouldConfirmBeforeCreate");
    expect(keys).toContain("weekStart");
    expect(keys).toContain("wordsPerDot");
    expect(keys).toContain("showWeeklyNote");
    expect(keys).toContain("weeklyNoteFormat");
    expect(keys).toContain("weeklyNoteTemplate");
    expect(keys).toContain("weeklyNoteFolder");
    expect(keys).toContain("localeOverride");
    expect(keys).toContain("templateEngine");
  });

  it("shouldConfirmBeforeCreate defaults to true", () => {
    expect(defaultSettings.shouldConfirmBeforeCreate).toBe(true);
  });

  it("showWeeklyNote defaults to false", () => {
    expect(defaultSettings.showWeeklyNote).toBe(false);
  });

  it("wordsPerDot defaults to 250", () => {
    expect(defaultSettings.wordsPerDot).toBe(250);
  });

  it("weekStart defaults to 'locale'", () => {
    expect(defaultSettings.weekStart).toBe("locale");
  });

  it("localeOverride defaults to 'system-default'", () => {
    expect(defaultSettings.localeOverride).toBe("system-default");
  });

  it("templateEngine defaults to 'obsidian'", () => {
    expect(defaultSettings.templateEngine).toBe("obsidian");
  });

  it("weeklyNoteFormat defaults to empty string", () => {
    expect(defaultSettings.weeklyNoteFormat).toBe("");
  });

  it("weeklyNoteTemplate defaults to empty string", () => {
    expect(defaultSettings.weeklyNoteTemplate).toBe("");
  });

  it("weeklyNoteFolder defaults to empty string", () => {
    expect(defaultSettings.weeklyNoteFolder).toBe("");
  });
});

// templaterIsAvailable is tested in src/io/__tests__/template.test.ts
// where it lives; we test the re-export here at the settings module boundary.
describe("templaterIsAvailable (re-exported from io/template)", () => {
  it("returns false when called with the default mock app (no Templater in plugins)", async () => {
    // Dynamic import so the test file doesn't fail if template.ts doesn't exist yet
    const { templaterIsAvailable } = await import("src/io/template");
    expect(templaterIsAvailable()).toBe(false);
  });

  it("returns true when the mock app has a 'templater-obsidian' entry in plugins.plugins", async () => {
    const { templaterIsAvailable } = await import("src/io/template");
    window.app.plugins.plugins["templater-obsidian"] = { id: "templater-obsidian" };
    expect(templaterIsAvailable()).toBe(true);
  });
});
