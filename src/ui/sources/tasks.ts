import type { TFile } from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";

import type { ICalendarSource, IDot, IEvaluatedMetadata } from "../../types";

export async function getNumberOfRemainingTasks(note: TFile): Promise<number> {
  if (!note) {
    return 0;
  }
  const { vault } = (window as any).app;
  const fileContents = await vault.cachedRead(note);
  return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
}

export async function getDotsForNote(note: TFile | null): Promise<IDot[]> {
  if (!note) {
    return [];
  }
  const numTasks = await getNumberOfRemainingTasks(note);
  const dots: IDot[] = [];
  if (numTasks) {
    dots.push({
      className: "task",
      color: "default",
      isFilled: false,
    });
  }
  return dots;
}

export const tasksSource: ICalendarSource = {
  id: "tasks",
  name: "Tasks",
  description: "Dots representing incomplete tasks in your notes",
  defaultSettings: {
    display: "calendar-and-menu",
    color: "default",
    order: 1,
  },

  getMetadata: async (
    _granularity: IGranularity,
    _date: unknown,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const dots = await getDotsForNote(file);
    return { dots };
  },
};
