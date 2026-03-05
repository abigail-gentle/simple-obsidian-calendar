/**
 * Tests for src/io/weeklyNotes.ts — tryToCreateWeeklyNote()
 *
 * Mirrors the daily notes test structure; weekly-specific details noted inline.
 */

describe("tryToCreateWeeklyNote", () => {
  // -------------------------------------------------------------------------
  // No confirmation required
  // -------------------------------------------------------------------------

  describe("when shouldConfirmBeforeCreate is false", () => {
    it.todo("calls createWeeklyNote with the provided date");

    it.todo("does not show a confirmation dialog");

    describe("inNewSplit = false", () => {
      it.todo(
        "opens the created file in a non-splitting leaf via workspace.getLeaf(false)"
      );
    });

    describe("inNewSplit = true", () => {
      it.todo(
        "opens the created file in a split leaf via workspace.getLeaf('split')"
      );
    });

    it.todo("calls the callback with the newly created TFile");

    describe("template engine = 'templater' and a template path is configured", () => {
      it.todo(
        "calls applyTemplate with engine='templater', the template path, and the created file"
      );
    });
  });

  // -------------------------------------------------------------------------
  // Confirmation required
  // -------------------------------------------------------------------------

  describe("when shouldConfirmBeforeCreate is true", () => {
    it.todo(
      "calls createConfirmationDialog instead of creating the note immediately"
    );

    it.todo("passes title 'New Weekly Note' to the dialog");

    it.todo("includes the formatted week filename in the dialog body text");

    it.todo("does not call createWeeklyNote before the dialog is accepted");

    describe("when the dialog onAccept callback is invoked", () => {
      it.todo("then calls createWeeklyNote");

      it.todo("then opens the file");

      it.todo("then calls the user-supplied callback");
    });
  });

  // -------------------------------------------------------------------------
  // Error propagation
  // -------------------------------------------------------------------------

  describe("error propagation", () => {
    it.todo("propagates an error thrown by createWeeklyNote to the caller");
  });
});
