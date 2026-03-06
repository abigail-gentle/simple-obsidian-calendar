<!-- Week-number cell rendered in the leftmost column when showWeekNums is true.
     Clicking opens/creates the weekly note for that week; right-click shows the
     file context menu; hover fires the tooltip pipeline.

     Ported from obsidian-calendar-ui/src/components/WeekNum.svelte with one change:
       CHANGED: all import paths updated from the old library layout to local src/ui/. -->

<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  // CHANGED: IGranularity is a type — must use import type when verbatimModuleSyntax is on.
  import { getDateUID } from "obsidian-daily-notes-interface";
  import type { IGranularity } from "obsidian-daily-notes-interface";
  import { createEventDispatcher } from "svelte";

  import Dots from "./Dots.svelte";
  import MetadataResolver from "./MetadataResolver.svelte";
  import type PeriodicNotesCache from "../ui/fileStore";
  import type { IDayMetadata, ISourceSettings } from "../types";
  import { getStartOfWeek, isMetaPressed } from "./utils";

  /** The ISO week number displayed in this cell. */
  export let weekNum: number;
  /** All seven days of this week (used to look up the note file). */
  export let days: Moment[];
  /** Returns per-source display settings keyed by source id. */
  export let getSourceSettings: (sourceId: string) => ISourceSettings;

  // CHANGED: All three handlers are optional — they are spread from the parent's
  // eventHandlers record and svelte-check cannot verify that the spread satisfies
  // required props. Called with `?.` so runtime is safe when absent.
  // CHANGED: file parameters are TFile | null — week cells without a note still fire events.
  /** Called when the user hovers the week cell. */
  export let onHover: ((
    periodicity: IGranularity,
    date: Moment,
    file: TFile | null,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ) => boolean) | undefined = undefined;
  /** Called when the user clicks the week cell. */
  export let onClick: ((
    granularity: IGranularity,
    date: Moment,
    existingFile: TFile | null,
    inNewSplit: boolean
  ) => boolean) | undefined = undefined;
  /** Called on right-click. */
  export let onContextMenu: ((
    granularity: IGranularity,
    date: Moment,
    file: TFile | null,
    event: MouseEvent
  ) => boolean) | undefined = undefined;
  /** The shared periodic-notes file cache. */
  export let fileCache: PeriodicNotesCache;
  /** The dateUID of the currently active (open) note. */
  // CHANGED: string | null (was `string = null` — null is not assignable to string under strict).
  export let selectedId: string | null = null;

  let file: TFile | null;
  let startOfWeek: Moment;
  let metadata: Promise<IDayMetadata[]> | null;

  // startOfWeek is the canonical date used for note lookup and event dispatch.
  $: startOfWeek = getStartOfWeek(days);

  // Re-evaluate the file and metadata whenever the cache store updates.
  fileCache.store.subscribe(() => {
    file = fileCache.getFile(days[0], "week");
    metadata = fileCache.getEvaluatedMetadata("week", days[0], getSourceSettings);
  });

  const dispatch = createEventDispatcher();

  // CHANGED: meta typed as IDayMetadata[] | null — MetadataResolver slots null while pending.
  function handleHover(event: PointerEvent, meta: IDayMetadata[] | null) {
    // CHANGED: event.target is EventTarget | null — non-null assertion is safe here
    // because pointerenter only fires on actual elements.
    onHover?.("week", days[0], file, event.target!, isMetaPressed(event));
    // Bubble to Calendar.svelte so the tooltip pipeline can fire.
    dispatch("hoverDay", {
      date: days[0],
      metadata: meta,
      target: event.target,
    });
  }

  function endHover(event: PointerEvent) {
    dispatch("endHoverDay", { target: event.target });
  }
</script>

<td>
  <MetadataResolver {metadata} let:metadata>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="week-num"
      class:active={selectedId === getDateUID(days[0], "week")}
      draggable={true}
      on:click={onClick &&
        ((e) => onClick("week", startOfWeek, file, isMetaPressed(e)))}
      on:contextmenu={onContextMenu &&
        ((e) => onContextMenu("week", days[0], file, e))}
      on:dragstart={(event) => fileCache.onDragStart(event, file)}
      on:pointerenter={(event) => handleHover(event, metadata)}
      on:pointerleave={endHover}
    >
      {weekNum}
      <Dots {metadata} isActive={selectedId === getDateUID(days[0], "week")} />
    </div>
  </MetadataResolver>
</td>

<style>
  td {
    border-right: 1px solid var(--background-modifier-border);
  }

  .week-num {
    background-color: var(--color-background-weeknum);
    border-radius: 4px;
    color: var(--color-text-weeknum);
    cursor: pointer;
    font-size: 0.65em;
    height: 100%;
    padding: 4px;
    text-align: center;
    transition: background-color 0.1s ease-in, color 0.1s ease-in;
    vertical-align: baseline;
  }

  .week-num:hover {
    background-color: var(--interactive-hover);
  }

  .week-num.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  .active {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
  }
</style>
