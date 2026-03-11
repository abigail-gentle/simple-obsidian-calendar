/**
 * Shared type definitions for simple-obsidian-calendar.
 * Ported from obsidian-calendar-ui/src/types.ts with additions for
 * the merged single-repo architecture.
 */

import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { IGranularity } from "src/periodicNotes";

export interface IDot {
  isFilled: boolean;
  color?: string;
  className?: string;
}

export interface IWeek {
  days: Moment[];
  weekNum: number;
}

export type IMonth = IWeek[];

export type IHTMLAttributes = Record<string, string | number | boolean>;

export interface IEvaluatedMetadata {
  value?: number | string;
  goal?: number;
  dots: IDot[];
  classes?: string[];
  dataAttributes?: Record<string, string>;
  attrs?: IHTMLAttributes;
}

export type ISourceDisplayOption = "calendar-and-menu" | "menu" | "none";

export interface ISourceSettings {
  color: string;
  display: ISourceDisplayOption;
  order: number;
}

export interface IDayMetadata
  extends ICalendarSource,
    ISourceSettings,
    IEvaluatedMetadata {}

export interface ICalendarSource {
  id: string;
  name: string;
  description?: string;

  getMetadata?: (
    granularity: IGranularity,
    date: Moment,
    file: TFile
  ) => Promise<IEvaluatedMetadata>;

  defaultSettings: Record<string, string | number>;
  registerSettings?: (
    containerEl: HTMLElement,
    settings: ISourceSettings,
    saveSettings: (settings: Partial<ISourceSettings>) => void
  ) => void;
}
