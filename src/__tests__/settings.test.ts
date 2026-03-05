/**
 * Tests for src/settings.ts
 *
 * Covers:
 *   - defaultSettings object shape and values
 *   - templaterIsAvailable() re-exported from src/io/template.ts
 *     (verified here at the settings module boundary)
 */

describe("defaultSettings", () => {
  it.todo("includes all required ISettings keys");

  it.todo("shouldConfirmBeforeCreate defaults to true");

  it.todo("showWeeklyNote defaults to false");

  it.todo("wordsPerDot defaults to 250");

  it.todo("weekStart defaults to 'locale'");

  it.todo("localeOverride defaults to 'system-default'");

  it.todo("templateEngine defaults to 'obsidian'");

  it.todo("weeklyNoteFormat defaults to empty string");

  it.todo("weeklyNoteTemplate defaults to empty string");

  it.todo("weeklyNoteFolder defaults to empty string");
});

describe("templaterIsAvailable (re-exported from io/template)", () => {
  it.todo(
    "returns false when called with the default mock app (no Templater in plugins)"
  );

  it.todo(
    "returns true when the mock app has a 'templater-obsidian' entry in plugins.plugins"
  );
});
