/**
 * Tests for src/io/template.ts
 */

import { TFile } from "obsidian";
import { applyTemplate, templaterIsAvailable } from "src/io/template";

describe("templaterIsAvailable", () => {
  it("returns true when app.plugins.plugins['templater-obsidian'] is an object", () => {
    window.app.plugins.plugins["templater-obsidian"] = { id: "templater-obsidian" };
    expect(templaterIsAvailable()).toBe(true);
  });

  it("returns false when 'templater-obsidian' is absent from the plugin registry", () => {
    // default mock has empty plugins object
    expect(templaterIsAvailable()).toBe(false);
  });

  it("returns false when app.plugins.plugins is an empty object", () => {
    window.app.plugins.plugins = {};
    expect(templaterIsAvailable()).toBe(false);
  });

  it("returns false when app.plugins is undefined", () => {
    (window.app as any).plugins = undefined;
    expect(templaterIsAvailable()).toBe(false);
  });

  it("returns false when app is missing the plugins property entirely", () => {
    const origApp = window.app;
    (window as any).app = {};
    expect(templaterIsAvailable()).toBe(false);
    (window as any).app = origApp;
  });
});

describe("applyTemplate", () => {
  const targetFile = new TFile("2024-01-15.md");

  describe("when engine is 'obsidian'", () => {
    it("returns without calling any Templater method", async () => {
      const writeTemplateMock = jest.fn();
      window.app.plugins.plugins["templater-obsidian"] = {
        templater: { write_template_to_file: writeTemplateMock },
      };

      await applyTemplate("obsidian", "templates/daily.md", targetFile);

      expect(writeTemplateMock).not.toHaveBeenCalled();
    });

    it("does not throw even if Templater is not installed", async () => {
      await expect(
        applyTemplate("obsidian", "templates/daily.md", targetFile)
      ).resolves.not.toThrow();
    });
  });

  describe("when engine is 'templater' and Templater is available", () => {
    let writeTemplateMock: jest.Mock;
    let templateFile: TFile;

    beforeEach(() => {
      templateFile = new TFile("templates/daily.md");
      writeTemplateMock = jest.fn().mockResolvedValue(undefined);
      window.app.plugins.plugins["templater-obsidian"] = {
        templater: { write_template_to_file: writeTemplateMock },
      };
      (window.app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
        templateFile
      );
    });

    it("calls write_template_to_file with the template TFile and the target TFile", async () => {
      await applyTemplate("templater", "templates/daily.md", targetFile);

      expect(writeTemplateMock).toHaveBeenCalledWith(templateFile, targetFile);
    });

    it("resolves the template path via app.vault.getAbstractFileByPath", async () => {
      await applyTemplate("templater", "templates/daily.md", targetFile);

      expect(window.app.vault.getAbstractFileByPath).toHaveBeenCalledWith(
        "templates/daily.md"
      );
    });

    describe("when the template file does not exist in the vault", () => {
      beforeEach(() => {
        (window.app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
      });

      it("does not call write_template_to_file", async () => {
        await applyTemplate("templater", "templates/daily.md", targetFile);
        expect(writeTemplateMock).not.toHaveBeenCalled();
      });

      it("logs a warning to the console", async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        await applyTemplate("templater", "templates/daily.md", targetFile);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      });

      it("does not throw", async () => {
        await expect(
          applyTemplate("templater", "templates/daily.md", targetFile)
        ).resolves.not.toThrow();
      });
    });

    describe("when templatePath is an empty string", () => {
      it("does not call write_template_to_file", async () => {
        await applyTemplate("templater", "", targetFile);
        expect(writeTemplateMock).not.toHaveBeenCalled();
      });

      it("does not throw", async () => {
        await expect(
          applyTemplate("templater", "", targetFile)
        ).resolves.not.toThrow();
      });
    });
  });

  describe("when engine is 'templater' but Templater is NOT available", () => {
    let writeTemplateMock: jest.Mock;

    beforeEach(() => {
      writeTemplateMock = jest.fn();
      // No templater-obsidian in plugins (default mock)
    });

    it("does not call write_template_to_file", async () => {
      await applyTemplate("templater", "templates/daily.md", targetFile);
      expect(writeTemplateMock).not.toHaveBeenCalled();
    });

    it("does not throw", async () => {
      await expect(
        applyTemplate("templater", "templates/daily.md", targetFile)
      ).resolves.not.toThrow();
    });
  });
});
