<!-- Month/year title shown in the Nav bar.
     Clicking the title always resets the displayed month to today.
     Optionally shows decoration dots if monthly notes exist in the cache.

     Ported from obsidian-calendar-ui/src/components/Month.svelte with these changes:
       CHANGED: Removed the `appHasMonthlyNotesPluginLoaded()` branch entirely.
         The original component conditionally opened/created a monthly note when
         the Periodic Notes plugin was active. This fork drops Periodic Notes, so
         clicking the month title always calls `resetDisplayedMonth()`.
       CHANGED: `onHover`, `onClick`, `onContextMenu` props removed — they are only
         needed for the monthly-note branch which no longer exists. The title div is
         still draggable and fires the cache's drag manager for consistency.
       CHANGED: All import paths updated to local src/ui/. -->

<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  import { DISPLAYED_MONTH } from "./context";
  import Dots from "./Dots.svelte";
  import MetadataResolver from "./MetadataResolver.svelte";
  import type NoteCache from "../ui/fileStore";
  import type { IDayMetadata, ISourceSettings } from "../types";

  /** The shared note file cache. */
  export let fileCache: NoteCache;
  /** Returns per-source display settings keyed by source id. */
  export let getSourceSettings: (sourceId: string) => ISourceSettings;
  /**
   * Resets the displayed month to today. Passed down from Nav.svelte.
   * CHANGED: this is now the *only* click action — the monthly-note branch
   * from the original has been removed since we do not support Periodic Notes.
   */
  export let resetDisplayedMonth: () => void;

  const displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);

  let file: TFile | null;
  let metadata: Promise<IDayMetadata[]> | null;

  /** Refresh file reference and metadata promise on every cache update. */
  function refreshMetadata() {
    file = fileCache.getFile($displayedMonth, "month");
    metadata = fileCache.getEvaluatedMetadata(
      "month",
      $displayedMonth,
      getSourceSettings
    );
  }

  // Re-run whenever the cache changes or the displayed month changes.
  fileCache.store.subscribe(refreshMetadata);
  displayedMonth.subscribe(refreshMetadata);
</script>

<MetadataResolver {metadata} let:metadata>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    draggable={true}
    on:click={resetDisplayedMonth}
    on:dragstart={(event) => fileCache.onDragStart(event, file)}
  >
    <span class="title">
      <span class="month">{$displayedMonth.format("MMM")}</span>
      <span class="year">{$displayedMonth.format("YYYY")}</span>
    </span>
    {#if metadata}
      <!-- Show dots for monthly notes if any sources provide them. -->
      <Dots {metadata} centered={false} />
    {/if}
  </div>
</MetadataResolver>

<style>
  .title {
    color: var(--color-text-title);
    cursor: pointer;
    display: flex;
    font-size: 1.4em;
    gap: 0.3em;
    margin: 0;
  }

  .month {
    font-weight: 500;
  }

  .year {
    color: var(--interactive-accent);
  }
</style>
