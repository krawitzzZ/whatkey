import * as vscode from "vscode";
import { EXTENSION_NAME } from "../config";

export const showInformationMessage = (message: string): void => {
  vscode.window.showInformationMessage(`${EXTENSION_NAME} => ${message}`);
};

export const showWarningMessage = (message: string): void => {
  vscode.window.showWarningMessage(`${EXTENSION_NAME} => ${message}`);
};

export const showErrorMessage = (message: string): void => {
  vscode.window.showErrorMessage(`${EXTENSION_NAME} => ${message}`);
};

export const setStatusBarMessage = (
  message: string,
  timeoutMs?: number,
): vscode.Disposable => {
  const fullMessage = `${EXTENSION_NAME} => ${message}`;
  if (timeoutMs !== undefined) {
    return vscode.window.setStatusBarMessage(fullMessage, timeoutMs);
  }
  return vscode.window.setStatusBarMessage(fullMessage);
};
