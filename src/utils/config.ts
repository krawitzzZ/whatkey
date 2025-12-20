import * as vscode from "vscode";
import {
  type BindingItem,
  type WhatKeyConfig,
  validateConfig,
  EXTENSION_ID,
  DEFAULT_CONFIG,
  DEFAULT_KEY_SEQUENCE_TIMEOUT_MS,
} from "../config";
import { deduplicateBindings } from "./bindings";

export const loadConfig = (): WhatKeyConfig => {
  const vsConfig = vscode.workspace.getConfiguration(EXTENSION_ID);

  const rawConfig = {
    bindings: vsConfig.get<BindingItem[]>("bindings") ?? [],
    bindingsMergeStrategy:
      vsConfig.get<"merge" | "replace">("bindingsMergeStrategy") ?? "merge",
    sortOrder: vsConfig.get<"alphabetical" | "custom">("sortOrder") ?? "custom",
    showIcons: vsConfig.get<boolean>("showIcons") ?? true,
    showDetail: vsConfig.get<boolean>("showDetail") ?? true,
    keySequenceTimeout:
      vsConfig.get<number>("keySequenceTimeout") ??
      DEFAULT_KEY_SEQUENCE_TIMEOUT_MS,
  };

  const result = validateConfig(rawConfig);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map(e => formatValidationError(e))
      .join("\n");
    vscode.window.showErrorMessage(
      `WhatKey: Invalid configuration\n${errorMessages}`,
    );

    return DEFAULT_CONFIG;
  }

  if (result.data.bindings.length > 0) {
    const { duplicates } = deduplicateBindings(result.data.bindings);
    if (duplicates.length > 0) {
      const paths = duplicates.map(d => `'${d.path}${d.key}'`).join(", ");
      void vscode.window.showInformationMessage(
        `WhatKey: Duplicate keys found in config: ${paths}. First occurrence will be used.`,
      );
    }
  }

  return result.data;
};

/**
 * Formats a Zod validation error into a user-friendly message
 */
const formatValidationError = (error: {
  path: (string | number)[];
  message: string;
  code: string;
}): string => {
  const path = error.path
    .map(p => (typeof p === "number" ? `[${String(p)}]` : `.${p}`))
    .join("")
    .replace(/^\./, "");

  const readablePath = path
    .replace(/bindings(\[\d+\])/g, "bindings$1")
    .replace(/items(\[\d+\])/g, "items$1");

  if (error.code === "invalid_union_discriminator") {
    return `${readablePath}: Invalid type. Must be "command", "commands", or "submenu"`;
  }

  return `${readablePath}: ${error.message}`;
};
