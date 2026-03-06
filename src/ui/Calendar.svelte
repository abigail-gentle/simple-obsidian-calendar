<!-- Root calendar component. Renders the full calendar grid including the navigation
     bar, day headers, day cells, and optional week-number column.
     Also owns the tooltip state and the 1-minute heartbeat that keeps "today" current.

     Ported from obsidian-calendar-ui/src/components/Calendar.svelte with these changes:
       CHANGED: Removed entire Popper.js / svelte-portal / PopoverMenu stack.
         The original used @popperjs/svelte + svelte-portal for a hover popover.
         Replaced with a lightweight CSS-only Tooltip.svelte (see Stage D5).
       CHANGED: Added 1-minute heartbeat (restored from obsidian-calendar-plugin's
         Calendar.svelte wrapper) so the "today" highlight updates across midnight.
       CHANGED: All import paths updated to local src/ui/ layout.
       CHANGED: eventHandlers is now a Record<string, CallableFunction> typed prop
         (was CallableFunction[] in the original — changed to a named map so Nav/Day/
         WeekNum can spread only the handlers they need by name). -->

<svelte:options immutable />

<script lang="ts">
  import type { Plugin } from "obsidian";
  import type { Locale, Moment } from "moment";
  import { onDestroy, setContext } from "svelte";
  import { writable } from "svelte/store";

  import type { IDayMetadata, ICalendarSource, IMonth, ISourceSettings } from "../types";
  import { DISPLAYED_MONTH, IS_MOBILE } from "./context";
  import Nav from "./Nav.svelte";
  import Day from "./Day.svelte";
  import WeekNum from "./WeekNum.svelte";
  import Tooltip from "./Tooltip.svelte";
  import PeriodicNotesCache from "./fileStore";
  import { getDaysOfWeek, getMonth, isWeekend } from "./utils";

  // ── Props ──────────────────────────────────────────────────────────────────

  /** Moment locale data, used to determine first day of week and day names. */
  export let localeData: Locale;
  /** Whether to show the week-number column on the left. */
  export let showWeekNums: boolean = false;
  /**
   * Named event handlers passed in from view.ts.
   * Keys: onClick, onHover, onContextMenu (all optional).
   * CHANGED from original: was typed as CallableFunction[]; changed to a named
   * Record so components can spread only the handlers they need by name.
   */
  export let eventHandlers: Record<string, CallableFunction> = {};

  /** The Obsidian plugin instance — required by PeriodicNotesCache to register
   *  vault events through the plugin's own event lifecycle. */
  export let plugin: Plugin;
  /** External metadata sources injected at plugin open time via calendar:open. */
  export let sources: ICalendarSource[] = [];
  /** Returns per-source display settings (color, display, order) by source id. */
  export let getSourceSettings: (sourceId: string) => ISourceSettings;
  /** The dateUID of the currently active (open) note. */
  export let selectedId: string = null;

  /** Today's date — overridable for testing; driven by the heartbeat in production. */
  export let today: Moment = window.moment();
  /** The month currently shown in the grid; defaults to today's month. */
  export let displayedMonth: Moment = today;

  // ── Context ────────────────────────────────────────────────────────────────

  // IS_MOBILE is read once; it never changes during a session.
  setContext(IS_MOBILE, (plugin.app as any).isMobile);

  // DISPLAYED_MONTH is a writable store so child components (Day, WeekNum, Month)
  // can react to navigation without re-rendering the whole tree.
  const displayedMonthStore = writable<Moment>(displayedMonth);
  setContext(DISPLAYED_MONTH, displayedMonthStore);

  // ── Derived state ──────────────────────────────────────────────────────────

  let month: IMonth;
  let daysOfWeek: string[];

  $: month = getMonth($displayedMonthStore, localeData);
  $: daysOfWeek = getDaysOfWeek(today, localeData);

  // ── File cache ─────────────────────────────────────────────────────────────

  // PeriodicNotesCache registers vault event listeners through `plugin` so they
  // are automatically cleaned up when the plugin unloads.
  const fileCache = new PeriodicNotesCache(plugin, sources);

  // ── Tooltip state ──────────────────────────────────────────────────────────
  // CHANGED: replaces the Popper.js / svelte-portal / PopoverMenu stack from the
  // original. Coordinates are computed relative to the calendar container element.

  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipMetadata: IDayMetadata[] | null = null;
  let tooltipTimer: ReturnType<typeof setTimeout>;
  let calendarEl: HTMLElement;

  /**
   * Start the 500ms timer that will show the tooltip for the hovered cell.
   * Called via the "hoverDay" event bubbled up from Day/WeekNum/Month.
   */
  function handleHoverDay(event: CustomEvent) {
    const { metadata, target } = event.detail as {
      metadata: IDayMetadata[];
      target: HTMLElement;
    };

    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => {
      if (!calendarEl) return;
      const containerRect = calendarEl.getBoundingClientRect();
      const targetRect = (target as HTMLElement).getBoundingClientRect();
      // Position the tooltip just below the hovered cell, aligned to its left edge.
      tooltipX = targetRect.left - containerRect.left;
      tooltipY = targetRect.bottom - containerRect.top + 4;
      tooltipMetadata = metadata;
      tooltipVisible = true;
    }, 500);
  }

  /** Hide the tooltip immediately when the pointer leaves a cell. */
  function handleEndHover() {
    clearTimeout(tooltipTimer);
    tooltipVisible = false;
  }

  // ── Heartbeat ──────────────────────────────────────────────────────────────
  // CHANGED: restored from obsidian-calendar-plugin/src/ui/Calendar.svelte.
  // Fires every minute so the "today" highlight moves at midnight without requiring
  // the user to reload Obsidian.

  const heartbeat = setInterval(() => {
    today = window.moment();
    // If the calendar is showing this month, keep the displayed month in sync
    // so the "today" cell styling updates as well.
    if ($displayedMonthStore.isSame(today, "day")) {
      displayedMonthStore.set(today.clone());
    }
  }, 1000 * 60);

  onDestroy(() => {
    clearInterval(heartbeat);
    clearTimeout(tooltipTimer);
  });
