// Manual mock for the 'obsidian' module.
// Jest auto-resolves this file when any source file does `import ... from 'obsidian'`.
//
// Only the classes and functions actually used by our source files are mocked.
// Add entries here as the implementation grows.

export class Plugin {
  app: any = (global as any).window.app;
  manifest: any = { id: "calendar", version: "2.0.0" };

  loadData = jest.fn().mockResolvedValue(null);
  saveData = jest.fn().mockResolvedValue(undefined);
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  addRibbonIcon = jest.fn();
  registerView = jest.fn();
  registerEvent = jest.fn();
  register = jest.fn();
}

export class ItemView {
  app: any = (global as any).window.app;
  leaf: any;
  contentEl: HTMLElement = document.createElement("div");
  icon = "calendar";

  constructor(leaf: any) {
    this.leaf = leaf;
  }

  registerEvent = jest.fn();
  getViewType = jest.fn().mockReturnValue("calendar");
  getDisplayText = jest.fn().mockReturnValue("Calendar");
}

export class WorkspaceLeaf {
  view: any = null;
  openFile = jest.fn().mockResolvedValue(undefined);
  setViewState = jest.fn().mockResolvedValue(undefined);
  detach = jest.fn();
}

export class TFile {
  stat = { ctime: 0, mtime: 0, size: 0 };
  extension = "md";
  name: string;
  basename: string;
  path: string;
  parent: any = null;

  constructor(path: string, name?: string) {
    this.path = path;
    this.name = name ?? path.split("/").pop() ?? path;
    this.basename = this.name.replace(/\.md$/, "");
  }
}

export class TFolder {
  name: string;
  path: string;
  parent: any = null;
  children: any[] = [];

  constructor(path: string) {
    this.path = path;
    this.name = path.split("/").pop() ?? path;
  }
}

export class Modal {
  app: any;
  contentEl: HTMLElement = document.createElement("div");
  titleEl: HTMLElement = document.createElement("div");

  constructor(app: any) {
    this.app = app;
  }

  open = jest.fn();
  close = jest.fn();
}

export class Setting {
  constructor(_containerEl: HTMLElement) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  setHeading = jest.fn().mockReturnThis();
  setClass = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockImplementation((cb: (d: any) => void) => {
    cb({
      addOption: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      getValue: jest.fn().mockReturnValue(""),
      onChange: jest.fn().mockReturnThis(),
    });
    return this;
  });
  addButton = jest.fn().mockReturnThis();
  addMomentFormat = jest.fn().mockReturnThis();
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: HTMLElement = document.createElement("div");

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }

  display = jest.fn();
  hide = jest.fn();
}

export class Menu {
  addItem = jest.fn().mockImplementation((cb: (item: MenuItem) => void) => {
    cb(new MenuItem());
    return this;
  });
  addSeparator = jest.fn().mockReturnThis();
  showAtPosition = jest.fn();
  showAtMouseEvent = jest.fn();
  hide = jest.fn();
}

export class MenuItem {
  setTitle = jest.fn().mockReturnThis();
  setIcon = jest.fn().mockReturnThis();
  setChecked = jest.fn().mockReturnThis();
  setDisabled = jest.fn().mockReturnThis();
  onClick = jest.fn().mockReturnThis();
}

export class FileView extends ItemView {
  file: TFile | null = null;
}

// Utility functions used by the plugin
export const normalizePath = (p: string): string => p.replace(/\\/g, "/").replace(/\/+/g, "/");

// Notice (used in some error reporting)
export class Notice {
  constructor(_message: string, _timeout?: number) {}
}
