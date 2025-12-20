import type { BindingItem, WhatKeyConfig } from "./schema";

/**
 * Extension identifier
 */
export const EXTENSION_ID = "whatkey";

/**
 * Extension name
 */
export const EXTENSION_NAME = "WhatKey";

/**
 * Default key sequence timeout in milliseconds
 */
export const DEFAULT_KEY_SEQUENCE_TIMEOUT_MS = 350; // milliseconds

/**
 * Default bindings for demonstration
 */
export const DEFAULT_BINDINGS: BindingItem[] = [
  // TODO(nikita.demin): remove l example
  {
    key: "l",
    name: "Nested Example",
    icon: "folder",
    type: "submenu",
    items: [
      {
        key: "s",
        name: "Save",
        icon: "save",
        type: "command",
        command: "workbench.action.files.save",
      },
      {
        key: "L",
        name: "Nested Level 2",
        icon: "folder",
        type: "submenu",
        items: [
          {
            key: "a",
            name: "Nested Level 3",
            icon: "save-all",
            type: "command",
            command: "workbench.action.files.save",
          },
        ],
      },
    ],
  },
  {
    key: "b",
    name: "Buffer/Editor",
    icon: "code-oss",
    detail: "File and editor commands",
    type: "submenu",
    items: [
      {
        key: "s",
        name: "Save",
        icon: "save",
        type: "command",
        command: "workbench.action.files.save",
      },
      {
        key: "S",
        name: "Save All",
        icon: "save-all",
        type: "command",
        command: "workbench.action.files.saveAll",
      },
      {
        key: "c",
        name: "Close Editor",
        icon: "close",
        type: "command",
        command: "workbench.action.closeActiveEditor",
      },
      {
        key: "C",
        name: "Close All Editors",
        icon: "close-all",
        type: "command",
        command: "workbench.action.closeAllEditors",
      },
      {
        key: "f",
        name: "Format Document",
        icon: "json",
        type: "command",
        command: "editor.action.formatDocument",
      },
      {
        key: "F",
        name: "Format and Save Document",
        icon: "json",
        type: "commands",
        commands: [
          "editor.action.formatDocument",
          "workbench.action.files.save",
        ],
      },
    ],
  },
  {
    key: "c",
    name: "Code action",
    icon: "file-code",
    detail: "Code action/editing commands",
    type: "submenu",
    items: [
      {
        key: "a",
        name: "Trigger QuickFix Action",
        icon: "lightbulb",
        type: "command",
        command: "editor.action.quickFix",
      },
      {
        key: "t",
        name: "Trigger Inline Suggestion",
        icon: "lightbulb-sparkle",
        type: "command",
        command: "editor.action.inlineSuggest.trigger",
      },
      {
        key: "s",
        name: "Accept Inline Suggestion",
        icon: "lightbulb-autofix",
        type: "command",
        command: "editor.action.inlineSuggest.commit",
      },
      {
        key: "r",
        name: "Rename Symbol",
        icon: "rename",
        type: "command",
        command: "editor.action.rename",
      },
    ],
  },
  {
    key: "g",
    name: "Navigate",
    icon: "milestone",
    detail: "Go to, navigate and symbol commands",
    type: "submenu",
    items: [
      {
        key: "a",
        name: "Go to References",
        icon: "references",
        type: "command",
        command: "editor.action.goToReferences",
      },
      {
        key: "d",
        name: "Go to Definition",
        icon: "symbol-class",
        type: "command",
        command: "editor.action.revealDefinition",
      },
      {
        key: "i",
        name: "Go to Implementation",
        icon: "symbol-interface",
        type: "command",
        command: "editor.action.goToImplementation",
      },
      {
        key: "c",
        name: "Go to Call Hierarchy",
        icon: "symbol-method",
        type: "command",
        command: "editor.showCallHierarchy",
      },
      {
        key: "h",
        name: "Go to Type Hierarchy",
        icon: "type-hierarchy",
        type: "command",
        command: "editor.showTypeHierarchy",
      },
      {
        key: "s",
        name: "Go to Symbol",
        icon: "mention",
        type: "command",
        command: "workbench.action.gotoSymbol",
      },
      {
        key: "S",
        name: "Go to Symbol in Workspace",
        icon: "symbol-numeric",
        type: "command",
        command: "workbench.action.showAllSymbols",
      },
    ],
  },
  {
    key: "p",
    type: "submenu",
    name: "Project",
    icon: "root-folder",
    detail: "Project and workspace commands",
    items: [
      {
        key: "of",
        name: "Open File",
        icon: "file",
        type: "command",
        command: "workbench.action.files.openFile",
      },
      {
        key: "od",
        name: "Open Directory",
        icon: "folder-opened",
        type: "command",
        command: "workbench.action.files.openFolder",
      },
      {
        key: "r",
        name: "Open Recent",
        icon: "history",
        type: "command",
        command: "workbench.action.openRecent",
      },
      {
        key: "R",
        name: "Reload Window",
        icon: "refresh",
        type: "command",
        command: "workbench.action.reloadWindow",
      },
    ],
  },
  {
    key: "s",
    name: "Search",
    icon: "go-to-search",
    detail: "Search commands",
    type: "submenu",
    items: [
      {
        key: "f",
        name: "Find in File",
        icon: "search-fuzzy",
        type: "command",
        command: "actions.find",
      },
      {
        key: "F",
        name: "Find in Project",
        icon: "search-sparkle",
        type: "command",
        command: "workbench.action.findInFiles",
      },
      {
        key: "r",
        name: "Replace in File",
        icon: "replace",
        type: "command",
        command: "editor.action.startFindReplaceAction",
      },
      {
        key: "R",
        name: "Replace in Project",
        icon: "replace-all",
        type: "command",
        command: "workbench.action.replaceInFiles",
      },
    ],
  },
  {
    key: "t",
    name: "Terminal",
    icon: "terminal",
    detail: "Terminal commands",
    type: "submenu",
    items: [
      {
        key: "n",
        name: "Crete New Terminal",
        icon: "terminal",
        type: "command",
        command: "workbench.action.terminal.new",
      },
    ],
  },
  {
    key: "v",
    name: "View",
    icon: "editor-layout",
    type: "submenu",
    detail: "View and layout commands",
    items: [
      {
        key: "v",
        name: "Split Vertical",
        icon: "split-horizontal",
        type: "command",
        command: "workbench.action.splitEditor",
      },
      {
        key: "s",
        name: "Split Horizontal",
        icon: "split-vertical",
        type: "command",
        command: "workbench.action.splitEditorDown",
      },
    ],
  },

  // Simple commands
  {
    key: "f",
    name: "Format Document",
    type: "command",
    icon: "json",
    command: "editor.action.formatDocument",
  },
  {
    key: "F",
    name: "Format and Save Document",
    type: "commands",
    icon: "json",
    commands: ["editor.action.formatDocument", "workbench.action.files.save"],
  },
  {
    key: "q",
    name: "Close Editor",
    type: "command",
    icon: "close",
    command: "workbench.action.closeActiveEditor",
  },
  {
    key: "qa",
    name: "Close All Editors",
    type: "command",
    icon: "close-all",
    command: "workbench.action.closeAllEditors",
  },
  {
    key: "w",
    name: "Write",
    icon: "save",
    type: "command",
    command: "workbench.action.files.save",
  },
  {
    key: "wq",
    name: "Write and Close Editor",
    icon: "save-all",
    type: "commands",
    detail: "Save and close the current editor",
    commands: [
      "workbench.action.files.save",
      "workbench.action.closeActiveEditor",
    ],
  },
];

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: WhatKeyConfig = {
  bindings: DEFAULT_BINDINGS,
  keySequenceTimeout: DEFAULT_KEY_SEQUENCE_TIMEOUT_MS,
  bindingsMergeStrategy: "merge",
  sortOrder: "custom",
  showIcons: true,
  showDetail: true,
};
