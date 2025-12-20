import * as vscode from "vscode";
import { ConfigurationManager, CommandMenu } from "./services";

let commandMenu: CommandMenu | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log("WhatKey extension is now active");

  commandMenu = new CommandMenu(new ConfigurationManager());

  const showCommand = vscode.commands.registerCommand("whatkey.show", () =>
    commandMenu?.show(),
  );

  const searchCommand = vscode.commands.registerCommand("whatkey.search", () =>
    commandMenu?.showSearch(),
  );

  context.subscriptions.push(showCommand, searchCommand, {
    dispose: (): void => {
      commandMenu?.dispose();
    },
  });
}

export function deactivate(): void {
  commandMenu?.dispose();
  commandMenu = undefined;
  console.log("WhatKey extension is now deactivated");
}
