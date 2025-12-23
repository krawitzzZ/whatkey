/* eslint-disable @typescript-eslint/unbound-method */

import * as vscode from "vscode";
import { CommandMenu, MenuQuickPickItem } from "./command-menu";
import type { ConfigurationManager } from "./configuration-manager";
import type { BindingItem } from "../config";
import { createMock, DeepMocked } from "@golevelup/ts-jest";

// Use a variable that can be accessed from both module and tests
let mockExecuteBindingFn = jest.fn(
  (_binding: BindingItem): Promise<void> => Promise.resolve(),
);

const mockSetStatusBarMessage = jest.fn();

jest.mock("../utils", () => ({
  executeBinding: (binding: BindingItem): Promise<void> =>
    mockExecuteBindingFn(binding),
  getCommandDetail: (binding: BindingItem, showDetail: boolean) => {
    if (!showDetail) return undefined;
    if (binding.type === "command") return binding.command;
    if (binding.type === "submenu")
      return String(binding.items.length) + " items";
    return undefined;
  },
  getDescription: (binding: BindingItem) =>
    binding.type === "submenu"
      ? `${binding.name} $(chevron-right)`
      : binding.name,
  getLabel: (binding: BindingItem) => `$(play)  ${binding.key}`,
  sortBindings: <T>(bindings: T[]): T[] => [...bindings],
  setStatusBarMessage: (...args: unknown[]): void => {
    mockSetStatusBarMessage(...args);
  },
}));

// Reset the mock before each test
const mockExecuteBinding = {
  get fn() {
    return mockExecuteBindingFn;
  },
  reset() {
    mockExecuteBindingFn = jest.fn(
      (_binding: BindingItem): Promise<void> => Promise.resolve(),
    );
  },
};

interface QuickPickHelpers {
  triggerHide: () => void;
  triggerAccept: () => void;
  triggerChangeValue: (value: string) => void;
}

// Create a mock QuickPick
const createMockQuickPick = (): DeepMocked<
  vscode.QuickPick<MenuQuickPickItem>
> &
  QuickPickHelpers => {
  const handlers = {
    hide: [] as QuickPickHelpers["triggerHide"][],
    accept: [] as QuickPickHelpers["triggerAccept"][],
    changeValue: [] as QuickPickHelpers["triggerChangeValue"][],
  };
  const mock: DeepMocked<vscode.QuickPick<MenuQuickPickItem>> = createMock<
    vscode.QuickPick<MenuQuickPickItem>
  >({
    items: [],
    selectedItems: [],
    value: "",
    placeholder: "",
    matchOnDetail: false,
    matchOnDescription: false,
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
    onDidHide: jest.fn((handler: () => void) => {
      handlers.hide.push(handler);
      return { dispose: jest.fn() };
    }),
    onDidAccept: jest.fn((handler: () => void) => {
      handlers.accept.push(handler);
      return { dispose: jest.fn() };
    }),
    onDidChangeValue: jest.fn((handler: (value: string) => void) => {
      handlers.changeValue.push(handler);
      return { dispose: jest.fn() };
    }),
  });

  const helpers: QuickPickHelpers = {
    triggerHide: () => {
      handlers.hide.forEach(h => {
        h();
      });
    },
    triggerAccept: () => {
      handlers.accept.forEach(h => {
        h();
      });
    },
    triggerChangeValue: (value: string) => {
      handlers.changeValue.forEach(h => {
        h(value);
      });
    },
  };

  return { ...mock, ...helpers };
};

jest.mock("vscode", () => ({
  window: {
    createQuickPick: jest.fn(),
    setStatusBarMessage: jest.fn(),
  },
}));

const mockedVscode = jest.mocked(vscode);

