import type { TFile } from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";

import type { ICalendarSource, IEvaluatedMetadata } from "../../types";
import { classList } from "../utils";

const getStreakClasses = (file: TFile | null): string[] => {
  return classList({
    "has-note": !!file,
  });
};

export const streakSource: ICalendarSource = {
  id: "streak",
  name: "Streak",
  description: "Highlight days and weeks that have a note",
  defaultSettings: {
    display: "calendar-and-menu",
    color: "default",
    order: 3,
  },

  getMetadata: async (
    _granularity: IGranularity,
    _date: unknown,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    return {
      classes: getStreakClasses(file),
      dots: [],
    };
  },
};
