import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  createDailyNote,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "../settings";
import { applyTemplate } from "./template";
import { createConfirmationDialog } from "../ui/modal";

/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreateDailyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace } = (window as any).app;
  const { format, template: templatePath } = getDailyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const dailyNote = await createDailyNote(date);
    const leaf = inNewSplit
      ? workspace.getLeaf("split")
      : workspace.getLeaf(false);

    await leaf.openFile(dailyNote, { active: true });

    if (settings.templateEngine === "templater" && templatePath) {
      await applyTemplate("templater", templatePath, dailyNote);
    }

    cb?.(dailyNote);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  } else {
    await createFile();
  }
}
