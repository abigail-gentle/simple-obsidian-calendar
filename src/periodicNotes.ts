/**
 * periodicNotes.ts — self-contained replacement for obsidian-daily-notes-interface.
 *
 * Reads settings exclusively from:
 *   - Obsidian's built-in Daily Notes core plugin  (for daily notes)
 *   - This plugin's own options object              (for weekly notes)
 *
 * No reference to the "periodic-notes" community plugin anywhere in this file.
 * That plugin's presence in the vault must never affect our settings, format
 * parsing, or vault scanning.
 */

import type { Moment } from "moment";
import { normalizePath, TFile, TFolder, Vault } from "obsidian";

import { DEFAULT_WEEK_FORMAT } from "src/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The note granularities this plugin supports.
 * Quarterly and yearly are intentionally omitted — we don't use them.
 */
export type IGranularity = "day" | "week" | "month";

export interface INoteSettings {
  format: string;
  folder: string;
  template: string;
}

// ── Settings readers ──────────────────────────────────────────────────────────

/**
 * Read the user settings for the Daily Notes *core* plugin.
 * Never touches the "periodic-notes" community plugin.
 */
export function getDailyNoteSettings(): INoteSettings {
  try {
    const { internalPlugins } = window.app as any;
    const { folder, format, template } =
      internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
    return {
      format: format || "YYYY-MM-DD",
      folder: folder?.trim() || "",
      template: template?.trim() || "",
    };
  } catch (err) {
    console.info("[Calendar] No daily note settings found.", err);
    return { format: "YYYY-MM-DD", folder: "", template: "" };
  }
}

/**
 * Read the weekly note settings from *this* plugin's own options.
 * Never touches the "periodic-notes" community plugin.
 */
export function getWeeklyNoteSettings(): INoteSettings {
  try {
    const pluginManager = (window.app as any).plugins;
    const options = pluginManager.getPlugin("calendar")?.options || {};
    return {
      format: options.weeklyNoteFormat || DEFAULT_WEEK_FORMAT,
      folder: options.weeklyNoteFolder?.trim() || "",
      template: options.weeklyNoteTemplate?.trim() || "",
    };
  } catch (err) {
    console.info("[Calendar] No weekly note settings found.", err);
    return { format: DEFAULT_WEEK_FORMAT, folder: "", template: "" };
  }
}

// ── UID generation ────────────────────────────────────────────────────────────

/**
 * Produce a stable string key for a given date and granularity.
 * Two dates that fall in the same week/day/month will produce the same UID.
 *
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
export function getDateUID(date: Moment, granularity: IGranularity = "day"): string {
  const ts = date.clone().startOf(granularity).format();
  return `${granularity}-${ts}`;
}

// ── Format helpers ────────────────────────────────────────────────────────────

/**
 * Strip escaped literal blocks (e.g. `[Week]`, `[W]`) from a format string
 * so that token-presence checks don't match characters inside brackets.
 *
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
export function removeEscapedCharacters(format: string): string {
  return format.replace(/\[[^\]]*\]/g, "");
}

/**
 * Returns true when the format contains both a week-number token and a
 * month or day token, which causes moment to ignore the week number.
 *
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
export function isFormatAmbiguous(
  format: string,
  granularity: IGranularity
): boolean {
  if (granularity === "week") {
    const cleanFormat = removeEscapedCharacters(format);
    return (
      /w{1,2}/i.test(cleanFormat) &&
      (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat))
    );
  }
  return false;
}

// ── Filename parsing ──────────────────────────────────────────────────────────

/**
 * Extract the bare filename (no directory, no extension) from a full vault path.
 *
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
function basename(fullPath: string): string {
  let base = fullPath.substring(fullPath.lastIndexOf("/") + 1);
  if (base.lastIndexOf(".") !== -1) {
    base = base.substring(0, base.lastIndexOf("."));
  }
  return base;
}

/**
 * Parse a bare filename into a Moment date using the format for the given
 * granularity.  Returns null if the filename does not match the format.
 *
 * Reads settings from getDailyNoteSettings() / getWeeklyNoteSettings() —
 * both of which read exclusively from our own plugin options.
 *
 * Core parsing logic copied from obsidian-daily-notes-interface; the only
 * change is that the settings lookup now goes through our own functions.
 */
