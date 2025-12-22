// Mock for VS Code API
export const window = {
  showQuickPick: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  createQuickPick: jest.fn(() => ({
    items: [],
    value: "",
    placeholder: "",
    title: "",
    onDidChangeValue: jest.fn(),
    onDidAccept: jest.fn(),
    onDidHide: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  })),
};

export const commands = {
  executeCommand: jest.fn(),
  registerCommand: jest.fn(),
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn(),
    inspect: jest.fn(),
  })),
  onDidChangeConfiguration: jest.fn(),
};

export const Uri = {
  file: jest.fn((path: string) => ({ fsPath: path, path })),
  parse: jest.fn((uri: string) => ({ fsPath: uri, path: uri })),
};

export const ThemeIcon = jest.fn((id: string) => ({ id }));

export enum QuickPickItemKind {
  Separator = -1,
  Default = 0,
}

export const Disposable = {
  from: jest.fn(),
};

export interface ExtensionContext {
  subscriptions: { dispose: () => void }[];
  extensionPath: string;
  globalState: {
    get: typeof jest.fn;
    update: typeof jest.fn;
  };
  workspaceState: {
    get: typeof jest.fn;
    update: typeof jest.fn;
  };
}
