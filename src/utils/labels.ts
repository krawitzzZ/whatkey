import type { BindingItem, BindingItemWithPath } from "../config";

export const getLabel = (
  binding: BindingItem | BindingItemWithPath,
    showIcons: boolean ,
): string => {
  const icon = getIcon(binding, showIcons);
  return `${icon}${("path" in binding ? binding.path : binding.key).padEnd(2, " ")}`;
};

/**
 * Gets the icon string for a binding, considering configuration.
 * Adds an extra 2 spaces after the icon for better readability.
 */
export const getIcon = (binding: BindingItem, showIcons: boolean): string => {
  if (!showIcons) {
    return "";
  }

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (binding.icon) {
    return `$(${binding.icon})  `;
  }

  return binding.type === "submenu" ? "$(folder)  " : "$(play)  ";
};

/**
 * Gets the description string for a binding.
 */
export const getDescription = (binding: BindingItem): string => {
  const suffix = binding.type === "submenu" ? " $(chevron-right)" : "";
  return `${binding.name}${suffix}`;
};

/**
 * Gets the detail string for a binding, considering configuration.
 */
export const getCommandDetail = (
  binding: BindingItem,
  showDetail: boolean,
): string | undefined => {
  if (!showDetail) {
    return undefined;
  }

  if ((binding.detail?.length ?? 0) > 0) {
    return binding.detail;
  }

  switch (binding.type) {
    case "command":
      return binding.command;
    case "commands":
      return `${binding.commands.length.toString()} commands`;
    case "submenu":
      return `${binding.items.length.toString()} items`;
  }
};
