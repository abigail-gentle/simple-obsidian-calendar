<!-- Row of decoration dots for a single calendar cell.
     Renders at most MAX_DOTS_PER_SOURCE dots per source, sorted by source order,
     and only for sources whose display setting includes "calendar-and-menu".

     Ported from obsidian-calendar-ui/src/components/Dots.svelte with these changes:
       CHANGED: import path "src/types" → "../types" (flat single-repo layout).
       CHANGED: Added `isActive` prop so the correct active-state colour is forwarded
         to each Dot. Dot.svelte requires isActive but dot objects from the metadata
         sources do not carry it — it must be supplied by the parent. -->

<script lang="ts">
  import type { IDayMetadata } from "../types";
  import Dot from "./Dot.svelte";

  /** Resolved metadata array from MetadataResolver, or null while loading. */
  // CHANGED: IDayMetadata[] | null — MetadataResolver slots null while the promise is pending.
  export let metadata: IDayMetadata[] | null;
  /** Whether to centre the dot row horizontally (default true). */
  export let centered: boolean = true;
  /**
   * Whether the parent cell is currently active/selected.
   * CHANGED: forwarded to each Dot so the on-accent colour inversion works correctly.
   */
  export let isActive: boolean = false;

  // Maximum dots shown per source — prevents a source from overwhelming the cell.
  const MAX_DOTS_PER_SOURCE = 5;

  // Sort sources by their configured order so the display is deterministic.
  // CHANGED: IDayMetadata[] | null | false — the `&&` short-circuit when metadata is null
  // produces false/null, so the type must accommodate that.
  let sortedMeta: IDayMetadata[] | null;
  $: sortedMeta = metadata ? [...metadata].sort((a, b) => a.order - b.order) : null;
</script>

<div class="dot-container" class:centered>
  {#if sortedMeta}
    {#each sortedMeta as { color, display, dots = [] }}
      <!-- Only render dots for sources configured to appear on the calendar face. -->
      {#if display === "calendar-and-menu"}
        {#each dots.slice(0, MAX_DOTS_PER_SOURCE) as dot}
          <Dot {...dot} {color} {isActive} />
        {/each}
      {/if}
    {/each}
  {/if}
</div>

<style>
  .dot-container {
    display: flex;
    flex-wrap: wrap;
    line-height: 6px;
    min-height: 6px;
  }

  .centered {
    justify-content: center;
  }
</style>
