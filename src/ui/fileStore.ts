import type { Moment } from "moment";
import type { Plugin, TAbstractFile, TFile } from "obsidian";
import {
  getAllDailyNotes,
  getAllWeeklyNotes,
  getDateFromFile,
  getDateFromPath,
  getDateUID,
} from "src/periodicNotes";
import type { IGranularity } from "src/periodicNotes";
import { get, writable } from "svelte/store";
import type { Writable } from "svelte/store";

import type {
  ICalendarSource,
  IDayMetadata,
  ISourceSettings,
} from "../types";

type PeriodicNoteID = string;

export function getDateUIDFromFile(file: TFile | null): string | null {
  if (!file) {
    return null;
  }
  for (const granularity of ["day", "week", "month"] as IGranularity[]) {
    const date = getDateFromFile(file, granularity);
    if (date) {
      return getDateUID(date, granularity);
    }
  }
  return null;
}

export function getDateUIDFromPath(path: string | null): string | null {
  if (!path) {
    return null;
  }
  for (const granularity of ["day", "week", "month"] as IGranularity[]) {
    const date = getDateFromPath(path, granularity);
    if (date) {
      return getDateUID(date, granularity);
    }
  }
  return null;
}

export default class NoteCache {
  private app: Plugin["app"];
  public store: Writable<Record<PeriodicNoteID, TFile>>;
  private sources: ICalendarSource[];

  constructor(plugin: Plugin, sources: ICalendarSource[]) {
    this.app = plugin.app;
    this.sources = sources;
    this.store = writable<Record<PeriodicNoteID, TFile>>({});

    plugin.app.workspace.onLayoutReady(() => {
      const { vault } = this.app;
      plugin.registerEvent(vault.on("create", this.onFileCreated, this));
      plugin.registerEvent(vault.on("delete", this.onFileDeleted, this));
      plugin.registerEvent(vault.on("rename", this.onFileRenamed, this));
      plugin.registerEvent(vault.on("modify", this.onFileModified, this));
      this.initialize();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace = this.app.workspace as any;
    plugin.registerEvent(
      workspace.on("calendar:metadata-updated", this.initialize, this)
    );
  }

  public onFileCreated(file: TAbstractFile): void {
    if ((file as TFile).extension === "md") {
      const uid = getDateUIDFromFile(file as TFile);
      if (uid) {
        this.store.update((notes) => ({ ...notes, [uid]: file as TFile }));
      }
    }
  }

  public onFileDeleted(file: TAbstractFile): void {
    if ((file as TFile).extension === "md") {
      const uid = getDateUIDFromFile(file as TFile);
      if (uid) {
        this.store.update((notes) => {
          const updated = { ...notes };
          delete updated[uid];
          return updated;
        });
      }
    }
  }

  public onFileModified(file: TAbstractFile): void {
    if ((file as TFile).extension === "md") {
      const uid = getDateUIDFromFile(file as TFile);
      if (uid) {
        this.store.update((notes) => ({ ...notes, [uid]: file as TFile }));
      }
    }
  }

  public onFileRenamed(file: TAbstractFile, oldPath: string): void {
    const uid = getDateUIDFromPath(oldPath);
    if (uid) {
      this.store.update((notes) => {
        const updated = { ...notes };
        delete updated[uid];
        return updated;
      });
    }
    this.onFileCreated(file);
  }

  /**
   * Load any necessary state asynchronously
   */
  public initialize(): void {
    this.store.set({
      ...getAllDailyNotes(),
      ...getAllWeeklyNotes(),
    });
  }

  public getFile(date: Moment, granularity: IGranularity): TFile | null {
    const uid = getDateUID(date, granularity);
    return get(this.store)[uid] ?? null;
  }

  public getFileForPeriodicNote(id: PeriodicNoteID): TFile | null {
    return get(this.store)[id] ?? null;
  }

  public async getEvaluatedMetadata(
    granularity: IGranularity,
    date: Moment,
    getSourceSettings: (sourceId: string) => ISourceSettings
  ): Promise<IDayMetadata[]> {
    const uid = getDateUID(date, granularity);
    const file = this.getFileForPeriodicNote(uid);

    const metadata: IDayMetadata[] = [];
    for (const source of this.sources) {
      try {
        const evaluatedMetadata =
          (await source.getMetadata?.(granularity, date, file as TFile)) || { dots: [] };
        const sourceSettings = getSourceSettings(source.id);

        metadata.push({
          ...evaluatedMetadata,
          ...source,
          ...sourceSettings,
        } as IDayMetadata);
      } catch (err) {
        console.warn(`[Calendar] Source "${source.id}" threw while fetching metadata`, err);
        const sourceSettings = getSourceSettings(source.id);
        metadata.push({
          dots: [],
          ...source,
          ...sourceSettings,
        } as IDayMetadata);
      }
    }
    return metadata;
  }

  // CHANGED: file is TFile | null because cells without a note still fire drag events.
  // When file is null we bail out early — there is nothing to drag.
  public onDragStart(event: DragEvent, file: TFile | null): void {
    if (!file) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dragManager = (this.app as any).dragManager;
    const dragData = dragManager.dragFile(event, file);
    dragManager.onDragStart(event, dragData);
  }
}
