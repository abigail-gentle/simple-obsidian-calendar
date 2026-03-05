/**
 * Tests for src/ui/utils.ts
 */

import moment from "moment";
import { TFile } from "obsidian";
import { getDateFromFile, getDateUID } from "obsidian-daily-notes-interface";

import {
  classList,
  clamp,
  getDaysOfWeek,
  getDateUIDFromFile,
  getMonth,
  getWordCount,
  isMetaPressed,
  isWeekend,
  partition,
} from "src/ui/utils";

// ---------------------------------------------------------------------------
// getWordCount
// ---------------------------------------------------------------------------

describe("getWordCount", () => {
  it("returns 0 for an empty string", () => {
    expect(getWordCount("")).toBe(0);
  });

  it("returns 0 for a whitespace-only string", () => {
    expect(getWordCount("   \t\n  ")).toBe(0);
  });

  it("returns 1 for a single word with no whitespace", () => {
    expect(getWordCount("hello")).toBe(1);
  });

  it("counts words separated by spaces", () => {
    expect(getWordCount("one two three")).toBe(3);
  });

  it("counts words separated by newlines", () => {
    expect(getWordCount("one\ntwo\nthree")).toBe(3);
  });

  it("counts words separated by tabs", () => {
    expect(getWordCount("one\ttwo\tthree")).toBe(3);
  });

  it("handles mixed whitespace (space, tab, newline) as delimiters", () => {
    expect(getWordCount("one \t two \n three")).toBe(3);
  });

  it("treats punctuation attached to a word as part of the word", () => {
    // "hello," is one token, "world!" is one token
    expect(getWordCount("hello, world!")).toBe(2);
  });

  it("counts each CJK character as an individual word without requiring whitespace", () => {
    // 三 CJK characters = 3 words
    expect(getWordCount("日本語")).toBe(3);
  });

  it("counts Arabic words separated by spaces correctly", () => {
    expect(getWordCount("مرحبا بالعالم")).toBe(2);
  });

  it("counts Hebrew words separated by spaces correctly", () => {
    expect(getWordCount("שלום עולם")).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// classList
// ---------------------------------------------------------------------------

describe("classList", () => {
  it("returns an empty array for an empty object", () => {
    expect(classList({})).toEqual([]);
  });

  it("returns a single-element array for a single truthy entry", () => {
    expect(classList({ active: true })).toEqual(["active"]);
  });

  it("omits keys whose values are falsy", () => {
    expect(classList({ active: false, hidden: false })).toEqual([]);
  });

  it("includes all keys whose values are truthy", () => {
    const result = classList({ active: true, visible: true });
    expect(result).toContain("active");
    expect(result).toContain("visible");
  });

  it("returns an array (not a string)", () => {
    expect(Array.isArray(classList({ active: true }))).toBe(true);
  });

  it("returns class names as individual array elements", () => {
    const result = classList({ a: true, b: true });
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("a");
    expect(result[1]).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe("clamp", () => {
  it("returns the value unchanged when within [min, max]", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when the value is below min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when the value is above max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min (inclusive boundary)", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max (inclusive boundary)", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// partition
// ---------------------------------------------------------------------------

describe("partition", () => {
  it("returns two empty arrays for an empty input", () => {
    expect(partition([], () => true)).toEqual([[], []]);
  });

  it("puts all elements in the first array when all match the predicate", () => {
    const [pass, fail] = partition(["a", "b", "c"], () => true);
    expect(pass).toEqual(["a", "b", "c"]);
    expect(fail).toEqual([]);
  });

  it("puts all elements in the second array when none match the predicate", () => {
    const [pass, fail] = partition(["a", "b", "c"], () => false);
    expect(pass).toEqual([]);
    expect(fail).toEqual(["a", "b", "c"]);
  });

  it("correctly separates mixed elements", () => {
    const [pass, fail] = partition(["apple", "banana", "apricot"], (s) =>
      s.startsWith("a")
    );
    expect(pass).toEqual(["apple", "apricot"]);
    expect(fail).toEqual(["banana"]);
  });

  it("does not modify the original array", () => {
    const original = ["a", "b", "c"];
    partition(original, (s) => s === "a");
    expect(original).toEqual(["a", "b", "c"]);
  });
});

// ---------------------------------------------------------------------------
// getDateUIDFromFile
// ---------------------------------------------------------------------------

describe("getDateUIDFromFile", () => {
  it("returns null for a null input", () => {
    expect(getDateUIDFromFile(null)).toBeNull();
  });

  it("returns the day UID for a file whose name matches the daily note format", () => {
    const mockDate = moment("2024-01-15");
    (getDateFromFile as jest.Mock).mockImplementation((_file, granularity) =>
      granularity === "day" ? mockDate : null
    );
    (getDateUID as jest.Mock).mockReturnValue("day-2024-01-15");

    const file = new TFile("2024-01-15.md");

    expect(getDateUIDFromFile(file)).toBe("day-2024-01-15");
    expect(getDateUID).toHaveBeenCalledWith(mockDate, "day");
  });

  it("returns the week UID for a file whose name matches the weekly note format", () => {
    const mockDate = moment("2024-01-15");
    (getDateFromFile as jest.Mock).mockImplementation((_file, granularity) =>
      granularity === "week" ? mockDate : null
    );
    (getDateUID as jest.Mock).mockReturnValue("week-2024-01-15");

    const file = new TFile("2024-W03.md");

    expect(getDateUIDFromFile(file)).toBe("week-2024-01-15");
    expect(getDateUID).toHaveBeenCalledWith(mockDate, "week");
  });

  it("returns null for a file whose name matches neither format", () => {
    (getDateFromFile as jest.Mock).mockReturnValue(null);

    const file = new TFile("some-random-note.md");
    expect(getDateUIDFromFile(file)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isMetaPressed
// ---------------------------------------------------------------------------

describe("isMetaPressed", () => {
  it("returns true on macOS when metaKey is pressed", () => {
    Object.defineProperty(navigator, "appVersion", {
      value: "5.0 (Macintosh)",
      configurable: true,
    });
    const event = { metaKey: true, ctrlKey: false } as MouseEvent;
    expect(isMetaPressed(event)).toBe(true);
  });

  it("returns false on macOS when only ctrlKey is pressed", () => {
    Object.defineProperty(navigator, "appVersion", {
      value: "5.0 (Macintosh)",
      configurable: true,
    });
    const event = { metaKey: false, ctrlKey: true } as MouseEvent;
    expect(isMetaPressed(event)).toBe(false);
  });

  it("returns true on non-macOS when ctrlKey is pressed", () => {
    Object.defineProperty(navigator, "appVersion", {
      value: "5.0 (Windows NT 10.0)",
      configurable: true,
    });
    const event = { metaKey: false, ctrlKey: true } as MouseEvent;
    expect(isMetaPressed(event)).toBe(true);
  });

  it("returns false on non-macOS when only metaKey is pressed", () => {
    Object.defineProperty(navigator, "appVersion", {
      value: "5.0 (Windows NT 10.0)",
      configurable: true,
    });
    const event = { metaKey: true, ctrlKey: false } as MouseEvent;
    expect(isMetaPressed(event)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isWeekend
// ---------------------------------------------------------------------------

describe("isWeekend", () => {
  it("returns true for Saturday (isoWeekday 6)", () => {
    const sat = moment("2024-01-06"); // Saturday
    expect(isWeekend(sat)).toBe(true);
  });

  it("returns true for Sunday (isoWeekday 7)", () => {
    const sun = moment("2024-01-07"); // Sunday
    expect(isWeekend(sun)).toBe(true);
  });

  it("returns false for Monday (isoWeekday 1)", () => {
    const mon = moment("2024-01-08"); // Monday
    expect(isWeekend(mon)).toBe(false);
  });

  it("returns false for Friday (isoWeekday 5)", () => {
    const fri = moment("2024-01-05"); // Friday
    expect(isWeekend(fri)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDaysOfWeek
// ---------------------------------------------------------------------------

describe("getDaysOfWeek", () => {
  it("returns exactly 7 strings", () => {
    const days = getDaysOfWeek();
    expect(days).toHaveLength(7);
  });

  it("returns non-empty strings", () => {
    const days = getDaysOfWeek();
    days.forEach((d) => expect(d.length).toBeGreaterThan(0));
  });
});

// ---------------------------------------------------------------------------
// getMonth
// ---------------------------------------------------------------------------

describe("getMonth", () => {
  it("returns exactly 6 weeks", () => {
    const month = getMonth(moment("2024-01-01"));
    expect(month).toHaveLength(6);
  });

  it("each week contains exactly 7 days", () => {
    const month = getMonth(moment("2024-01-01"));
    month.forEach((week) => expect(week.days).toHaveLength(7));
  });

  it("each day is a Moment object", () => {
    const month = getMonth(moment("2024-01-01"));
    month.forEach((week) =>
      week.days.forEach((day) => expect(moment.isMoment(day)).toBe(true))
    );
  });

  it("all 7 days of a given week are consecutive", () => {
    const month = getMonth(moment("2024-01-01"));
    month.forEach((week) => {
      for (let i = 1; i < 7; i++) {
        const diff = week.days[i].diff(week.days[i - 1], "days");
        expect(diff).toBe(1);
      }
    });
  });

  it("weeks are in ascending chronological order", () => {
    const month = getMonth(moment("2024-01-01"));
    for (let i = 1; i < month.length; i++) {
      expect(month[i].days[0].isAfter(month[i - 1].days[0])).toBe(true);
    }
  });

  it("the displayed month appears in the middle weeks", () => {
    const displayedMonth = moment("2024-01-01");
    const month = getMonth(displayedMonth);
    const allDays = month.flatMap((w) => w.days);
    const jan2024Days = allDays.filter(
      (d) => d.month() === 0 && d.year() === 2024
    );
    // January has 31 days, all should be present
    expect(jan2024Days.length).toBe(31);
  });

  it("includes days from the previous month to fill the first week when the month does not start on the first weekday", () => {
    // January 2024: starts on a Monday (en-gb locale, week starts Monday → no padding)
    // Use a month that starts mid-week to guarantee padding:
    // March 2024 starts on Friday (locale=en, Sunday-start → padding from Sun-Thu)
    moment.locale("en"); // Sunday-start
    const month = getMonth(moment("2024-03-01"));
    const firstWeekDays = month[0].days;
    // Some days in first week should be from February
    const prevMonthDays = firstWeekDays.filter((d) => d.month() === 1); // February = 1
    expect(prevMonthDays.length).toBeGreaterThan(0);
  });

  it("includes days from the next month to fill the last week when the month does not end on the last weekday", () => {
    moment.locale("en");
    const month = getMonth(moment("2024-03-01"));
    const lastWeekDays = month[5].days;
    // Some days in the last week should be from April (month 3)
    const nextMonthDays = lastWeekDays.filter((d) => d.month() === 3);
    expect(nextMonthDays.length).toBeGreaterThan(0);
  });

  describe("with Monday as week start (locale: en-gb)", () => {
    beforeEach(() => {
      moment.locale("en-gb");
    });

    afterEach(() => {
      moment.locale("en");
    });

    it("starts the grid on Monday 2024-01-01 for January 2024", () => {
      const month = getMonth(moment("2024-01-15"));
      expect(month[0].days[0].format("YYYY-MM-DD")).toBe("2024-01-01");
    });

    it("ends the grid on Sunday 2024-02-11 for January 2024", () => {
      const month = getMonth(moment("2024-01-15"));
      const lastWeek = month[5];
      expect(lastWeek.days[6].format("YYYY-MM-DD")).toBe("2024-02-11");
    });
  });

  describe("with Sunday as week start (locale: en)", () => {
    beforeEach(() => {
      moment.locale("en");
    });

    it("starts the grid on Sunday 2023-12-31 for January 2024", () => {
      const month = getMonth(moment("2024-01-15"));
      expect(month[0].days[0].format("YYYY-MM-DD")).toBe("2023-12-31");
    });
  });

  describe("February 2024 (leap year)", () => {
    it("includes 29 days for February when it is a leap year", () => {
      moment.locale("en");
      const month = getMonth(moment("2024-02-01"));
      const allDays = month.flatMap((w) => w.days);
      const febDays = allDays.filter(
        (d) => d.month() === 1 && d.year() === 2024
      );
      expect(febDays).toHaveLength(29);
    });
  });
});
