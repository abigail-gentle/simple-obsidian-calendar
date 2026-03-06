<!-- Async slot wrapper that resolves a Promise<IDayMetadata[]> and passes the result
     to its slot. Renders the slot with `null` while the promise is pending so the
     caller can display a loading/empty state without any extra logic.

     Ported from obsidian-calendar-ui/src/components/MetadataResolver.svelte with one change:
       CHANGED: import path "../types" (was correct in original; kept as-is). -->

<svelte:options immutable />

<script lang="ts">
  import type { IDayMetadata } from "../types";

  /**
   * The metadata promise to resolve.
   * Passing `null` skips the await entirely and slots with `null` immediately.
   */
  export let metadata: Promise<IDayMetadata[]> | null;
</script>

{#if metadata}
  {#await metadata}
    <!-- Still loading — slot with null so callers can render a skeleton/empty state. -->
    <slot metadata={null} />
  {:then resolvedMeta}
    <slot metadata={resolvedMeta} />
  {/await}
{:else}
  <slot metadata={null} />
{/if}
