/**
 * Tests for src/localization.ts
 *
 * Key contract:
 *  - "system-default" reads the language from window.app.vault.getConfig("language")
 *  - weekStart overrides mutate the active moment locale's _week.dow
 *  - locale state must be restored after each test (afterEach)
 */

describe("configureGlobalMomentLocale", () => {
  // Each test saves/restores locale so tests are independent.
  // The afterEach below mirrors what the spec requires.
  let originalLocale: string;

  beforeEach(() => {
    originalLocale = window.moment.locale();
  });

  afterEach(() => {
    window.moment.locale(originalLocale);
  });

  // -------------------------------------------------------------------------
  // Basic return contract
  // -------------------------------------------------------------------------

  it.todo("returns a string in all cases");

  it.todo("does not throw for any valid ILocaleOverride value");

  // -------------------------------------------------------------------------
  // system-default behaviour
  // -------------------------------------------------------------------------

  describe("with localeOverride = 'system-default'", () => {
    it.todo(
      "reads the Obsidian language setting from window.app.vault.getConfig('language')"
    );

    it.todo(
      "falls back to 'en' when vault.getConfig returns an empty string"
    );

    it.todo(
      "falls back to 'en' when vault.getConfig returns null"
    );
  });

  // -------------------------------------------------------------------------
  // Explicit locale string
  // -------------------------------------------------------------------------

  describe("with an explicit locale string", () => {
    it.todo("sets the moment locale to the specified value");

    it.todo("returns the locale string that was applied");
  });

  // -------------------------------------------------------------------------
  // Week-start override
  // -------------------------------------------------------------------------

  describe("week start override", () => {
    it.todo("sets week start to 0 (Sunday) when weekStart is 'sunday'");

    it.todo("sets week start to 1 (Monday) when weekStart is 'monday'");

    it.todo("sets week start to 2 (Tuesday) when weekStart is 'tuesday'");

    it.todo("sets week start to 6 (Saturday) when weekStart is 'saturday'");

    it.todo("does not override the week start when weekStart is 'locale'");
  });

  // -------------------------------------------------------------------------
  // Idempotency
  // -------------------------------------------------------------------------

  describe("idempotency", () => {
    it.todo("produces the same result when called twice with the same arguments");
  });
});
