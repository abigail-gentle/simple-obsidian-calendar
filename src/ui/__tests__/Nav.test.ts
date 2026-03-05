/**
 * Svelte smoke tests for src/ui/Nav.svelte
 *
 * Nav renders prev/next navigation arrows and a current month/year label.
 * It reads and writes to the DISPLAYED_MONTH Svelte context.
 *
 * These tests only verify DOM structure and basic interactions. The full
 * month-grid logic is covered by the getMonth unit tests in utils.test.ts.
 */

describe("Nav", () => {
  it.todo("renders a previous-month button");

  it.todo("renders a next-month button");

  it.todo(
    "clicking the next button updates the displayed month context forward by one month"
  );

  it.todo(
    "clicking the prev button updates the displayed month context back by one month"
  );

  it.todo("renders the current month name and year as visible text");
});
