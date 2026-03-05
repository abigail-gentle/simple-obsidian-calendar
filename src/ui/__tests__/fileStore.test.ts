/**
 * Tests for src/ui/fileStore.ts — PeriodicNotesCache
 *
 * Only the key public methods are tested per the coverage plan:
 *   - initialize()
 *   - getFile(date, granularity)
 *   - getEvaluatedMetadata(granularity, date, getSourceSettings)
 *
 * The constructor's vault event registrations are NOT tested directly
 * (they fire after onLayoutReady, making them hard to unit-test).
 *
 * Mocking strategy:
 *   - getAllDailyNotes / getAllWeeklyNotes / getAllMonthlyNotes are already
 *     jest.fn() via the always-on obsidian-daily-notes-interface mock.
 *   - ICalendarSource objects are plain objects (no class required).
 */

describe("PeriodicNotesCache", () => {
  // -------------------------------------------------------------------------
  // initialize()
  // -------------------------------------------------------------------------

  describe("initialize()", () => {
    it.todo(
      "populates the store with all daily notes returned by getAllDailyNotes()"
    );

    it.todo(
      "merges in all weekly notes returned by getAllWeeklyNotes()"
    );

    it.todo(
      "merges in all monthly notes returned by getAllMonthlyNotes()"
    );

    it.todo(
      "the store value is an object keyed by dateUID strings mapping to TFile objects"
    );
  });

  // -------------------------------------------------------------------------
  // getFile(date, granularity)
  // -------------------------------------------------------------------------

  describe("getFile(date, granularity)", () => {
    it.todo(
      "returns the TFile when the corresponding dateUID is in the store"
    );

    it.todo(
      "returns null when the dateUID is not in the store"
    );

    it.todo("returns null when the store has not been initialized");
  });

  // -------------------------------------------------------------------------
  // getEvaluatedMetadata(granularity, date, getSourceSettings)
  // -------------------------------------------------------------------------

  describe("getEvaluatedMetadata(granularity, date, getSourceSettings)", () => {
    it.todo("returns an empty array when the sources list is empty");

    describe("with one source that implements getMetadata", () => {
      it.todo(
        "calls source.getMetadata with granularity, date, and the resolved file"
      );

      it.todo(
        "merges the source's resolved metadata into the result item"
      );

      it.todo(
        "merges the sourceSettings from getSourceSettings(source.id) into the result item"
      );

      it.todo(
        "includes the source's id, name, and description in the result item"
      );
    });

    describe("with one source that does NOT implement getMetadata", () => {
      it.todo(
        "returns a result item with empty metadata (no dots, no dataAttributes) for that source"
      );

      it.todo("does not throw");
    });

    describe("when a source's getMetadata throws", () => {
      it.todo("catches the error without rethrowing");

      it.todo("logs a warning to the console");

      it.todo("continues processing the remaining sources");
    });

    describe("with multiple sources", () => {
      it.todo("returns one result item per source");

      it.todo("preserves source order in the result array");
    });
  });
});
