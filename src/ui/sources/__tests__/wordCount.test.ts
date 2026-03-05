/**
 * Tests for src/ui/sources/wordCount.ts
 *
 * Key behaviours confirmed from source analysis:
 *   - null file → 0 dots (early return before clamp)
 *   - any non-null file → minimum 1 dot (clamp(Math.floor(n), 1, 5))
 *   - empty file content → getWordCount returns 0 → numDots = 0 → clamp → 1 dot
 *   - maximum is 5 dots (NUM_MAX_DOTS)
 *   - all dots have isFilled = true
 *   - wordsPerDot is read from the settings store
 */

describe("wordCountSource", () => {
  it.todo("has id 'word-count'");

  it.todo("has defaultSettings with display 'calendar-and-menu'");

  // -------------------------------------------------------------------------
  // Null file
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, null)", () => {
    it.todo("returns { dots: [] } without reading from the vault");
  });

  // -------------------------------------------------------------------------
  // Non-null file — dot count
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, file)", () => {
    it.todo("reads the file content via app.vault.cachedRead");

    it.todo(
      "returns 1 dot for an empty file (any non-null file gets minimum 1 dot via clamp)"
    );

    it.todo(
      "returns 1 dot for a file with fewer words than wordsPerDot (e.g., 249 words at default 250/dot)"
    );

    it.todo("returns 1 dot when word count equals wordsPerDot (250 words)");

    it.todo("returns 2 dots for 500 words (2 × wordsPerDot)");

    it.todo("returns 5 dots for 1250 words (5 × wordsPerDot, the maximum)");

    it.todo("returns 5 dots (capped at NUM_MAX_DOTS) for 2000 words");

    it.todo("all returned dot objects have isFilled = true");
  });

  // -------------------------------------------------------------------------
  // Week granularity
  // -------------------------------------------------------------------------

  describe("getMetadata('week', date, file)", () => {
    it.todo(
      "behaves identically to the 'day' case (unified API — same code path)"
    );
  });

  // -------------------------------------------------------------------------
  // wordsPerDot setting
  // -------------------------------------------------------------------------

  describe("wordsPerDot setting", () => {
    it.todo(
      "uses the current value of the settings store for wordsPerDot"
    );

    it.todo("recalculates dot count when wordsPerDot changes between calls");
  });
});
