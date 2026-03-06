// Right-click context menu for a periodic note cell.
//
// Ported from obsidian-calendar-plugin/src/ui/fileMenu.ts with one change:
//   CHANGED: `new Menu(app)` → `new Menu()` — the app argument was removed from
//   the Menu constructor in a modern Obsidian API update.

import { Menu, TFile } from "obsidian";

/**
 * Show a context menu anchored at `position` for the given note file.
 *
 * The menu always contains a "Delete" item that calls Obsidian's built-in
 * file deletion prompt. It also fires the "file-menu" workspace event so
 * that other plugins (e.g. File Explorer) can add their own items.
 */
export function showFileMenu(
  file: TFile,
  position: { x: number; y: number }
): void {
  // CHANGED: `new Menu(app)` → `new Menu()` (deprecated constructor removed).
  const fileMenu = new Menu();

  // Built-in "Delete" action — uses Obsidian's own deletion prompt so the user
  // gets the confirmation dialog they have configured in Obsidian preferences.
  fileMenu.addItem((item) =>
    item
      .setTitle("Delete")
      .setIcon("trash")
      .onClick(() => {
        // fileManager.promptForFileDeletion is not typed in the public API but
        // is stable and used by Obsidian's own file explorer.
        (window.app as any).fileManager.promptForFileDeletion(file);
      })
  );

  // Fire "file-menu" so other plugins can append their own items.
  window.app.workspace.trigger(
    "file-menu",
    fileMenu,
    file,
    "calendar-context-menu",
    null
  );

  fileMenu.showAtPosition(position);
}
