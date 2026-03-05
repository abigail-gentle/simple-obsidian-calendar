/**
 * Tests for src/io/dailyNotes.ts — tryToCreateDailyNote()
 *
 * Mocking strategy:
 *  - createDailyNote, getDailyNoteSettings come from the always-on
 *    obsidian-daily-notes-interface mock (moduleNameMapper)
 *  - window.app.workspace.getLeaf / openFile are jest.fn() from jest.setup.ts
 *  - createConfirmationDialog is mocked per-test (it opens a real Obsidian modal)
 *  - applyTemplate is mocked per-test (tests its call-site, not its internals)
 */

describe("tryToCreateDailyNote", () => {
  // -------------------------------------------------------------------------
  // No confirmation required
  // -------------------------------------------------------------------------

  describe("when shouldConfirmBeforeCreate is false", () => {
    it.todo("calls createDailyNote with the provided date");

    it.todo("does not show a confirmation dialog");

    describe("inNewSplit = false", () => {
      it.todo(
        "opens the created file in a non-splitting leaf via workspace.getLeaf(false)"
      );

      it.todo("passes { active: true } to leaf.openFile");
    });

    describe("inNewSplit = true", () => {
      it.todo(
        "opens the created file in a split leaf via workspace.getLeaf('split')"
      );
    });

    it.todo("calls the callback with the newly created TFile");

    it.todo("calls the callback after the file is opened");

    describe("template engine = 'obsidian'", () => {
      it.todo(
        "does NOT call applyTemplate with engine 'templater'"
      );
    });

    describe("template engine = 'templater' and a template path is configured", () => {
      it.todo(
        "calls applyTemplate with engine='templater', the template path, and the created file"
      );

      it.todo("calls applyTemplate after createDailyNote returns the file");
    });

    describe("template engine = 'templater' but template path is empty string", () => {
      it.todo("does not call applyTemplate");
    });
  });

  // -------------------------------------------------------------------------
  // Confirmation required
  // -------------------------------------------------------------------------

  describe("when shouldConfirmBeforeCreate is true", () => {
    it.todo(
      "calls createConfirmationDialog instead of creating the note immediately"
    );

    it.todo("passes title 'New Daily Note' to the dialog");

    it.todo("includes the formatted filename in the dialog body text");

    it.todo("passes a CTA of 'Create' to the dialog");

    it.todo("does not call createDailyNote before the dialog is accepted");

    describe("when the dialog onAccept callback is invoked", () => {
      it.todo("then calls createDailyNote");

      it.todo("then opens the file");

      it.todo("then calls the user-supplied callback");
    });
  });

  // -------------------------------------------------------------------------
  // Error propagation
  // -------------------------------------------------------------------------

  describe("error propagation", () => {
    it.todo("propagates an error thrown by createDailyNote to the caller");
  });
});
