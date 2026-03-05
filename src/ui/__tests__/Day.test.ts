/**
 * Svelte smoke tests for src/ui/Day.svelte
 *
 * Day renders a single calendar cell. Key props:
 *   - date: Moment        — the day being rendered
 *   - file: TFile | null  — the corresponding daily note (if any)
 *   - selectedId: string  — the currently active file's dateUID
 *   - onClick: (date, isMetaPressed, file, inNewSplit) => void
 *   - onContextMenu: (date, event) => void
 *
 * CSS classes applied by Day:
 *   - "today"    — when date is today
 *   - "has-note" — when file is non-null
 *   - "active"   — when selectedId matches this day's dateUID
 */

describe("Day", () => {
  it.todo("renders the day number as visible text content");

  it.todo("adds the 'today' CSS class when the date is today");

  it.todo("does not add the 'today' CSS class for a date that is not today");

  it.todo("adds the 'has-note' CSS class when a TFile is provided");

  it.todo("does not add the 'has-note' CSS class when file is null");

  it.todo(
    "adds the 'active' CSS class when selectedId matches the day's dateUID"
  );

  it.todo(
    "does not add the 'active' CSS class when selectedId does not match"
  );

  it.todo("calls the onClick handler when the cell is clicked");

  it.todo(
    "passes the correct granularity ('day'), date, file, and inNewSplit to onClick"
  );

  it.todo(
    "calls the onContextMenu handler when the cell receives a right-click"
  );
});
