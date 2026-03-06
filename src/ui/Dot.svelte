<!-- Single SVG dot indicator — either solid (filled) or hollow (outline).
     Used by Dots.svelte to render per-source decoration dots on calendar cells.

     Ported directly from obsidian-calendar-ui/src/components/Dot.svelte — no changes. -->

<script lang="ts">
  /** The dot colour, forwarded from the source's ISourceSettings.color. */
  export let color: string;
  /** Whether the dot is solid (true) or an outline circle (false). */
  export let isFilled: boolean;
  /** Whether the parent cell is currently active/selected (drives colour inversion). */
  export let isActive: boolean;
</script>

<svg
  class="dot"
  class:active={isActive}
  style="color:{color}"
  viewBox="0 0 6 6"
  xmlns="http://www.w3.org/2000/svg"
>
  <!--
    Filled dot: solid circle using currentColor fill.
    Hollow dot: outline circle using currentColor stroke, transparent fill.
  -->
  <circle
    stroke={!isFilled ? "currentColor" : "none"}
    fill={isFilled ? "currentColor" : "none"}
    cx="3"
    cy="3"
    r="2"
  ></circle>
</svg>

<style>
  .dot {
    display: inline-block;
    height: 6px;
    width: 6px;
    margin: 0 1px;
  }

  /* When the parent cell is active the background turns accent-coloured,
     so switch the dot to the on-accent text colour to remain visible. */
  .active {
    color: var(--text-on-accent);
  }
</style>
