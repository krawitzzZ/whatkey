import * as vscode from "vscode";
import type { BindingItem } from "../config";
import type { ConfigurationManager } from "./configuration-manager";
import {
  executeBinding,
  getCommandDetail,
  getDescription,
  getLabel,
  sortBindings,
} from "../utils";

interface MenuQuickPickItem extends vscode.QuickPickItem {
  binding: BindingItem;
}

/**
 * Handles the command menu UI using VS Code's QuickPick
 */
export class CommandMenu {
  private readonly configManager: ConfigurationManager;

  private currentPath: string[] = [];

  private quickPick: vscode.QuickPick<MenuQuickPickItem> | undefined;

  constructor(configManager: ConfigurationManager) {
    this.configManager = configManager;
  }

  /**
   * Shows the command menu starting from root bindings
   */
  show(): void {
    this.currentPath = [];
    this.showBindings(this.configManager.bindings);
  }

  /**
   * Shows a searchable menu of all commands (flattened)
   */
  showSearch(): void {
    const items: MenuQuickPickItem[] = sortBindings(
      this.configManager.flatBindings,
      this.configManager.sortOrder,
    ).map(binding => ({
      binding,
      label: getLabel(binding, this.configManager.showIcons),
      description: getDescription(binding),
      detail: getCommandDetail(binding, this.configManager.showDetail),
    }));

    const quickPick = vscode.window.createQuickPick<MenuQuickPickItem>();
    quickPick.items = items;
    quickPick.placeholder = "Search commands";
    quickPick.matchOnDetail = true;
    quickPick.matchOnDescription = true;

    quickPick.onDidHide(() => {
      quickPick.dispose();
    });

    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      if (selected) {
        quickPick.hide();
        executeBinding(selected.binding).catch(console.error);
      }
    });

    quickPick.show();
  }

  /**
   * Disposes resources used by the command menu
   */
  dispose(): void {
    this.quickPick?.dispose();
    this.configManager.dispose();
  }

  private showBindings(bindings: BindingItem[]): void {
    const keys = this.currentPath.join("");
    const sortedBindings = sortBindings(bindings, this.configManager.sortOrder);
    const items: MenuQuickPickItem[] = sortedBindings.map(binding => ({
      binding,
      label: getLabel(binding, this.configManager.showIcons),
      description: getDescription(binding),
      detail: getCommandDetail(binding, this.configManager.showDetail),
    }));

    this.quickPick?.dispose();
    this.quickPick = vscode.window.createQuickPick<MenuQuickPickItem>();
    this.quickPick.items = items;
    this.quickPick.placeholder =
      keys.length > 0 ? `[${keys}] Select a command` : "Select a command";

    const timeout = this.configManager.keySequenceTimeout;
    let keyTimeout: ReturnType<typeof setTimeout> | undefined;
    const removeTimeout = (): void => {
      if (keyTimeout !== undefined) {
        clearTimeout(keyTimeout);
        keyTimeout = undefined;
      }
    };

    this.quickPick.onDidHide(() => {
      removeTimeout();
      this.quickPick?.dispose();
      this.quickPick = undefined;
    });

    this.quickPick.onDidChangeValue(newKey => {
      removeTimeout();

      const exactMatch = sortedBindings.find(b => b.key === newKey);
      if (exactMatch) {
        const hasLongerMatch = sortedBindings.some(
          b => b.key.startsWith(newKey) && b.key.length > newKey.length,
        );

        if (!hasLongerMatch || timeout === 0) {
          this.quickPick?.hide();
          this.handleBindingSelection(exactMatch).catch(console.error);
          return;
        }

        keyTimeout = setTimeout(() => {
          this.quickPick?.hide();
          this.handleBindingSelection(exactMatch).catch(console.error);
        }, timeout);
        return;
      }

      const hasPrefix = sortedBindings.some(b => b.key.startsWith(newKey));
      if (!hasPrefix) {
        const msg = `No binding for '${keys}${newKey}'`;
        vscode.window.setStatusBarMessage(msg, 3500);
        this.quickPick?.hide();
      }
    });

    this.quickPick.onDidAccept(() => {
      removeTimeout();
      const selected = this.quickPick?.selectedItems[0];
      if (selected) {
        this.quickPick?.hide();
        this.handleBindingSelection(selected.binding).catch(console.error);
      }
    });

    this.quickPick.show();
  }

  private async handleBindingSelection(binding: BindingItem): Promise<void> {
    if (binding.type === "submenu") {
      this.currentPath.push(binding.key);
      this.showBindings(binding.items);
    } else {
      await executeBinding(binding);
    }
  }
}
