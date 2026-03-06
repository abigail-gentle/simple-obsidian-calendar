<!-- Individual day cell in the calendar grid.
     Handles click (open/create note), Cmd/Ctrl+click (open in split), hover
     (tooltip pipeline + Obsidian link-hover preview), right-click (file menu),
     and native drag-and-drop via the PeriodicNotesCache drag manager.

     Ported from obsidian-calendar-ui/src/components/Day.svelte with one change:
       CHANGED: all import paths updated from the old library layout to local src/ui/. -->

<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  // CHANGED: IGranularity is a type — must use import type when verbatimModuleSyntax is on.
  import { getDateUID } from "obsidian-daily-notes-interface";
  import type { IGranularity } from "obsidian-daily-notes-interface";
  import { createEventDispatcher, getContext } from "svelte";
  import type { Writable } from "svelte/store";

  import Dots from "./Dots.svelte";
  import MetadataResolver from "./MetadataResolver.svelte";
  import { DISPLAYED_MONTH, IS_MOBILE } from "./context";
  import type PeriodicNotesCache from "../ui/fileStore";
  import type { IDayMetadata, IHTMLAttributes, ISourceSettings } from "../types";
  import { isMetaPressed } from "./utils";

  /** The moment date this cell represents. */
  export let date: Moment;
  /** The shared periodic-notes file cache. */
  export let fileCache: PeriodicNotesCache;
  /** Returns per-source display settings keyed by source id. */
  export let getSourceSettings: (sourceId: string) => ISourceSettings;

  // CHANGED: All three handlers are optional (undefined by default) because they are
  // spread from the parent's eventHandlers record and svelte-check cannot verify that
  // the spread satisfies required props. The handlers are called with `?.` so the
  // runtime is safe when they are absent.
  // CHANGED: file parameters are TFile | null — cells without a note still fire events.
  /** Called on hover (for Obsidian link-preview and tooltip). */
  export let onHover: ((
    periodicity: IGranularity,
    date: Moment,
    file: TFile | null,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ) => boolean) | undefined = undefined;
  /** Called on click (opens or creates the daily note). */
  export let onClick: ((
    granularity: IGranularity,
    date: Moment,
    existingFile: TFile | null,
    inNewSplit: boolean
  ) => boolean) | undefined = undefined;
  /** Called on right-click (shows file menu). */
  export let onContextMenu: ((
    granularity: IGranularity,
    date: Moment,
    file: TFile | null,
    event: MouseEvent
  ) => boolean) | undefined = undefined;

  /** Today's date — used for the "today" CSS class. */
  export let today: Moment;
  /** The dateUID of the currently active (open) note. */
  // CHANGED: string | null (was `string = null` — null is not assignable to string under strict).
  export let selectedId: string | null = null;

  const isMobile = getContext<boolean>(IS_MOBILE);
  const displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);
  const dispatch = createEventDispatcher();

  let file: TFile | null;
  let metadata: Promise<IDayMetadata[]> | null;

  // Re-evaluate file and metadata whenever the cache store changes.
  fileCache.store.subscribe(() => {
    file = fileCache.getFile(date, "day");
    metadata = fileCache.getEvaluatedMetadata("day", date, getSourceSettings);
  });

  // CHANGED: meta params typed as IDayMetadata[] | null — MetadataResolver slots null
  // while the promise is pending, so all handlers must tolerate a null metadata array.
  function handleClick(event: MouseEvent, meta: IDayMetadata[] | null) {
    onClick?.("day", date, file, isMetaPressed(event));
    // On mobile there is no hover event, so clicking also fires the tooltip.
    if (isMobile) {
      dispatch("hoverDay", { date, metadata: meta, target: event.target });
    }
  }

  function handleHover(event: PointerEvent, meta: IDayMetadata[] | null) {
    // CHANGED: event.target is EventTarget | null — non-null assertion is safe here
    // because pointerenter only fires on actual elements.
    onHover?.("day", date, file, event.target!, isMetaPressed(event));
    // Bubble to Calendar.svelte so the tooltip timer can start.
    dispatch("hoverDay", { date, metadata: meta, target: event.target });
  }

  function endHover(event: MouseEvent) {
    dispatch("endHoverDay", { target: event.target });
  }

  function handleContextmenu(event: MouseEvent) {
    onContextMenu?.("day", date, file, event);
    endHover(event);
  }

  /**
   * Collect extra HTML attributes from metadata sources that set `attrs`.
   * Only sources with display:"calendar-and-menu" contribute attributes.
   */
  function getAttributes(meta: IDayMetadata[] | null): IHTMLAttributes {
    if (!meta) return {};
    return meta
      .filter((m) => m.display === "calendar-and-menu")
      .reduce((acc, m) => ({ ...acc, ...m.attrs }), {});
  }
</script>

<td>
  <MetadataResolver {metadata} let:metadata>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="day"
      class:active={selectedId === getDateUID(date, "day")}
      class:adjacent-month={!date.isSame($displayedMonth, "month")}
      class:has-note={!!file}
      class:today={date.isSame(today, "day")}
      draggable={true}
      {...getAttributes(metadata)}
      on:click={(event) => handleClick(event, metadata)}
      on:contextmenu={handleContextmenu}
      on:pointerenter={(event) => handleHover(event, metadata)}
      on:pointerleave={endHover}
      on:dragstart={(event) => fileCache.onDragStart(event, file)}
    >
      {date.format("D")}
      <Dots {metadata} isActive={selectedId === getDateUID(date, "day")} />
    </div>
  </MetadataResolver>
</td>

<style>
  .day {
    background-color: var(--color-background-day);
    border-radius: 4px;
    color: var(--color-text-day);
    cursor: pointer;
    font-size: 0.8em;
    height: 100%;
    padding: 4px;
    position: relative;
    text-align: center;
    transition: background-color 0.1s ease-in, color 0.1s ease-in;
    vertical-align: baseline;
  }

  .day:hover {
    background-color: var(--interactive-hover);
  }

  .day.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  /* Days outside the displayed month are shown at reduced opacity. */
  .adjacent-month {
    opacity: 0.25;
  }

  .today {
    color: var(--color-text-today);
  }

  .day:active,
  .active,
  .active.today {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
  }
</style>
