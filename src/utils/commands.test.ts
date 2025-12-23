import * as vscode from "vscode";
import type {
  CommandBinding,
  CommandsBinding,
  ShellBinding,
  SubmenuBinding,
} from "../config";
import { executeBinding } from "./commands";

// Create mock for spawn
const mockSpawn = jest.fn();
const mockOn = jest.fn();
const mockUnref = jest.fn();
const mockStdoutOn = jest.fn();
const mockStderrOn = jest.fn();

jest.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => {
    mockSpawn(...args);
    return {
      on: mockOn,
      unref: mockUnref,
      stdout: { on: mockStdoutOn },
      stderr: { on: mockStderrOn },
    };
  },
}));

const mockCreateTerminal = jest.fn();
const mockTerminalSendText = jest.fn();
const mockTerminalShow = jest.fn();
const mockOutputChannelAppendLine = jest.fn();
const mockOutputChannelShow = jest.fn();
const mockCreateOutputChannel = jest.fn();

jest.mock("vscode", () => ({
  commands: {
    executeCommand: jest.fn(),
  },
  window: {
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    terminals: [],
    createTerminal: (...args: unknown[]) => {
      mockCreateTerminal(...args);
      return {
        sendText: mockTerminalSendText,
        show: mockTerminalShow,
        state: { shell: "bash" },
      };
    },
    createOutputChannel: (...args: unknown[]) => {
      mockCreateOutputChannel(...args);
      return {
        appendLine: mockOutputChannelAppendLine,
        show: mockOutputChannelShow,
      };
    },
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: "/workspace" } }],
  },
}));

const mockedVscode = jest.mocked(vscode);

describe("executeBinding", () => {
  it("should execute a command binding", async () => {
    const binding: CommandBinding = {
      key: "f",
      name: "Format",
      type: "command",
      command: "editor.action.formatDocument",
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledWith(
      "editor.action.formatDocument",
    );
  });

  it("should execute a commands binding", async () => {
    const binding: CommandsBinding = {
      key: "s",
      name: "Save All",
      type: "commands",
      commands: ["cmd.a", "cmd.b"],
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(2);
    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledWith("cmd.a");
    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledWith("cmd.b");
  });

  it("should not execute submenu binding", async () => {
    const binding: SubmenuBinding = {
      key: "f",
      name: "File",
      type: "submenu",
      items: [],
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).not.toHaveBeenCalled();
  });

  it("should show error message when command execution fails", async () => {
    const binding: CommandBinding = {
      key: "f",
      name: "Fail",
      type: "command",
      command: "nonexistent.command",
    };

    mockedVscode.commands.executeCommand.mockRejectedValueOnce(
      new Error("Command not found"),
    );

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
      "WhatKey => Failed to execute command: Command not found",
    );
  });

  it("should handle non-Error exceptions", async () => {
    const binding: CommandBinding = {
      key: "f",
      name: "Fail",
      type: "command",
      command: "bad.command",
    };

    mockedVscode.commands.executeCommand.mockRejectedValueOnce("string error");

    await executeBinding(binding);

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
      "WhatKey => Failed to execute command: Unknown error",
    );
  });
});

