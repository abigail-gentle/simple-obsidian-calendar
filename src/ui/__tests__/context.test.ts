/**
 * Tests for src/ui/context.ts
 *
 * context.ts exports two Svelte context keys as Symbols. These tests verify
 * identity and type contracts only — the actual context wiring is tested via
 * Svelte component smoke tests.
 */

describe("context symbols", () => {
  it.todo("IS_MOBILE is a Symbol");

  it.todo("DISPLAYED_MONTH is a Symbol");

  it.todo("IS_MOBILE and DISPLAYED_MONTH are distinct symbols");
});
