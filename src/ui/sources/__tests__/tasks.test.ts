/**
 * Tests for src/ui/sources/tasks.ts
 *
 * Key behaviours confirmed from source analysis:
 *   - Regex matches "- [ ]" and "* [ ]" (unchecked tasks only)
 *   - Returns either [] or one dot regardless of task count
 *   - dot has { className: "task", color: "default", isFilled: false }
 *   - null file → [] (no vault read)
 *   - file with only checked tasks (- [x]) → 0 unchecked → [] (no dot)
 */

describe("tasksSource", () => {
  it.todo("has id 'tasks'");

  it.todo("has defaultSettings with display 'calendar-and-menu'");

  // -------------------------------------------------------------------------
  // Null file
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, null)", () => {
    it.todo("returns { dots: [] } without reading from the vault");
  });

  // -------------------------------------------------------------------------
  // File with no tasks
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, file) when the file has no tasks", () => {
    it.todo("returns { dots: [] }");
  });

  // -------------------------------------------------------------------------
  // Unchecked tasks → unfilled dot
  // -------------------------------------------------------------------------

  describe("getMetadata with unchecked tasks", () => {
    it.todo(
      "returns one unfilled dot for a file containing '- [ ] a task'"
    );

    it.todo(
      "returns one unfilled dot for a file containing '* [ ] a task'"
    );

    it.todo(
      "returns exactly one unfilled dot even when multiple unchecked tasks are present"
    );
  });

  // -------------------------------------------------------------------------
  // Checked-only file → no dot (0 unchecked)
  // -------------------------------------------------------------------------

  describe("getMetadata with only checked tasks", () => {
    it.todo(
      "returns { dots: [] } for a file where all tasks are checked (- [x])"
    );
  });

  // -------------------------------------------------------------------------
  // Mixed tasks
  // -------------------------------------------------------------------------

  describe("getMetadata with mixed checked and unchecked tasks", () => {
    it.todo(
      "returns one unfilled dot when at least one task is unchecked"
    );
  });

  // -------------------------------------------------------------------------
  // Week granularity
  // -------------------------------------------------------------------------

  describe("getMetadata('week', date, file)", () => {
    it.todo(
      "behaves identically to the 'day' case (unified API — same code path)"
    );
  });
});
