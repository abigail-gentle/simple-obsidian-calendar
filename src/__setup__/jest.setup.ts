import moment from "moment";
import "@testing-library/jest-dom";

// ---------------------------------------------------------------------------
// Make real moment available on window (Obsidian injects this globally at
// runtime; tests need it for localization and date helpers).
// ---------------------------------------------------------------------------
(global as any).window = global;
(global as any).window.moment = moment;

// ---------------------------------------------------------------------------
// Default window.app mock — individual tests can override specific methods
// with jest.fn().mockReturnValue / mockResolvedValue as needed.
// ---------------------------------------------------------------------------
const makeWorkspaceMock = () => ({
  getLeaf: jest.fn().mockReturnValue({
    openFile: jest.fn().mockResolvedValue(undefined),
  }),
  setActiveLeaf: jest.fn(),
  onLayoutReady: jest.fn().mockImplementation((cb: () => void) => cb()),
  trigger: jest.fn(),
  on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  off: jest.fn(),
  getLeavesOfType: jest.fn().mockReturnValue([]),
  getRightLeaf: jest.fn().mockReturnValue({
    setViewState: jest.fn(),
  }),
});

const makeVaultMock = () => ({
  cachedRead: jest.fn().mockResolvedValue(""),
  read: jest.fn().mockResolvedValue(""),
  create: jest.fn().mockResolvedValue(undefined),
  modify: jest.fn().mockResolvedValue(undefined),
  getAbstractFileByPath: jest.fn().mockReturnValue(null),
  on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  off: jest.fn(),
  getConfig: jest.fn().mockReturnValue(""),
});

const makeMetadataCacheMock = () => ({
  getFileCache: jest.fn().mockReturnValue(null),
  on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  off: jest.fn(),
});

(global as any).window.app = {
  vault: makeVaultMock(),
  workspace: makeWorkspaceMock(),
  metadataCache: makeMetadataCacheMock(),
  plugins: {
    plugins: {} as Record<string, unknown>,
  },
  internalPlugins: {
    plugins: {
      "daily-notes": {
        enabled: true,
        instance: {
          options: {
            format: "YYYY-MM-DD",
            folder: "",
            template: "",
          },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Restore app mock before each test so mutations in one test don't bleed
// into the next. Tests that need custom behaviour can mutate these mocks
// inside their own beforeEach/it blocks.
// ---------------------------------------------------------------------------
beforeEach(() => {
  (global as any).window.app = {
    vault: makeVaultMock(),
    workspace: makeWorkspaceMock(),
    metadataCache: makeMetadataCacheMock(),
    plugins: {
      plugins: {} as Record<string, unknown>,
    },
    internalPlugins: {
      plugins: {
        "daily-notes": {
          enabled: true,
          instance: {
            options: {
              format: "YYYY-MM-DD",
              folder: "",
              template: "",
            },
          },
        },
      },
    },
  };
});
