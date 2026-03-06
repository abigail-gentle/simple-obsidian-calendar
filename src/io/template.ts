/**
 * Template engine integration for note creation.
 * New file — does not exist in either source repo.
 *
 * Supports two engines:
 *   - "obsidian": uses Obsidian's built-in Templates core plugin (no-op here,
 *     Obsidian handles it automatically on note creation via the template path
 *     stored in the daily/weekly note settings).
 *   - "templater": calls the Templater community plugin's write_template_to_file
 *     API after the note is created.
 *
 * Templater plugin ID is "templater-obsidian" (not "templater").
 */

import type { TFile } from "obsidian";
import type { ITemplateEngine } from "src/settings";

/**
 * Returns true when the Templater community plugin is installed and available.
 */
export function templaterIsAvailable(): boolean {
  try {
    // `plugins` is not on the public App type — access via `any`.
    return !!(window.app as any)?.plugins?.plugins?.["templater-obsidian"];
  } catch {
    return false;
  }
}

/**
 * Apply a template to a newly created note.
 *
 * @param engine       Which template engine to use.
 * @param templatePath Vault path to the template file (may be empty string).
 * @param targetFile   The TFile that was just created.
 */
export async function applyTemplate(
  engine: ITemplateEngine,
  templatePath: string,
  targetFile: TFile
): Promise<void> {
  if (engine !== "templater") {
    // Obsidian built-in templates are applied automatically by the daily-notes
    // interface; nothing to do here.
    return;
  }

  if (!templatePath) {
    return;
  }

  if (!templaterIsAvailable()) {
    return;
  }

  const templateFile = window.app.vault.getAbstractFileByPath(templatePath);
  if (!templateFile) {
    console.warn(
      `[Calendar] Templater template not found at path: ${templatePath}`
    );
    return;
  }

  // Call the Templater API to overwrite the target file with the rendered template.
  // `plugins` is not on the public App type — access via `any`.
  const templater = (window.app as any).plugins.plugins["templater-obsidian"] as any;
  await templater.templater.write_template_to_file(templateFile, targetFile);
}
