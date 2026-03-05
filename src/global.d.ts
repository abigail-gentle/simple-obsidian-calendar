/**
 * Global type augmentations for Obsidian's runtime injections.
 * Obsidian injects `window.app` and `window.moment` at startup.
 */

import type { WeekSpec } from "moment";

declare global {
  interface Window {
    /** Obsidian App instance, injected at runtime. */
    app: import("obsidian").App;
    /** moment.js, injected at runtime by Obsidian. */
    moment: typeof import("moment");
    /** Saved bundled locale week spec for week-start override restoration. */
    _bundledLocaleWeekSpec: WeekSpec;
  }
}
