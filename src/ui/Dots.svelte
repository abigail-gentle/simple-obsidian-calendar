<!-- Row of decoration dots for a single calendar cell.
     Renders at most MAX_DOTS_PER_SOURCE dots per source, sorted by source order,
     and only for sources whose display setting includes "calendar-and-menu".

     Ported from obsidian-calendar-ui/src/components/Dots.svelte with one change:
       CHANGED: import path "src/types" → "../types" (flat single-repo layout). -->

<script lang="ts">
  import type { IDayMetadata } from "../types";
  import Dot from "./Dot.svelte";

  /** Resolved metadata array from MetadataResolver, or null while loading. */
  export let metadata: IDayMetadata[];
  /** Whether to centre the dot row horizontally (default true). */
  export let centered: boolean = true;

  // Maximum dots shown per source — prevents a source from overwhelming the cell.
  const MAX_DOTS_PER_SOURCE = 5;

  // Sort sources by their configured order so the display is deterministic.
  let sortedMeta: IDayMetadata[];
  $: sortedMeta = metadata && [...metadata].sort((a, b) => a.order - b.order);
</script>

<div class="dot-container" class:centered>
  {#if metadata}
    {#each sortedMeta as { color, display, dots = [] }}
      <!-- Only render dots for sources configured to appear on the calendar face. -->
      {#if display === "calendar-and-menu"}
        {#each dots.slice(0, MAX_DOTS_PER_SOURCE) as dot}
          <Dot {...dot} {color} />
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
