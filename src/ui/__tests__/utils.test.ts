/**
 * Tests for src/ui/utils.ts
 *
 * All tests in this file are stubs (it.todo) that will fail until the
 * corresponding implementation is written in Stage 1.
 */

import type { Moment } from "moment";

// ---------------------------------------------------------------------------
// getWordCount
// ---------------------------------------------------------------------------

describe("getWordCount", () => {
  it.todo("returns 0 for an empty string");

  it.todo("returns 0 for a whitespace-only string");

  it.todo("returns 1 for a single word with no whitespace");

  it.todo("counts words separated by spaces");

  it.todo("counts words separated by newlines");

  it.todo("counts words separated by tabs");

  it.todo("handles mixed whitespace (space, tab, newline) as delimiters");

  it.todo("treats punctuation attached to a word as part of the word");

  it.todo(
    "counts each CJK character as an individual word without requiring whitespace"
  );

  it.todo(
    "counts Arabic words separated by spaces correctly"
  );

  it.todo(
    "counts Hebrew words separated by spaces correctly"
  );
});

// ---------------------------------------------------------------------------
// classList
// ---------------------------------------------------------------------------

describe("classList", () => {
  it.todo("returns an empty array for an empty object");

  it.todo("returns a single-element array for a single truthy entry");

  it.todo("omits keys whose values are falsy");

  it.todo("includes all keys whose values are truthy");

  it.todo("returns an array (not a string)");

  it.todo("returns class names as individual array elements");
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe("clamp", () => {
  it.todo("returns the value unchanged when within [min, max]");

  it.todo("returns min when the value is below min");

  it.todo("returns max when the value is above max");

  it.todo("returns min when value equals min (inclusive boundary)");

  it.todo("returns max when value equals max (inclusive boundary)");
});

// ---------------------------------------------------------------------------
// partition
// ---------------------------------------------------------------------------

describe("partition", () => {
  it.todo("returns two empty arrays for an empty input");

  it.todo("puts all elements in the first array when all match the predicate");

  it.todo(
    "puts all elements in the second array when none match the predicate"
  );

  it.todo("correctly separates mixed elements");

  it.todo("does not modify the original array");
});

// ---------------------------------------------------------------------------
// getDateUIDFromFile
// ---------------------------------------------------------------------------

describe("getDateUIDFromFile", () => {
  it.todo("returns null for a null input");

  it.todo(
    "returns the day UID for a file whose name matches the daily note format"
  );

  it.todo(
    "returns the week UID for a file whose name matches the weekly note format"
  );

  it.todo("returns null for a file whose name matches neither format");
});

// ---------------------------------------------------------------------------
// isMetaPressed
// ---------------------------------------------------------------------------

describe("isMetaPressed", () => {
  it.todo("returns true on macOS when metaKey is pressed");

  it.todo("returns false on macOS when only ctrlKey is pressed");

  it.todo("returns true on non-macOS when ctrlKey is pressed");

  it.todo("returns false on non-macOS when only metaKey is pressed");
});

// ---------------------------------------------------------------------------
// isWeekend
// ---------------------------------------------------------------------------

describe("isWeekend", () => {
  it.todo("returns true for Saturday (isoWeekday 6)");

  it.todo("returns true for Sunday (isoWeekday 7)");

  it.todo("returns false for Monday (isoWeekday 1)");

  it.todo("returns false for Friday (isoWeekday 5)");
});

// ---------------------------------------------------------------------------
// getDaysOfWeek
// ---------------------------------------------------------------------------

describe("getDaysOfWeek", () => {
  it.todo("returns exactly 7 strings");

  it.todo("returns non-empty strings");
});

// ---------------------------------------------------------------------------
// getMonth
// ---------------------------------------------------------------------------

describe("getMonth", () => {
  it.todo("returns exactly 6 weeks");

  it.todo("each week contains exactly 7 days");

  it.todo("each day is a Moment object");

  it.todo("all 7 days of a given week are consecutive");

  it.todo("weeks are in ascending chronological order");

  it.todo("the displayed month appears in the middle weeks");

  it.todo(
    "includes days from the previous month to fill the first week when the month does not start on the first weekday"
  );

  it.todo(
    "includes days from the next month to fill the last week when the month does not end on the last weekday"
  );

  describe("with Monday as week start (locale: en-gb)", () => {
    it.todo("starts the grid on Monday 2024-01-01 for January 2024");

    it.todo("ends the grid on Sunday 2024-02-11 for January 2024");
  });

  describe("with Sunday as week start (locale: en)", () => {
    it.todo("starts the grid on Sunday 2023-12-31 for January 2024");
  });

  describe("February 2024 (leap year)", () => {
    it.todo("includes 29 days for February when it is a leap year");
  });
});