export function getDateFromFilename(
  filename: string,
  granularity: IGranularity
): Moment | null {
  const getSettings: Record<IGranularity, () => INoteSettings> = {
    day: getDailyNoteSettings,
    week: getWeeklyNoteSettings,
    // month is not actively used for scanning but must be present for the type
    month: () => ({ format: "YYYY-MM", folder: "", template: "" }),
  };

  // The format may include a folder separator — take only the filename part.
  const format = getSettings[granularity]().format.split("/").pop() ?? "";
  const noteDate = window.moment(filename, format, true);

  if (!noteDate.isValid()) {
    return null;
  }

  // If the format mixes week-number tokens with month/day tokens, moment ignores
  // the week number. Strip month/day tokens and re-parse so week wins.
  // Copied verbatim from obsidian-daily-notes-interface.
  if (isFormatAmbiguous(format, granularity)) {
    if (granularity === "week") {
      const cleanFormat = removeEscapedCharacters(format);
      if (/w{1,2}/i.test(cleanFormat)) {
        return window.moment(
          filename,
          format.replace(/M{1,4}/g, "").replace(/D{1,4}/g, ""),
          false
        );
      }
    }
  }

  return noteDate;
}

/**
 * Extract a Moment date from a TFile by parsing its basename.
 */
export function getDateFromFile(
  file: TFile,
  granularity: IGranularity
): Moment | null {
  return getDateFromFilename(file.basename, granularity);
}

/**
 * Extract a Moment date from a vault path string by parsing the basename.
 */
export function getDateFromPath(
  path: string,
  granularity: IGranularity
): Moment | null {
  return getDateFromFilename(basename(path), granularity);
}

// ── Vault scanning ────────────────────────────────────────────────────────────

class NotesFolderMissingError extends Error {}

/**
 * Generic vault scanner.  Finds all notes in the configured folder whose
 * basename matches the format for the given granularity.
 *
 * Returns an empty map (rather than throwing) when no folder is configured,
 * so callers don't need to guard against missing-folder errors.
 */
function getAllNotes(granularity: IGranularity): Record<string, TFile> {
  const { vault } = window.app;
  const getSettings: Record<IGranularity, () => INoteSettings> = {
    day: getDailyNoteSettings,
    week: getWeeklyNoteSettings,
    month: () => ({ format: "YYYY-MM", folder: "", template: "" }),
  };

  const { folder } = getSettings[granularity]();

  // No folder configured — nothing to scan.
  if (!folder && folder !== "") {
    return {};
  }

  const folderPath = normalizePath(folder || "/");
  const notesFolder = vault.getAbstractFileByPath(folderPath);

  if (!notesFolder) {
    throw new NotesFolderMissingError(
      `[Calendar] Could not find ${granularity} notes folder: "${folderPath}"`
    );
  }

  const notes: Record<string, TFile> = {};
  Vault.recurseChildren(notesFolder as TFolder, (note) => {
    if (note instanceof TFile) {
      const date = getDateFromFile(note, granularity);
      if (date) {
        const uid = getDateUID(date, granularity);
        notes[uid] = note;
      }
    }
  });

  return notes;
}

/**
 * Return a map of all daily notes in the vault, keyed by dateUID.
 */
export function getAllDailyNotes(): Record<string, TFile> {
  return getAllNotes("day");
}

/**
 * Return a map of all weekly notes in the vault, keyed by dateUID.
 * Reads folder/format exclusively from this plugin's own options.
 */
export function getAllWeeklyNotes(): Record<string, TFile> {
  return getAllNotes("week");
}

// ── Map lookups ───────────────────────────────────────────────────────────────

/**
 * Look up an existing daily note in a pre-built map.
 */
export function getDailyNote(
  date: Moment,
  dailyNotes: Record<string, TFile>
): TFile | null {
  return dailyNotes[getDateUID(date, "day")] ?? null;
}

/**
 * Look up an existing weekly note in a pre-built map.
 */
export function getWeeklyNote(
  date: Moment,
  weeklyNotes: Record<string, TFile>
): TFile | null {
  return weeklyNotes[getDateUID(date, "week")] ?? null;
}

// ── File creation helpers ─────────────────────────────────────────────────────

/**
 * Path joining utility.
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
function join(...partSegments: string[]): string {
  let parts: string[] = [];
  for (const segment of partSegments) {
    parts = parts.concat(segment.split("/"));
  }
  const newParts: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    newParts.push(part);
  }
  if (parts[0] === "") newParts.unshift("");
  return newParts.join("/");
}

/**
 * Create any intermediate folders required for the given file path.
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
async function ensureFolderExists(path: string): Promise<void> {
  const dirs = path.replace(/\\/g, "/").split("/");
  dirs.pop(); // remove filename
  if (dirs.length) {
    const dir = join(...dirs);
    if (!window.app.vault.getAbstractFileByPath(dir)) {
      await window.app.vault.createFolder(dir);
    }
  }
}

/**
 * Build the full normalised vault path for a new note, creating intermediate
 * folders as needed.
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
async function getNotePath(directory: string, filename: string): Promise<string> {
  if (!filename.endsWith(".md")) {
    filename += ".md";
  }
  const path = normalizePath(join(directory, filename));
  await ensureFolderExists(path);
  return path;
}

/**
 * Read the template file contents from the vault.
 * Returns an empty string when no template is configured.
 * Copied from obsidian-daily-notes-interface — logic is unchanged.
 */
