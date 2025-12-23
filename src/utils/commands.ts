import * as vscode from "vscode";
import { spawn, type SpawnOptions } from "node:child_process";
import {
  EXTENSION_ID,
  EXTENSION_NAME,
  type BindingItem,
  type ShellBinding,
} from "../config";
import { showErrorMessage, showInformationMessage } from "./notify";

/**
 * Output channel for shell command output
 */
let outputChannel: vscode.OutputChannel | undefined;
let terminal: vscode.Terminal | undefined;

const getOutputChannel = (): vscode.OutputChannel => {
  outputChannel ??= vscode.window.createOutputChannel(EXTENSION_ID);
  return outputChannel;
};

const getTerminal = (): vscode.Terminal => {
  if (terminal && !vscode.window.terminals.includes(terminal)) {
    terminal = undefined;
  }
  terminal ??= vscode.window.createTerminal(`${EXTENSION_NAME} Shell`);
  return terminal;
};

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
      case "shell":
        await executeShell(binding);
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    showErrorMessage(`Failed to execute command: ${message}`);
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
 * Executes a shell command with configurable output handling.
 */
const executeShell = async (binding: ShellBinding): Promise<void> => {
  const outputMode = binding.output;

  switch (outputMode) {
    case "terminal":
      executeShellInTerminal(binding);
      break;
    case "silent":
    case "channel":
    case "notification":
      await executeShellInBackground(binding, outputMode);
      break;
  }
};

/**
 * Executes a shell command in a visible terminal.
 * Reuses the same terminal instance and changes directory with cd.
 */
const executeShellInTerminal = (binding: ShellBinding): void => {
  const term = getTerminal();
  const shell = term.state.shell as ShellType;
  const wsFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const cwd = binding.cwd ?? wsFolder;
  const args = binding.args ?? [];
  const cmd = [cd(cwd, shell), binding.command].filter(Boolean).join(" && ");
  const fullCommand = [cmd, ...args].join(" ");

  term.sendText(fullCommand);
  term.show(true);
};

/**
 * Executes a shell command in the background with optional output capture.
 */
const executeShellInBackground = async (
  binding: ShellBinding,
  outputMode: "silent" | "channel" | "notification",
): Promise<void> => {
  const args = binding.args ?? [];
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const cwd = binding.cwd ?? workspaceFolder;
  const fullCommand = [binding.command, ...args].join(" ");

  const isSilent = outputMode === "silent";

  const options: SpawnOptions = {
    cwd,
    detached: isSilent,
    stdio: isSilent ? "ignore" : "pipe",
    shell: true,
  };

  return new Promise((resolve, reject) => {
    const process = spawn(binding.command, args, options);

    process.on("error", error => {
      reject(new Error(`Failed to start shell command: ${error.message}`));
    });

    if (isSilent) {
      process.unref();
      resolve();
      return;
    }

    let stdout = "";
    let stderr = "";

    process.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    process.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    process.on("close", code => {
      const isSuccess = code === 0;

      switch (outputMode) {
        case "notification": {
          const message =
            (isSuccess ? stdout : stderr).trim().substring(0, 200) ||
            `Command exited with code ${String(code)}`;
          const showMessage = isSuccess
            ? showInformationMessage
            : showErrorMessage;

          showMessage(`${binding.name}: ${message}`);
          break;
        }

        case "channel": {
          const channel = getOutputChannel();
          channel.appendLine(
            `[${new Date().toLocaleTimeString()}] $ ${fullCommand} (Exit code: ${String(code)})`,
          );
          if (stdout.trim()) {
            channel.appendLine(stdout);
          }
          if (stderr.trim()) {
            channel.appendLine(`[stderr] ${stderr}`);
          }
          channel.appendLine("");
          channel.show(true);
          break;
        }
      }

      resolve();
    });
  });
};

/**
 * A unique symbol to represent absence of arguments
 */
const empty = Symbol("empty");

/**
 * Shells that use single-quote escaping (Unix-style).
 * Single quotes preserve literal strings; embedded single quotes use: '\''
 */
const singleQuoteShells = new Set<ShellType>([
  "bash",
  "zsh",
  "sh",
  "ksh",
  "csh",
  "fish",
  "gitbash",
  "wsl",
]);

/**
 * Shells that use double-quote escaping.
 * - cmd: escape double quotes with ""
 * - pwsh: escape double quotes with `" or ""
 * - nu: escape double quotes with \"
 */
const doubleQuoteShells = new Set<ShellType>(["cmd", "pwsh", "nu"]);

/**
 * Escapes a path for safe use in a shell cd command.
 * Handles differences between shell types based on their quoting rules.
 */
const escapePathForShell = (path: string, shell: ShellType): string => {
  if (singleQuoteShells.has(shell)) {
    // Unix-style: wrap in single quotes, escape embedded single quotes
    return `'${path.replace(/'/g, "'\\''")}'`;
  }

  if (doubleQuoteShells.has(shell)) {
    // Double-quote shells: wrap in double quotes, escape embedded double quotes
    // Using "" works for cmd and pwsh; nu also accepts \"
    return `"${path.replace(/"/g, '""')}"`;
  }

  // Unknown shell or REPL (node, python, julia) - use platform as fallback
  if (process.platform === "win32") {
    return `"${path.replace(/"/g, '""')}"`;
  }

  return `'${path.replace(/'/g, "'\\''")}'`;
};

/**
 * Builds a cd command appropriate for the detected shell type.
 */
const cd = (cwd: string | undefined, shell: ShellType): string | undefined =>
  cwd === undefined ? undefined : `cd ${escapePathForShell(cwd, shell)}`;

/**
 * Type representing a command input, which can be a string or an object with command and optional args
 */
type CommandInput = string | { command: string; args?: unknown };

/**
 * Shell type alias for easier reference {@link vscode.Terminal["state"]["shell"]}
 */
type ShellType =
  | "bash"
  | "cmd"
  | "csh"
  | "fish"
  | "gitbash"
  | "julia"
  | "ksh"
  | "node"
  | "nu"
  | "pwsh"
  | "python"
  | "sh"
  | "wsl"
  | "zsh";
