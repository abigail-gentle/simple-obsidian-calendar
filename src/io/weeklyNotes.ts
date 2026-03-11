import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  createWeeklyNote,
  getWeeklyNoteSettings,
} from "src/periodicNotes";

import type { ISettings } from "../settings";
import { applyTemplate } from "./template";
import { createConfirmationDialog } from "../ui/modal";

/**
 * Create a Weekly Note for a given date.
 */
export async function tryToCreateWeeklyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (file: TFile) => void
): Promise<void> {
  const { workspace } = (window as any).app;
  const { format, template: templatePath } = getWeeklyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const weeklyNote = await createWeeklyNote(date);
    const leaf = inNewSplit
      ? workspace.getLeaf("split")
      : workspace.getLeaf(false);

    await leaf.openFile(weeklyNote, { active: true });

    if (settings.templateEngine === "templater" && templatePath) {
      await applyTemplate("templater", templatePath, weeklyNote);
    }

    cb?.(weeklyNote);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Weekly Note",
    });
  } else {
    await createFile();
  }
}
