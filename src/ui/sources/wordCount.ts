import type { TFile } from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { DEFAULT_WORDS_PER_DOT } from "../../constants";
import type { ICalendarSource, IDot, IEvaluatedMetadata } from "../../types";
import { settings } from "../stores";
import { clamp, getWordCount } from "../utils";

const NUM_MAX_DOTS = 5;

export async function getWordLengthAsDots(note: TFile): Promise<number> {
  const { wordsPerDot = DEFAULT_WORDS_PER_DOT } = get(settings);
  if (!note || wordsPerDot <= 0) {
    return 0;
  }
  const fileContents = await (window as any).app.vault.cachedRead(note);
  const wordCount = getWordCount(fileContents);
  const numDots = wordCount / wordsPerDot;
  return clamp(Math.floor(numDots), 1, NUM_MAX_DOTS);
}

export async function getDotsForNote(note: TFile | null): Promise<IDot[]> {
  if (!note) {
    return [];
  }
  const numSolidDots = await getWordLengthAsDots(note);
  const dots: IDot[] = [];
  for (let i = 0; i < numSolidDots; i++) {
    dots.push({
      color: "default",
      isFilled: true,
    });
  }
  return dots;
}

export const wordCountSource: ICalendarSource = {
  id: "word-count",
  name: "Word count",
  description: "Dots representing the word count of your notes",
  defaultSettings: {
    display: "calendar-and-menu",
    color: "default",
    order: 0,
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
