/**
 * Tests for src/io/template.ts
 *
 * Covers:
 *   - templaterIsAvailable()  — reads window.app.plugins.plugins
 *   - applyTemplate()         — dispatches to Obsidian built-in or Templater
 *
 * The Templater plugin ID is "templater-obsidian" (not "templater").
 * window.app is reset in jest.setup.ts; each test that needs Templater
 * present adds it manually to window.app.plugins.plugins.
 */

describe("templaterIsAvailable", () => {
  it.todo(
    "returns true when app.plugins.plugins['templater-obsidian'] is an object"
  );

  it.todo(
    "returns false when 'templater-obsidian' is absent from the plugin registry"
  );

  it.todo("returns false when app.plugins.plugins is an empty object");

  it.todo("returns false when app.plugins is undefined");

  it.todo("returns false when app is missing the plugins property entirely");
});

describe("applyTemplate", () => {
  describe("when engine is 'obsidian'", () => {
    it.todo("returns without calling any Templater method");

    it.todo("does not throw even if Templater is not installed");
  });

  describe("when engine is 'templater' and Templater is available", () => {
    it.todo(
      "calls write_template_to_file with the template TFile and the target TFile"
    );

    it.todo("resolves the template path via app.vault.getAbstractFileByPath");

    describe("when the template file does not exist in the vault", () => {
      it.todo("does not call write_template_to_file");

      it.todo("logs a warning to the console");

      it.todo("does not throw");
    });

    describe("when templatePath is an empty string", () => {
      it.todo("does not call write_template_to_file");

      it.todo("does not throw");
    });
  });

  describe("when engine is 'templater' but Templater is NOT available", () => {
    it.todo("does not call write_template_to_file");

    it.todo("does not throw");
  });
});
