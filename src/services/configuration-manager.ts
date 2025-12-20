import * as vscode from "vscode";
import {
  type BindingItem,
  type WhatKeyConfig,
  type BindingItemWithPath,
  EXTENSION_ID,
  DEFAULT_BINDINGS,
} from "../config";
import {
  deduplicateBindings,
  mergeBindings,
  loadConfig,
  flattenBindings,
} from "../utils";

/**
 * Manages extension configuration and provides typed access to settings
 */
export class ConfigurationManager {
  private readonly disposables: vscode.Disposable[] = [];

  private config: WhatKeyConfig;

  constructor() {
    this.config = loadConfig();
    vscode.workspace.onDidChangeConfiguration(
      e => {
        if (e.affectsConfiguration(EXTENSION_ID)) {
          this.config = loadConfig();
        }
      },
      this,
      this.disposables,
    );
  }

  get bindings(): BindingItem[] {
    const userBindings = this.config.bindings;

    if (userBindings.length === 0) {
      return DEFAULT_BINDINGS;
    }

    if (this.config.bindingsMergeStrategy === "replace") {
      return deduplicateBindings(userBindings).deduplicated;
    }

    return mergeBindings(DEFAULT_BINDINGS, userBindings);
  }

  get flatBindings(): BindingItemWithPath[] {
    return flattenBindings(this.bindings);
  }

  get sortOrder(): "alphabetical" | "custom" {
    return this.config.sortOrder;
  }

  get showIcons(): boolean {
    return this.config.showIcons;
  }

  get showDetail(): boolean {
    return this.config.showDetail;
  }

  get keySequenceTimeout(): number {
    return this.config.keySequenceTimeout;
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