async function getTemplateContents(templatePath: string): Promise<string> {
  const { metadataCache, vault } = window.app;
  const normalised = normalizePath(templatePath);
  if (normalised === "/") return "";
  try {
    const templateFile = metadataCache.getFirstLinkpathDest(normalised, "");
    if (!templateFile) return "";
    return await vault.cachedRead(templateFile);
  } catch (err) {
    console.error(`[Calendar] Failed to read template "${templatePath}"`, err);
    return "";
  }
}

// ── Note creation ─────────────────────────────────────────────────────────────

/**
 * Create a new daily note for the given date.
 *
 * Applies the built-in template substitutions that users expect
 * ({{date}}, {{title}}, {{time}}, {{yesterday}}, {{tomorrow}}, {{date:…}}).
 *
 * Note: foldManager.save() from the original library is intentionally omitted —
 * it is an undocumented internal Obsidian API. Templater integration is handled
 * separately via applyTemplate() in src/io/template.ts.
 */
export async function createDailyNote(date: Moment): Promise<TFile> {
  const { vault } = window.app;
  const { format, folder, template: templatePath } = getDailyNoteSettings();
  const templateContents = await getTemplateContents(templatePath);
  const filename = date.format(format);
  const normalizedPath = await getNotePath(folder, filename);

  try {
    const contents = templateContents
      .replace(/{{\s*date\s*}}/gi, filename)
      .replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"))
      .replace(/{{\s*title\s*}}/gi, filename)
      .replace(
        /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
        (_, _type, calc, timeDelta, unit, momentFormat) => {
          const now = window.moment();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second"),
          });
          if (calc) currentDate.add(parseInt(timeDelta, 10), unit);
          if (momentFormat) return currentDate.format(momentFormat.substring(1).trim());
          return currentDate.format(format);
        }
      )
      .replace(/{{\s*yesterday\s*}}/gi, date.clone().subtract(1, "day").format(format))
      .replace(/{{\s*tomorrow\s*}}/gi, date.clone().add(1, "day").format(format));

    return await vault.create(normalizedPath, contents);
  } catch (err) {
    console.error(`[Calendar] Failed to create daily note: "${normalizedPath}"`, err);
    throw err;
  }
}

/**
 * Create a new weekly note for the given date.
 *
 * Applies the standard weekly template substitutions:
 *   {{title}}, {{time}}, {{date:…}}, and the weekday shorthand
 *   {{sunday:format}}, {{monday:format}}, etc.
 *
 * Note: foldManager.save() from the original library is intentionally omitted.
 */
export async function createWeeklyNote(date: Moment): Promise<TFile> {
  const { vault } = window.app;
  const { format, folder, template: templatePath } = getWeeklyNoteSettings();
  const templateContents = await getTemplateContents(templatePath);
  const filename = date.format(format);
  const normalizedPath = await getNotePath(folder, filename);

  // Weekday name → 0-based index within the locale's week, for {{sunday:…}} etc.
  const weekdayNames = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
  ];
  function weekdayIndex(name: string): number {
    return weekdayNames.indexOf(name.toLowerCase());
  }

  try {
    const contents = templateContents
      .replace(
        /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
        (_, _type, calc, timeDelta, unit, momentFormat) => {
          const now = window.moment();
          const currentDate = date.clone().set({
            hour: now.get("hour"),
            minute: now.get("minute"),
            second: now.get("second"),
          });
          if (calc) currentDate.add(parseInt(timeDelta, 10), unit);
          if (momentFormat) return currentDate.format(momentFormat.substring(1).trim());
          return currentDate.format(format);
        }
      )
      .replace(/{{\s*title\s*}}/gi, filename)
      .replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"))
      .replace(
        /{{\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*:(.*?)}}/gi,
        (_, dayOfWeek, momentFormat) => {
          return date.weekday(weekdayIndex(dayOfWeek)).format(momentFormat.trim());
        }
      );

    return await vault.create(normalizedPath, contents);
  } catch (err) {
    console.error(`[Calendar] Failed to create weekly note: "${normalizedPath}"`, err);
    throw err;
  }
}

// ── Plugin availability checks ────────────────────────────────────────────────

/**
 * Returns true when the Daily Notes *core* plugin is enabled.
 * Does not check the "periodic-notes" community plugin.
 */
export function appHasDailyNotesPluginLoaded(): boolean {
  const { internalPlugins } = window.app as any;
  const dailyNotesPlugin = internalPlugins?.plugins?.["daily-notes"];
  return !!(dailyNotesPlugin && dailyNotesPlugin.enabled);
}