const createMockConfigManager = (
  overrides: Partial<ConfigurationManager> = {},
): DeepMocked<ConfigurationManager> =>
  createMock<ConfigurationManager>({
    bindings: [
      {
        key: "f",
        name: "Format",
        type: "command",
        command: "editor.action.formatDocument",
      },
      {
        key: "s",
        name: "Save",
        type: "command",
        command: "workbench.action.files.save",
      },
      {
        key: "b",
        name: "Buffer",
        type: "submenu",
        items: [
          {
            key: "c",
            name: "Close",
            type: "command",
            command: "workbench.action.closeActiveEditor",
          },
        ],
      },
    ],
    flatBindings: [
      {
        key: "f",
        name: "Format",
        type: "command",
        command: "editor.action.formatDocument",
        path: "f",
      },
      {
        key: "s",
        name: "Save",
        type: "command",
        command: "workbench.action.files.save",
        path: "s",
      },
      {
        key: "c",
        name: "Close",
        type: "command",
        command: "workbench.action.closeActiveEditor",
        path: "bc",
      },
    ],
    sortOrder: "custom",
    showIcons: true,
    showDetail: true,
    keySequenceTimeout: 350,
    dispose: jest.fn(),
    ...overrides,
  });

describe("CommandMenu", () => {
  let mockQuickPick: ReturnType<typeof createMockQuickPick>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteBinding.reset();
    mockQuickPick = createMockQuickPick();
    mockedVscode.window.createQuickPick.mockReturnValue(mockQuickPick);
  });

  describe("show", () => {
    it("should create and show a QuickPick", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();

      expect(mockedVscode.window.createQuickPick).toHaveBeenCalled();
      expect(mockQuickPick.show).toHaveBeenCalled();
    });

    it("should populate items from bindings", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();

      expect(mockQuickPick.items).toHaveLength(3);
    });

    it("should set placeholder without key path initially", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();

      expect(mockQuickPick.placeholder).toBe("Select a command");
    });
  });

  describe("showSearch", () => {
    it("should create and show a search QuickPick", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.showSearch();

      expect(mockedVscode.window.createQuickPick).toHaveBeenCalled();
      expect(mockQuickPick.show).toHaveBeenCalled();
      expect(mockQuickPick.placeholder).toBe("Search commands");
    });

    it("should enable matching on detail and description", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.showSearch();

      expect(mockQuickPick.matchOnDetail).toBe(true);
      expect(mockQuickPick.matchOnDescription).toBe(true);
    });

    it("should execute binding when item is accepted", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.showSearch();

      // Simulate selecting an item
      const selectedBinding = configManager.flatBindings[0];
      (mockQuickPick.selectedItems as unknown[]) = [
        { binding: selectedBinding, label: "test" },
      ];

      // Trigger accept
      mockQuickPick.triggerAccept();

      expect(mockQuickPick.hide).toHaveBeenCalled();
      expect(mockExecuteBinding.fn).toHaveBeenCalledWith(selectedBinding);
    });

    it("should dispose QuickPick on hide", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.showSearch();
      mockQuickPick.triggerHide();

      expect(mockQuickPick.dispose).toHaveBeenCalled();
    });
  });

  describe("key sequence handling", () => {
    it("should execute command on exact key match without longer matches", () => {
      const configManager = createMockConfigManager({
        bindings: [
          {
            key: "f",
            name: "Format",
            type: "command",
            command: "editor.action.formatDocument",
          },
        ] as BindingItem[],
        keySequenceTimeout: 350,
      });
      const menu = new CommandMenu(configManager);

      menu.show();
      mockQuickPick.triggerChangeValue("f");

      expect(mockQuickPick.hide).toHaveBeenCalled();
      expect(mockExecuteBinding.fn).toHaveBeenCalled();
    });

    it("should show status bar message for invalid key", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();
      mockQuickPick.triggerChangeValue("z");

      expect(mockSetStatusBarMessage).toHaveBeenCalledWith(
        expect.stringContaining("No binding for"),
        3500,
      );
      expect(mockQuickPick.hide).toHaveBeenCalled();
    });

    it("should execute immediately when timeout is 0", () => {
      const configManager = createMockConfigManager({
        bindings: [
          { key: "f", name: "Format", type: "command", command: "cmd.f" },
          { key: "fa", name: "Format All", type: "command", command: "cmd.fa" },
        ] as BindingItem[],
        keySequenceTimeout: 0,
      });
      const menu = new CommandMenu(configManager);

      menu.show();
      mockQuickPick.triggerChangeValue("f");

      expect(mockQuickPick.hide).toHaveBeenCalled();
      expect(mockExecuteBinding.fn).toHaveBeenCalled();
    });
  });

  describe("submenu navigation", () => {
    it("should navigate into submenu when selected", async () => {
      const submenuBinding: BindingItem = {
        key: "b",
        name: "Buffer",
        type: "submenu",
        items: [
          {
            key: "c",
            name: "Close",
            type: "command",
            command: "workbench.action.closeActiveEditor",
          },
        ],
      };
      const configManager = createMockConfigManager({
        bindings: [submenuBinding],
      });
      const menu = new CommandMenu(configManager);

      menu.show();

      // Select the submenu item
      (mockQuickPick.selectedItems as unknown[]) = [
        { binding: submenuBinding, label: "test" },
      ];
      mockQuickPick.triggerAccept();

      // Should create a new QuickPick for submenu
      // Wait for async handling
      await Promise.resolve();

      expect(mockedVscode.window.createQuickPick).toHaveBeenCalledTimes(2);
    });

    it("should update placeholder with key path when in submenu", async () => {
      const submenuBinding: BindingItem = {
        key: "b",
        name: "Buffer",
        type: "submenu",
        items: [
          {
            key: "c",
            name: "Close",
            type: "command",
            command: "workbench.action.closeActiveEditor",
          },
        ],
      };
      const configManager = createMockConfigManager({
        bindings: [submenuBinding],
      });
      const menu = new CommandMenu(configManager);

      menu.show();

      // Use key input to navigate to submenu
      mockQuickPick.triggerChangeValue("b");

      // Wait for async handling
      await Promise.resolve();

      // Second QuickPick should have key path in placeholder
      expect(mockQuickPick.placeholder).toContain("[b]");
    });
  });

  describe("accept handler", () => {
    it("should execute command when item is accepted via Enter", () => {
      const binding: BindingItem = {
        key: "f",
        name: "Format",
        type: "command",
        command: "editor.action.formatDocument",
      };
      const configManager = createMockConfigManager({
        bindings: [binding],
      });
      const menu = new CommandMenu(configManager);

      menu.show();

      (mockQuickPick.selectedItems as unknown[]) = [{ binding, label: "test" }];
      mockQuickPick.triggerAccept();

      expect(mockQuickPick.hide).toHaveBeenCalled();
      expect(mockExecuteBinding.fn).toHaveBeenCalledWith(binding);
    });

    it("should not execute when no item is selected", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();

      mockQuickPick.selectedItems = [];
      mockQuickPick.triggerAccept();

      expect(mockExecuteBinding.fn).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should dispose QuickPick and ConfigurationManager", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();
      menu.dispose();

      expect(mockQuickPick.dispose).toHaveBeenCalled();
      expect(configManager.dispose).toHaveBeenCalled();
    });

    it("should handle dispose when QuickPick is not created", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      // Dispose without showing - should not throw
      expect(() => {
        menu.dispose();
      }).not.toThrow();
      expect(configManager.dispose).toHaveBeenCalled();
    });
  });

  describe("hide handler", () => {
    it("should dispose QuickPick when hidden", () => {
      const configManager = createMockConfigManager();
      const menu = new CommandMenu(configManager);

      menu.show();
      mockQuickPick.triggerHide();

      expect(mockQuickPick.dispose).toHaveBeenCalled();
    });
  });
});
