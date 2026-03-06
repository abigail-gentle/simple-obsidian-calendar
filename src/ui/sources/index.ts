// Re-exports all four ICalendarSource implementations so view.ts can import
// them from a single location.
//
// Ported directly from obsidian-calendar-plugin/src/ui/sources/index.ts — no changes.

export { streakSource } from "./streak";
export { customTagsSource } from "./tags";
export { tasksSource } from "./tasks";
export { wordCountSource } from "./wordCount";
