<!-- Lightweight CSS-only hover tooltip showing metadata values for a calendar cell.
     This is a NEW component — there is no equivalent in the original obsidian-calendar-plugin.
     It replaces the heavy Popper.js + svelte-portal + Box/Popper/PopoverMenu stack from
     obsidian-calendar-ui, which required @popperjs/core, @popperjs/svelte, and svelte-portal.

     Design:
       - Absolutely positioned inside the calendar container (which must be position:relative).
       - Coordinates (x, y) are computed by Calendar.svelte from getBoundingClientRect()
         of the hovered cell relative to the container element.
       - Appears after a 500ms delay (managed by Calendar.svelte, not here).
       - Only visible when `visible` is true AND at least one metadata item has a value.
       - pointer-events:none so it cannot block clicks on underlying cells.
       - Styled using Obsidian CSS variables for automatic light/dark theme support.
       - The |global modifier on transition:fade is required in Svelte 4 when the
         element is conditionally mounted (not just toggled with display:none). -->

<script lang="ts">
  import { fade } from "svelte/transition";
  import type { IDayMetadata } from "../types";

  /** Resolved metadata array from the hovered cell. */
  export let metadata: IDayMetadata[] | null = null;
  /** Whether the tooltip should be visible. */
  export let visible: boolean = false;
  /** Left offset in px relative to the calendar container. */
  export let x: number = 0;
  /** Top offset in px relative to the calendar container. */
  export let y: number = 0;

  // Only show items that carry a numeric/string value — sources like streak and
  // tags add CSS classes or data attributes but no human-readable value.
  $: items = metadata?.filter((m) => m.value != null) ?? [];
</script>

{#if visible && items.length > 0}
  <!-- transition:fade|global — the |global modifier is required in Svelte 4 for
       transitions on elements that are added/removed from the DOM (not merely
       hidden), to prevent the "transition not triggered" warning. -->
  <div
    class="calendar-tooltip"
    style="left:{x}px;top:{y}px;"
    transition:fade|global={{ duration: 100 }}
  >
    {#each items as item}
      <div class="tooltip-row">
        <span class="tooltip-name">{item.name}</span>
        <span class="tooltip-value">{item.value}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .calendar-tooltip {
    background-color: var(--background-secondary);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-s);
    color: var(--text-normal);
    font-size: 0.8em;
    padding: 6px 10px;
    /* Must not intercept pointer events — the cell below should remain interactive. */
    pointer-events: none;
    position: absolute;
    white-space: nowrap;
    z-index: var(--layer-popover);
  }

  .tooltip-row {
    display: flex;
    gap: 0.75em;
    justify-content: space-between;
  }

  .tooltip-name {
    color: var(--text-muted);
  }

  .tooltip-value {
    font-weight: 500;
  }
</style>
