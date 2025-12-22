import * as vscode from "vscode";
import { ConfigurationManager } from "./configuration-manager";
import { BindingItem, DEFAULT_BINDINGS, WhatKeyConfig } from "../config";
import { createMock, DeepMocked } from "@golevelup/ts-jest";

jest.mock("vscode", () => ({
  workspace: {
    getConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
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

describe("ConfigurationManager", () => {
  describe("constructor", () => {
    it("should load config on initialization", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      new ConfigurationManager();

      expect(mockedVscode.workspace.getConfiguration).toHaveBeenCalledTimes(1);
      expect(mockedVscode.workspace.getConfiguration).toHaveBeenCalledWith(
        "whatkey",
      );
    });

    it("should register configuration change listener", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      new ConfigurationManager();

      expect(
        mockedVscode.workspace.onDidChangeConfiguration,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("bindings", () => {
    it("should return DEFAULT_BINDINGS when user bindings are empty", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();

      expect(manager.bindings).toEqual(DEFAULT_BINDINGS);
    });

    it("should return deduplicated user bindings when strategy is replace", () => {
      const userBindings: BindingItem[] = [
        { key: "a", name: "A", type: "command", command: "cmd.a" },
        { key: "a", name: "A duplicated", type: "command", command: "cmd.aa" },
        { key: "b", name: "B", type: "command", command: "cmd.b" },
      ];
      const mockConfig = createMockConfiguration({
        bindings: userBindings,
        bindingsMergeStrategy: "replace",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();

      expect(manager.bindings).toEqual([userBindings[0], userBindings[2]]);
    });

    it("should merge user bindings with defaults when strategy is merge", () => {
      const userBindings: BindingItem[] = [
        { key: "x", name: "Custom X", type: "command", command: "cmd.x" },
      ];
      const mockConfig = createMockConfiguration({
        bindings: userBindings,
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();
      const bindings = manager.bindings;

      // Should include both default bindings and user binding
      expect(bindings.length).toBeGreaterThan(userBindings.length);
      expect(bindings.some(b => b.key === "x" && b.name === "Custom X")).toBe(
        true,
      );
    });
  });

  describe("flatBindings", () => {
    it("should return flattened bindings with paths", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();
      const flatBindings = manager.flatBindings;

      // All flat bindings should have a path property
      expect(flatBindings.every(b => "path" in b)).toBe(true);
      expect(flatBindings.length).toBeGreaterThan(DEFAULT_BINDINGS.length);
    });
  });

  describe("config getters", () => {
    it("should return sortOrder from config", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "alphabetical",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();

      expect(manager.sortOrder).toBe("alphabetical");
    });

    it("should return showIcons from config", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: false,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();

      expect(manager.showIcons).toBe(false);
    });

    it("should return showDetail from config", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: false,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();

      expect(manager.showDetail).toBe(false);
    });

    it("should return keySequenceTimeout from config", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 500,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const manager = new ConfigurationManager();

      expect(manager.keySequenceTimeout).toBe(500);
    });
  });

  describe("configuration change handling", () => {
    it("should reload config when whatkey configuration changes", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValue(mockConfig);

      let configChangeHandler:
        | ((e: vscode.ConfigurationChangeEvent) => void)
        | undefined;
      mockedVscode.workspace.onDidChangeConfiguration.mockImplementation(
        handler => {
          configChangeHandler = handler as (
            e: vscode.ConfigurationChangeEvent,
          ) => void;
          return { dispose: jest.fn() };
        },
      );

      new ConfigurationManager();
      expect(mockedVscode.workspace.getConfiguration).toHaveBeenCalledTimes(1);

      // Simulate config change
      configChangeHandler?.({
        affectsConfiguration: (section: string) => section === "whatkey",
      });

      expect(mockedVscode.workspace.getConfiguration).toHaveBeenCalledTimes(2);
    });

    it("should not reload config when other configuration changes", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      let configChangeHandler:
        | ((e: vscode.ConfigurationChangeEvent) => void)
        | undefined;
      mockedVscode.workspace.onDidChangeConfiguration.mockImplementation(
        handler => {
          configChangeHandler = handler as (
            e: vscode.ConfigurationChangeEvent,
          ) => void;
          return { dispose: jest.fn() };
        },
      );

      new ConfigurationManager();
      expect(mockedVscode.workspace.getConfiguration).toHaveBeenCalledTimes(1);

      // Simulate config change for different extension
      configChangeHandler?.({
        affectsConfiguration: (section: string) =>
          section === "other-extension",
      });

      expect(mockedVscode.workspace.getConfiguration).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispose", () => {
    it("should dispose all registered disposables", () => {
      const mockConfig = createMockConfiguration({
        bindings: [],
        bindingsMergeStrategy: "merge",
        sortOrder: "custom",
        showIcons: true,
        showDetail: true,
        keySequenceTimeout: 350,
      });
      mockedVscode.workspace.getConfiguration.mockReturnValueOnce(mockConfig);

      const mockDispose = jest.fn();
      // Simulate vscode pushing the disposable into the provided array (3rd arg)
      mockedVscode.workspace.onDidChangeConfiguration.mockImplementation(
        (_handler, _thisArg, disposables?: vscode.Disposable[]) => {
          const disposable = { dispose: mockDispose };
          disposables?.push(disposable);
          return disposable;
        },
      );

      new ConfigurationManager().dispose();

      expect(mockDispose).toHaveBeenCalled();
    });
  });
});
