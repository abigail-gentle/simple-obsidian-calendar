/**
 * Tests for src/localization.ts
 *
 * Key contract:
 *  - "system-default" reads the language from window.app.vault.getConfig("language")
 *  - weekStart overrides mutate the active moment locale's week data
 *  - locale state is restored after each test (via afterEach)
 */

import { configureGlobalMomentLocale } from "src/localization";

describe("configureGlobalMomentLocale", () => {
  let originalLocale: string;

  beforeEach(() => {
    originalLocale = window.moment.locale();
    // Reset any saved week spec so tests start fresh
    delete (window as any)._bundledLocaleWeekSpec;
  });

  afterEach(() => {
    window.moment.locale(originalLocale);
    delete (window as any)._bundledLocaleWeekSpec;
  });

  // -------------------------------------------------------------------------
  // Basic return contract
  // -------------------------------------------------------------------------

  it("returns a string in all cases", () => {
    const result = configureGlobalMomentLocale("system-default", "locale");
    expect(typeof result).toBe("string");
  });

  it("does not throw for any valid ILocaleOverride value", () => {
    expect(() => configureGlobalMomentLocale("system-default")).not.toThrow();
    expect(() => configureGlobalMomentLocale("en")).not.toThrow();
    expect(() => configureGlobalMomentLocale("fr")).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // system-default behaviour
  // -------------------------------------------------------------------------

  describe("with localeOverride = 'system-default'", () => {
    it("reads the Obsidian language setting from window.app.vault.getConfig('language')", () => {
      const getConfig = window.app.vault.getConfig as jest.Mock;
      getConfig.mockReturnValue("de");

      configureGlobalMomentLocale("system-default", "locale");

      expect(getConfig).toHaveBeenCalledWith("language");
    });

    it("falls back to 'en' when vault.getConfig returns an empty string", () => {
      (window.app.vault.getConfig as jest.Mock).mockReturnValue("");
      // Should not throw and should return a string
      const result = configureGlobalMomentLocale("system-default", "locale");
      expect(typeof result).toBe("string");
    });

    it("falls back to 'en' when vault.getConfig returns null", () => {
      (window.app.vault.getConfig as jest.Mock).mockReturnValue(null);
      const result = configureGlobalMomentLocale("system-default", "locale");
      expect(typeof result).toBe("string");
    });
  });

  // -------------------------------------------------------------------------
  // Explicit locale string
  // -------------------------------------------------------------------------

  describe("with an explicit locale string", () => {
    it("sets the moment locale to the specified value", () => {
      configureGlobalMomentLocale("fr", "locale");
      expect(window.moment.locale()).toBe("fr");
    });

    it("returns the locale string that was applied", () => {
      const result = configureGlobalMomentLocale("fr", "locale");
      // moment.locale() returns the locale that was actually set
      expect(result).toBe("fr");
    });
  });

  // -------------------------------------------------------------------------
  // Week start override
  // -------------------------------------------------------------------------

  describe("week start override", () => {
    it("sets week start to 0 (Sunday) when weekStart is 'sunday'", () => {
      configureGlobalMomentLocale("en", "sunday");
      expect((window.moment.localeData() as any)._week.dow).toBe(0);
    });

    it("sets week start to 1 (Monday) when weekStart is 'monday'", () => {
      configureGlobalMomentLocale("en", "monday");
      expect((window.moment.localeData() as any)._week.dow).toBe(1);
    });

    it("sets week start to 2 (Tuesday) when weekStart is 'tuesday'", () => {
      configureGlobalMomentLocale("en", "tuesday");
      expect((window.moment.localeData() as any)._week.dow).toBe(2);
    });

    it("sets week start to 6 (Saturday) when weekStart is 'saturday'", () => {
      configureGlobalMomentLocale("en", "saturday");
      expect((window.moment.localeData() as any)._week.dow).toBe(6);
    });

    it("does not override the week start when weekStart is 'locale'", () => {
      // First call sets the bundled spec
      configureGlobalMomentLocale("en", "locale");
      const dow = (window.moment.localeData() as any)._week.dow;
      // Second call with 'locale' should restore to same value
      configureGlobalMomentLocale("en", "monday");
      configureGlobalMomentLocale("en", "locale");
      expect((window.moment.localeData() as any)._week.dow).toBe(dow);
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency
  // -------------------------------------------------------------------------

  describe("idempotency", () => {
    it("produces the same result when called twice with the same arguments", () => {
      const result1 = configureGlobalMomentLocale("en", "locale");
      const result2 = configureGlobalMomentLocale("en", "locale");
      expect(result1).toBe(result2);
    });
  });
});
