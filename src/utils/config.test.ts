import * as vscode from "vscode";
import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { DEFAULT_BINDINGS, WhatKeyConfig } from "../config";
import { loadConfig } from "./config";

jest.mock("vscode", () => ({
  workspace: {
    getConfiguration: jest.fn(),
  },
  window: {
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
  },
}));

const mockedVscode = jest.mocked(vscode);

const createMockConfiguration = (config: Partial<WhatKeyConfig>) =>
  createMock<DeepMocked<vscode.WorkspaceConfiguration>>({
    // @ts-expect-error eslint-disable-next-line
    get: (key: string) => config[key] as unknown,
  });

describe("loadConfig", () => {
  it("should load valid configuration", () => {
    const mockConfig = createMockConfiguration({
      bindings: [
        {
          key: "f",
          name: "Format",
          type: "command",
          command: "editor.action.formatDocument",
        },
      ],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    const result = loadConfig();

    expect(result.bindings).toHaveLength(1);
    expect(result.bindingsMergeStrategy).toBe("merge");
    expect(result.sortOrder).toBe("custom");
    expect(result.showIcons).toBe(true);
    expect(result.showDetail).toBe(true);
    expect(result.keySequenceTimeout).toBe(350);
  });

  it("should use default values when config is missing", () => {
    const mockConfig = createMockConfiguration({});
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    const result = loadConfig();

    expect(result.bindings).toEqual([]);
    expect(result.bindingsMergeStrategy).toBe("merge");
    expect(result.sortOrder).toBe("custom");
    expect(result.showIcons).toBe(true);
    expect(result.showDetail).toBe(true);
    expect(result.keySequenceTimeout).toBe(350);
  });

  it("should show error and return default config for invalid bindings", () => {
    const mockConfig = createMockConfiguration({
      // @ts-expect-error for testing
      bindings: [{ key: "f", name: "Invalid", type: "invalid_type" }],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    const result = loadConfig();

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalled();
    // Returns DEFAULT_CONFIG which has default bindings
    expect(result.bindings).toEqual(DEFAULT_BINDINGS);
  });

  it("should show info message for duplicate keys", () => {
    const mockConfig = createMockConfiguration({
      bindings: [
        { key: "f", name: "First", type: "command", command: "cmd.first" },
        { key: "f", name: "Second", type: "command", command: "cmd.second" },
      ],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    loadConfig();

    expect(mockedVscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("Duplicate keys found"),
    );
  });

  it("should not show duplicate warning when no duplicates exist", () => {
    const mockConfig = createMockConfiguration({
      bindings: [
        { key: "a", name: "A", type: "command", command: "cmd.a" },
        { key: "b", name: "B", type: "command", command: "cmd.b" },
      ],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    loadConfig();

    expect(mockedVscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  it("should handle commands binding type", () => {
    const mockConfig = createMockConfiguration({
      bindings: [
        {
          key: "s",
          name: "Save All",
          type: "commands",
          commands: [
            "workbench.action.files.saveAll",
            "workbench.action.closeActiveEditor",
          ],
        },
      ],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    const result = loadConfig();

    expect(result.bindings).toHaveLength(1);
    expect(result.bindings[0]?.type).toBe("commands");
  });

  it("should handle submenu binding type", () => {
    const mockConfig = createMockConfiguration({
      bindings: [
        {
          key: "f",
          name: "File",
          type: "submenu",
          items: [
            {
              key: "s",
              name: "Save",
              type: "command",
              command: "workbench.action.files.save",
            },
          ],
        },
      ],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    const result = loadConfig();

    expect(result.bindings).toHaveLength(1);
    expect(result.bindings[0]?.type).toBe("submenu");
  });

  it("should validate key length constraint", () => {
    const mockConfig = createMockConfiguration({
      bindings: [
        {
          key: "abc",
          name: "Too Long Key",
          type: "command",
          command: "cmd.test",
        },
      ],
      bindingsMergeStrategy: "merge",
      sortOrder: "custom",
      showIcons: true,
      showDetail: true,
      keySequenceTimeout: 350,
    });
    mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

    const result = loadConfig();

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalled();
    // Returns DEFAULT_CONFIG which has default bindings
    expect(result.bindings).toEqual(DEFAULT_BINDINGS);
  });
});
