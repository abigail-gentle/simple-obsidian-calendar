/**
 * Tests for src/ui/stores.ts
 *
 * Tests all four stores: dailyNotes, weeklyNotes, activeFile, settings.
 *
 * Key bug being tested:
 *   activeFile.setFile(null) — the original source does not guard against null,
 *   calling getDateUIDFromFile(null) which throws. The test for setFile(null)
 *   documents the FIXED behaviour: it should set the store to null without throwing.
 *
 * Each test gets a fresh store instance via the factory functions (no shared state).
 */

describe("dailyNotes store", () => {
  it.todo("has an initial value of null");

  describe("reindex()", () => {
    it.todo("sets the store value to the result of getAllDailyNotes()");

    it.todo("calls getAllDailyNotes exactly once per reindex() call");

    describe("when getAllDailyNotes() throws", () => {
      it.todo("sets the store value to an empty object {}");

      it.todo("does not rethrow the error");

      it.todo("logs the error to the console on the first failure");

      it.todo(
        "does not log the error again on subsequent failures until a success resets the flag"
      );
    });
  });
});

describe("weeklyNotes store", () => {
  it.todo("has an initial value of null");

  describe("reindex()", () => {
    it.todo("sets the store value to the result of getAllWeeklyNotes()");

    describe("when getAllWeeklyNotes() throws", () => {
      it.todo("sets the store value to an empty object {}");

      it.todo("does not rethrow the error");
    });
  });
});

describe("activeFile store", () => {
  it.todo("has an initial value of null");

  describe("setFile(file)", () => {
    it.todo(
      "sets the store to the UID returned by getDateUIDFromFile(file)"
    );
  });

  describe("setFile(null)", () => {
    it.todo("sets the store to null");

    it.todo("does not throw or call getDateUIDFromFile with null");
  });
});

describe("settings store", () => {
  it.todo("is initialized with the defaultSettings values");

  it.todo("has the correct default for shouldConfirmBeforeCreate (true)");

  it.todo("has the correct default for showWeeklyNote (false)");

  it.todo("has the correct default for wordsPerDot (250)");

  it.todo("has the correct default for weekStart ('locale')");

  it.todo("has the correct default for localeOverride ('system-default')");

  it.todo("has the correct default for templateEngine ('obsidian')");

  it.todo("has the correct default for weeklyNoteFormat (empty string)");

  it.todo("has the correct default for weeklyNoteTemplate (empty string)");

  it.todo("has the correct default for weeklyNoteFolder (empty string)");
});
