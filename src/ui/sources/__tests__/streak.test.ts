/**
 * Tests for src/ui/sources/streak.ts
 *
 * Key behaviours confirmed from source analysis:
 *   - This is the CURRENT simple implementation: no actual streak detection.
 *   - Returns ["has-note"] when file exists, [] when file is null.
 *   - dots is always [] (streak is represented by CSS classes, not dots).
 *   - Works identically for 'day' and 'week' granularity.
 *
 * NOTE: If real streak detection (streak-start, streak-middle, streak-end)
 * is added in a later stage, these tests must be updated at that time.
 */

describe("streakSource", () => {
  it.todo("has id 'streak'");

  it.todo("has defaultSettings with display 'calendar-and-menu'");

  // -------------------------------------------------------------------------
  // Null file
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, null)", () => {
    it.todo("returns no CSS classes (empty classes array)");

    it.todo("returns dots: []");
  });

  // -------------------------------------------------------------------------
  // File exists (single isolated day)
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, file) when a note exists", () => {
    it.todo("returns 'has-note' in the CSS classes");

    it.todo("returns dots: []");
  });

  // -------------------------------------------------------------------------
  // Week granularity
  // -------------------------------------------------------------------------

  describe("getMetadata('week', date, file)", () => {
    it.todo("returns 'has-note' in the CSS classes when a file exists");

    it.todo("returns an empty classes array when file is null");

    it.todo("does not throw when file is null");

    it.todo("returns dots: [] regardless of file existence");
  });
});
