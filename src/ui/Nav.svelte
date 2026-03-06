<!-- Navigation header bar above the calendar grid.
     Contains: Month title (left) | left arrow · reset dot · right arrow (right).
     The reset dot is only interactive when the displayed month differs from today.

     Ported from obsidian-calendar-ui/src/components/Nav.svelte with one change:
       CHANGED: import path for Month updated to local ./Month.svelte. All other
       import paths also updated to local src/ui/ layout. -->

<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import type { Moment } from "moment";

  import Arrow from "./Arrow.svelte";
  import Dot from "./Dot.svelte";
  import Month from "./Month.svelte";
  import type PeriodicNotesCache from "../ui/fileStore";
  import { DISPLAYED_MONTH } from "./context";
  import type { ISourceSettings } from "../types";

  /** Returns per-source display settings keyed by source id. */
  export let getSourceSettings: (sourceId: string) => ISourceSettings;
  /** The shared periodic-notes file cache (forwarded to Month). */
  export let fileCache: PeriodicNotesCache;
  /** Today's date — used to determine whether the reset dot should be active. */
  export let today: Moment;
  /** Event handlers forwarded from Calendar.svelte (onClick, onHover, onContextMenu). */
  export let eventHandlers: Record<string, CallableFunction>;

  const displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);

  function incrementDisplayedMonth() {
    displayedMonth.update((month) => month.clone().add(1, "month"));
  }

  function decrementDisplayedMonth() {
    displayedMonth.update((month) => month.clone().subtract(1, "month"));
  }

  function resetDisplayedMonth() {
    displayedMonth.set(today.clone());
  }

  // Drive the active state of the reset dot reactively.
  let showingCurrentMonth: boolean;
  $: showingCurrentMonth = $displayedMonth.isSame(today, "month");
</script>

<div class="nav">
  <Month
    {fileCache}
    {getSourceSettings}
    {resetDisplayedMonth}
    {...eventHandlers}
    on:hoverDay
    on:endHoverDay
  />
  <div class="right-nav">
    <Arrow
      direction="left"
      onClick={decrementDisplayedMonth}
      tooltip="Previous Month"
    />
    <!-- The reset dot: visible always but only interactive when off the current month. -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      aria-label={!showingCurrentMonth ? "Reset to current month" : null}
      class="reset-button"
      class:active={!showingCurrentMonth}
      on:click={resetDisplayedMonth}
    >
      <Dot isFilled={true} color="currentColor" isActive={false} />
    </div>
    <Arrow
      direction="right"
      onClick={incrementDisplayedMonth}
      tooltip="Next Month"
    />
  </div>
</div>

<style>
  .nav {
    align-items: baseline;
    display: flex;
    margin: 0.6em 0 1em;
    padding: 0 8px;
    width: 100%;
  }

  .right-nav {
    align-items: center;
    display: flex;
    justify-content: center;
    margin-left: auto;
  }

  .reset-button {
    align-items: center;
    color: var(--color-arrow);
    display: flex;
    opacity: 0.4;
    padding: 0.5em;
  }

  .reset-button.active {
    cursor: pointer;
    opacity: 1;
  }
</style>
