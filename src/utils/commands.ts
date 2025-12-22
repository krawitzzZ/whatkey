import * as vscode from "vscode";
import type { BindingItem } from "../config";

/**
 * Executes a binding (command or commands) and handles errors
 */
export const executeBinding = async (binding: BindingItem): Promise<void> => {
  try {
    switch (binding.type) {
      case "command":
        await executeCommand(binding);
        break;
      case "commands":
        await executeCommands(binding.commands);
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(
      `WhatKey: Failed to execute command - ${message}`,
    );
  }
};

const executeCommand = async (input: CommandInput): Promise<void> => {
  const args =
    typeof input !== "string" && "args" in input ? input.args : empty;
  const cmd = typeof input === "string" ? input : input.command;
  const cmdArgs = args === empty ? [] : [args];

  await vscode.commands.executeCommand(cmd, ...cmdArgs);
};

const executeCommands = async (inputs: CommandInput[]): Promise<void> => {
  for (const cmd of inputs) {
    await executeCommand(cmd);
  }
};

/**
 * A unique symbol to represent absence of arguments
 */
const empty = Symbol("empty");

/**
 * Type representing a command input, which can be a string or an object with command and optional args
 */
type CommandInput = string | { command: string; args?: unknown };
