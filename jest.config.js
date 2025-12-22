/** @type {import('jest').Config} */
export default {
  clearMocks: true,
  resetMocks: true,
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["@swc/jest"],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 90,
      lines: 85,
    },
  },
  moduleNameMapper: {
    "^vscode$": "<rootDir>/src/__mocks__/vscode.ts",
  },
};
