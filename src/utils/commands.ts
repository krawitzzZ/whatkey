import * as vscode from "vscode";
import type { BindingItem, CommandBinding, CommandsBinding } from "../config";

export const executeBinding = async (binding: BindingItem): Promise<void> => {
  try {
    if (binding.type === "command") {
      await executeCommand(binding);
    } else if (binding.type === "commands") {
      await executeCommands(binding);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(
      `WhatKey: Failed to execute command - ${message}`,
    );
  }
};

export const executeCommand = async (
  binding: CommandBinding,
): Promise<void> => {
  if (binding.args !== undefined) {
    await vscode.commands.executeCommand(binding.command, binding.args);
  } else {
    await vscode.commands.executeCommand(binding.command);
  }
};

export const executeCommands = async (
  binding: CommandsBinding,
): Promise<void> => {
  for (const cmd of binding.commands) {
    if (typeof cmd === "string") {
      await vscode.commands.executeCommand(cmd);
      continue;
    }

    if (cmd.args !== undefined) {
      await vscode.commands.executeCommand(cmd.command, cmd.args);
    } else {
      await vscode.commands.executeCommand(cmd.command);
    }
  }
};