describe("executeBinding => CommandBinding", () => {
  it("should execute command without args", async () => {
    const binding: CommandBinding = {
      key: "f",
      name: "Format",
      type: "command",
      command: "editor.action.formatDocument",
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledWith(
      "editor.action.formatDocument",
    );
  });

  it("should execute command with args", async () => {
    const binding: CommandBinding = {
      key: "t",
      name: "Type Text",
      type: "command",
      command: "type",
      args: { text: "hello" },
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledWith("type", {
      text: "hello",
    });
  });
});

describe("executeBinding => CommandsBinding", () => {
  it("should execute multiple string commands in sequence", async () => {
    const binding: CommandsBinding = {
      key: "s",
      name: "Save All",
      type: "commands",
      commands: [
        "workbench.action.files.saveAll",
        "workbench.action.closeActiveEditor",
      ],
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(2);
    expect(mockedVscode.commands.executeCommand).toHaveBeenNthCalledWith(
      1,
      "workbench.action.files.saveAll",
    );
    expect(mockedVscode.commands.executeCommand).toHaveBeenNthCalledWith(
      2,
      "workbench.action.closeActiveEditor",
    );
  });

  it("should execute command objects without args", async () => {
    const binding: CommandsBinding = {
      key: "s",
      name: "Save",
      type: "commands",
      commands: [{ command: "workbench.action.files.save" }],
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledWith(
      "workbench.action.files.save",
    );
  });

  it("should execute command objects with args", async () => {
    const binding: CommandsBinding = {
      key: "t",
      name: "Type Multiple",
      type: "commands",
      commands: [
        { command: "type", args: { text: "hello" } },
        { command: "type", args: { text: " world" } },
      ],
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(2);
    expect(mockedVscode.commands.executeCommand).toHaveBeenNthCalledWith(
      1,
      "type",
      { text: "hello" },
    );
    expect(mockedVscode.commands.executeCommand).toHaveBeenNthCalledWith(
      2,
      "type",
      { text: " world" },
    );
  });

  it("should handle mixed string and object commands", async () => {
    const binding: CommandsBinding = {
      key: "m",
      name: "Mixed",
      type: "commands",
      commands: [
        "workbench.action.files.save",
        { command: "type", args: { text: "saved" } },
      ],
    };

    await executeBinding(binding);

    expect(mockedVscode.commands.executeCommand).toHaveBeenCalledTimes(2);
    expect(mockedVscode.commands.executeCommand).toHaveBeenNthCalledWith(
      1,
      "workbench.action.files.save",
    );
    expect(mockedVscode.commands.executeCommand).toHaveBeenNthCalledWith(
      2,
      "type",
      { text: "saved" },
    );
  });
});

describe("executeBinding => ShellBinding", () => {
  beforeEach(() => {
    mockSpawn.mockClear();
    mockOn.mockClear();
    mockUnref.mockClear();
    mockStdoutOn.mockClear();
    mockStderrOn.mockClear();
    mockCreateTerminal.mockClear();
    mockTerminalSendText.mockClear();
    mockTerminalShow.mockClear();
    mockOutputChannelAppendLine.mockClear();
    mockOutputChannelShow.mockClear();
    mockCreateOutputChannel.mockClear();
    mockedVscode.window.showInformationMessage =
      jest.fn() as typeof mockedVscode.window.showInformationMessage;
    mockedVscode.window.showErrorMessage =
      jest.fn() as typeof mockedVscode.window.showErrorMessage;
  });

  it("should execute a shell command with silent output (default)", async () => {
    const binding: ShellBinding = {
      key: "g",
      name: "Git Status",
      type: "shell",
      command: "git",
      args: ["status"],
      output: "silent",
    };

    await executeBinding(binding);

    expect(mockSpawn).toHaveBeenCalledWith("git", ["status"], {
      cwd: "/workspace",
      detached: true,
      stdio: "ignore",
      shell: true,
    });
    expect(mockUnref).toHaveBeenCalled();
  });

  it("should execute a shell command with explicit silent output", async () => {
    const binding: ShellBinding = {
      key: "l",
      name: "List",
      type: "shell",
      command: "ls",
      output: "silent",
    };

    await executeBinding(binding);

    expect(mockSpawn).toHaveBeenCalledWith("ls", [], {
      cwd: "/workspace",
      detached: true,
      stdio: "ignore",
      shell: true,
    });
    expect(mockUnref).toHaveBeenCalled();
  });

  it("should use custom cwd when provided", async () => {
    const binding: ShellBinding = {
      key: "b",
      name: "Build",
      type: "shell",
      command: "npm",
      args: ["run", "build"],
      cwd: "/custom/path",
      output: "silent",
    };

    await executeBinding(binding);

    expect(mockSpawn).toHaveBeenCalledWith("npm", ["run", "build"], {
      cwd: "/custom/path",
      detached: true,
      stdio: "ignore",
      shell: true,
    });
  });

  it("should execute shell command in terminal when output is 'terminal'", async () => {
    const binding: ShellBinding = {
      key: "t",
      name: "Test",
      type: "shell",
      command: "npm",
      args: ["test"],
      output: "terminal",
    };

    await executeBinding(binding);

    expect(mockCreateTerminal).toHaveBeenCalledWith("WhatKey Shell");
    expect(mockTerminalSendText).toHaveBeenCalledWith(
      "cd '/workspace' && npm test",
    );
    expect(mockTerminalShow).toHaveBeenCalledWith(true);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it("should execute shell command with channel output", async () => {
    const binding: ShellBinding = {
      key: "c",
      name: "Check",
      type: "shell",
      command: "pnpm",
      args: ["check"],
      output: "channel",
    };

    // Setup mock to simulate successful command
    mockOn.mockImplementation((event, callback) => {
      if (event === "close") {
        callback(0);
      }
    });
    mockStdoutOn.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(Buffer.from("All checks passed\n"));
      }
    });

    await executeBinding(binding);

    expect(mockSpawn).toHaveBeenCalledWith("pnpm", ["check"], {
      cwd: "/workspace",
      detached: false,
      stdio: "pipe",
      shell: true,
    });
    expect(mockCreateOutputChannel).toHaveBeenCalledWith("whatkey");
    expect(mockOutputChannelShow).toHaveBeenCalledWith(true);
  });

  it("should show notification on successful command with notification output", async () => {
    const binding: ShellBinding = {
      key: "n",
      name: "Notify",
      type: "shell",
      command: "echo",
      args: ["hello"],
      output: "notification",
    };

    mockOn.mockImplementation((event, callback) => {
      if (event === "close") {
        callback(0);
      }
    });
    mockStdoutOn.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(Buffer.from("hello\n"));
      }
    });

    await executeBinding(binding);

    expect(mockSpawn).toHaveBeenCalledWith("echo", ["hello"], {
      cwd: "/workspace",
      detached: false,
      stdio: "pipe",
      shell: true,
    });
    expect(mockedVscode.window.showInformationMessage).toHaveBeenCalledWith(
      "WhatKey => Notify: hello",
    );
  });

  it("should show error notification on failed command with notification output", async () => {
    const binding: ShellBinding = {
      key: "f",
      name: "Fail",
      type: "shell",
      command: "false",
      output: "notification",
    };

    mockOn.mockImplementation((event, callback) => {
      if (event === "close") {
        callback(1);
      }
    });
    mockStderrOn.mockImplementation((event, callback) => {
      if (event === "data") {
        callback(Buffer.from("Command failed\n"));
      }
    });

    await executeBinding(binding);

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
      "WhatKey => Fail: Command failed",
    );
  });

  it("should handle spawn error", async () => {
    const binding: ShellBinding = {
      key: "e",
      name: "Error",
      type: "shell",
      command: "nonexistent-command",
      output: "silent",
    };

    mockOn.mockImplementation((event, callback) => {
      if (event === "error") {
        callback(new Error("spawn ENOENT"));
      }
    });

    await executeBinding(binding);

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
      "WhatKey => Failed to execute command: Failed to start shell command: spawn ENOENT",
    );
  });
});