</script>

<!--
  The outer div is position:relative so the absolutely-positioned Tooltip child
  is contained within the calendar bounds.
-->
<div id="calendar-container" class="container" bind:this={calendarEl}>
  <Nav
    {fileCache}
    {today}
    {getSourceSettings}
    {eventHandlers}
    on:hoverDay={handleHoverDay}
    on:endHoverDay={handleEndHover}
  />

  <table class="calendar">
    <colgroup>
      {#if showWeekNums}
        <col />
      {/if}
      {#each month[1].days as date}
        <col class:weekend={isWeekend(date)} />
      {/each}
    </colgroup>

    <thead>
      <tr>
        {#if showWeekNums}
          <th>W</th>
        {/if}
        {#each daysOfWeek as dayOfWeek}
          <th>{dayOfWeek}</th>
        {/each}
      </tr>
    </thead>

    <tbody>
      {#each month as week (week.weekNum)}
        <tr>
          {#if showWeekNums}
            <WeekNum
              {fileCache}
              selectedId={selectedId}
              {getSourceSettings}
              {...week}
              {...eventHandlers}
              on:hoverDay={handleHoverDay}
              on:endHoverDay={handleEndHover}
            />
          {/if}
          {#each week.days as day (day.format())}
            <Day
              date={day}
              {fileCache}
              {getSourceSettings}
              {today}
              selectedId={selectedId}
              {...eventHandlers}
              on:hoverDay={handleHoverDay}
              on:endHoverDay={handleEndHover}
            />
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- CSS-only tooltip — replaces @popperjs/svelte + svelte-portal + PopoverMenu. -->
  <Tooltip
    visible={tooltipVisible}
    metadata={tooltipMetadata}
    x={tooltipX}
    y={tooltipY}
  />
</div>

<style>
  /* CSS custom properties provide theme-aware colours for all child components.
     Consumers can override these on the host element to customise the palette. */
  .container {
    --color-background-heading: transparent;
    --color-background-day: transparent;
    --color-background-weeknum: transparent;
    --color-background-weekend: transparent;

    --color-dot: var(--text-muted);
    --color-arrow: var(--text-muted);
    --color-button: var(--text-muted);

    --color-text-title: var(--text-normal);
    --color-text-heading: var(--text-muted);
    --color-text-day: var(--text-normal);
    --color-text-today: var(--interactive-accent);
    --color-text-weeknum: var(--text-muted);
  }

  .container {
    padding: 0 8px;
    /* Required so the absolutely-positioned Tooltip is clipped to the calendar. */
    position: relative;
  }

  :global(.weekend) {
    background-color: var(--color-background-weekend);
  }

  .calendar {
    border-collapse: collapse;
    width: 100%;
  }

  th {
    background-color: var(--color-background-heading);
    color: var(--color-text-heading);
    font-size: 0.6em;
    letter-spacing: 1px;
    padding: 4px;
    text-align: center;
    text-transform: uppercase;
  }
</style>
