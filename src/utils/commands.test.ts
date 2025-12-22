import * as vscode from "vscode";
import type {
  CommandBinding,
  CommandsBinding,
  SubmenuBinding,
} from "../config";
import { executeBinding } from "./commands";

jest.mock("vscode", () => ({
  commands: {
    executeCommand: jest.fn(),
  },
  window: {
    showErrorMessage: jest.fn(),
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
      "WhatKey: Failed to execute command - Command not found",
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
      "WhatKey: Failed to execute command - Unknown error",
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
