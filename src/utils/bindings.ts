import type { BindingItem, BindingItemWithPath } from "../config";

export const flattenBindings = (
  bindings: BindingItem[],
  currentPath = "",
): BindingItemWithPath[] => {
  const result: BindingItemWithPath[] = [];

  for (const binding of bindings) {
    const path = `${currentPath}${binding.key}`;

    if (binding.type === "submenu") {
      result.push(...flattenBindings(binding.items, path));
    } else {
      result.push({ ...binding, path });
    }
  }

  return result;
};

/**
 * Merges user bindings into default bindings recursively.
 * - If user provides a key that exists in defaults and both are submenus,
 *   the items are merged (user items appended, recursively).
 * - If user provides a key that exists but types differ, user binding wins.
 * - If user provides a new key, it's added to the result.
 */
export const mergeBindings = (
  defaults: BindingItem[],
  userBindings: BindingItem[],
): BindingItem[] => {
  const defaultsByKey = new Map<string, BindingItem>();
  const processedUserKeys = new Set<string>();
  for (const binding of defaults) {
    defaultsByKey.set(binding.key, binding);
  }

  const result: BindingItem[] = defaults.map(binding => {
    const userBinding = userBindings.find(ub => ub.key === binding.key);

    if (!userBinding) {
      return binding;
    }

    processedUserKeys.add(userBinding.key);

    // Both are submenus - merge their items recursively
    if (binding.type === "submenu" && userBinding.type === "submenu") {
      const items = mergeBindings(binding.items, userBinding.items);
      return { ...binding, items };
    }

    return userBinding;
  });

  for (const userBinding of userBindings) {
    if (!processedUserKeys.has(userBinding.key)) {
      processedUserKeys.add(userBinding.key);
      result.push(userBinding);
    }
  }

  return result;
};

/**
 * Recursively deduplicates bindings at each level.
 * First occurrence wins; duplicates are collected for reporting.
 */
export const deduplicateBindings = (
  bindings: BindingItem[],
  currentPath = "",
): {
  deduplicated: BindingItem[];
  duplicates: { key: string; path: string }[];
} => {
  const seen = new Set<string>();
  const deduplicated: BindingItem[] = [];
  const duplicates: { key: string; path: string }[] = [];

  for (const binding of bindings) {
    if (seen.has(binding.key)) {
      duplicates.push({ key: binding.key, path: currentPath });
      continue;
    }

    seen.add(binding.key);

    if (binding.type === "submenu") {
      const nested = deduplicateBindings(
        binding.items,
        `${currentPath}${binding.key} → `,
      );
      duplicates.push(...nested.duplicates);
      deduplicated.push({ ...binding, items: nested.deduplicated });
    } else {
      deduplicated.push(binding);
    }
  }

  return { deduplicated, duplicates };
};

/**
 * Sorts bindings based on configuration.
 * Folders (type: bindings) always come first.
 * When alphabetical: additionally sorted by key within each group.
 * Always returns a new array.
 */
export const sortBindings = <T extends BindingItem | BindingItemWithPath>(
  bindings: T[],
  sortOrder: "alphabetical" | "custom",
): T[] => {
  return [...bindings].sort((a, b) => {
    const aIsFolder = a.type === "submenu";
    const bIsFolder = b.type === "submenu";

    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;

    return sortOrder === "alphabetical" ? a.key.localeCompare(b.key) : 0;
  });
};
