<!-- Navigation arrow button (prev / next month).
     Renders a left-pointing SVG chevron; the "right" variant is rotated 180° via CSS.
     Width is slightly larger on mobile to give a more comfortable tap target.

     Ported directly from obsidian-calendar-ui/src/components/Arrow.svelte — no changes. -->

<script lang="ts">
  /** Callback invoked when the arrow is clicked. */
  export let onClick: () => void;
  /** Accessible label shown on hover. */
  export let tooltip: string;
  /** Which direction the arrow points. */
  export let direction: "left" | "right";

  // Read isMobile once at mount — this value never changes during the session.
  const isMobile = (window.app as any).isMobile;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="arrow"
  class:is-mobile={isMobile}
  class:right={direction === "right"}
  on:click={onClick}
  aria-label={tooltip}
>
  <svg
    focusable="false"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 320 512"
  >
    <path
      fill="currentColor"
      d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z"
    ></path>
  </svg>
</div>

<style>
  .arrow {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    width: 24px;
  }

  .arrow.is-mobile {
    width: 32px;
  }

  /* Rotate the left chevron 180° to produce the right-pointing variant. */
  .right {
    transform: rotate(180deg);
  }

  .arrow svg {
    color: var(--color-arrow);
    height: 16px;
    width: 16px;
  }
</style>
