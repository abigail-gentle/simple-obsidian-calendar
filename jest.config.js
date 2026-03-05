/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/__setup__/jest.setup.ts"],
  moduleNameMapper: {
    // ---------------------------------------------------------------------------
    // npm package mocks (always-on; no jest.mock() call required in tests)
    // ---------------------------------------------------------------------------
    "^obsidian$": "<rootDir>/src/__mocks__/obsidian.ts",
    "^obsidian-daily-notes-interface$":
      "<rootDir>/src/__mocks__/obsidian-daily-notes-interface.ts",

    // ---------------------------------------------------------------------------
    // Svelte component stub — prevents parse errors; component tests that need
    // real rendering use @testing-library/svelte instead (see plan §5.14)
    // ---------------------------------------------------------------------------
    "\\.svelte$": "<rootDir>/src/__mocks__/svelte-component.ts",

    // ---------------------------------------------------------------------------
    // tsconfig path alias: src/* -> <rootDir>/src/*
    // ---------------------------------------------------------------------------
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // tsconfig.test.json extends the main tsconfig but sets module=commonjs,
        // disables verbatimModuleSyntax, and maps obsidian/obsidian-daily-notes-interface
        // to the mock files so TypeScript uses the mock's type definitions.
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  // Only discover tests inside __tests__ directories
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__mocks__/**",
    "!src/__setup__/**",
    "!src/**/__tests__/**",
  ],
};
