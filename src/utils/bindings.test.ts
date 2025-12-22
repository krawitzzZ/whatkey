import type { BindingItem } from "../config";
import {
  flattenBindings,
  mergeBindings,
  deduplicateBindings,
  sortBindings,
} from "./bindings";

describe("flattenBindings", () => {
  it("should flatten simple bindings with paths", () => {
    const bindings: BindingItem[] = [
      { key: "a", name: "Command A", type: "command", command: "cmd.a" },
      { key: "b", name: "Command B", type: "command", command: "cmd.b" },
    ];

    const result = flattenBindings(bindings);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: "a",
      name: "Command A",
      type: "command",
      command: "cmd.a",
      path: "a",
    });
    expect(result[1]).toEqual({
      key: "b",
      name: "Command B",
      type: "command",
      command: "cmd.b",
      path: "b",
    });
  });

  it("should flatten nested submenus with correct paths", () => {
    const bindings: BindingItem[] = [
      {
        key: "f",
        name: "File",
        type: "submenu",
        items: [
          { key: "s", name: "Save", type: "command", command: "cmd.save" },
          { key: "o", name: "Open", type: "command", command: "cmd.open" },
        ],
      },
    ];

    const result = flattenBindings(bindings);

    expect(result).toHaveLength(2);
    expect(result[0]?.path).toBe("fs");
    expect(result[1]?.path).toBe("fo");
  });

  it("should handle deeply nested submenus", () => {
    const bindings: BindingItem[] = [
      {
        key: "a",
        name: "Level 1",
        type: "submenu",
        items: [
          {
            key: "b",
            name: "Level 2",
            type: "submenu",
            items: [
              { key: "c", name: "Command", type: "command", command: "cmd.c" },
            ],
          },
        ],
      },
    ];

    const result = flattenBindings(bindings);

    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("abc");
  });
});

describe("mergeBindings", () => {
  it("should return defaults when user bindings are empty", () => {
    const defaults: BindingItem[] = [
      { key: "a", name: "Default A", type: "command", command: "cmd.a" },
    ];

    const result = mergeBindings(defaults, []);

    expect(result).toEqual(defaults);
  });

  it("should add new user bindings to defaults", () => {
    const defaults: BindingItem[] = [
      { key: "a", name: "Default A", type: "command", command: "cmd.a" },
    ];
    const userBindings: BindingItem[] = [
      { key: "b", name: "User B", type: "command", command: "cmd.b" },
    ];

    const result = mergeBindings(defaults, userBindings);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(userBindings[0]);
  });

  it("should override defaults with user bindings for same key", () => {
    const defaults: BindingItem[] = [
      { key: "a", name: "Default A", type: "command", command: "cmd.default" },
    ];
    const userBindings: BindingItem[] = [
      { key: "a", name: "User A", type: "command", command: "cmd.user" },
    ];

    const result = mergeBindings(defaults, userBindings);

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("User A");
    expect(result[0]?.type).toBe("command");
  });

  it("should merge submenu items recursively", () => {
    const defaults: BindingItem[] = [
      {
        key: "f",
        name: "File",
        type: "submenu",
        items: [
          { key: "s", name: "Save", type: "command", command: "cmd.save" },
        ],
      },
    ];
    const userBindings: BindingItem[] = [
      {
        key: "f",
        name: "File",
        type: "submenu",
        items: [
          { key: "o", name: "Open", type: "command", command: "cmd.open" },
        ],
      },
    ];

    const result = mergeBindings(defaults, userBindings);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("submenu");
    if (result[0]?.type === "submenu") {
      expect(result[0].items).toHaveLength(2);
    }
  });
});

describe("deduplicateBindings", () => {
  it("should return empty arrays for empty input", () => {
    const result = deduplicateBindings([]);

    expect(result.deduplicated).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });

  it("should keep first occurrence and report duplicates", () => {
    const bindings: BindingItem[] = [
      { key: "a", name: "First A", type: "command", command: "cmd.first" },
      { key: "a", name: "Second A", type: "command", command: "cmd.second" },
    ];

    const result = deduplicateBindings(bindings);

    expect(result.deduplicated).toHaveLength(1);
    expect(result.deduplicated[0]?.name).toBe("First A");
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.key).toBe("a");
  });

  it("should detect duplicates in nested submenus", () => {
    const bindings: BindingItem[] = [
      {
        key: "f",
        name: "File",
        type: "submenu",
        items: [
          { key: "s", name: "Save 1", type: "command", command: "cmd.save1" },
          { key: "s", name: "Save 2", type: "command", command: "cmd.save2" },
        ],
      },
    ];

    const result = deduplicateBindings(bindings);

    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.path).toContain("f");
  });
});

describe("sortBindings", () => {
  it("should always put submenus first", () => {
    const bindings: BindingItem[] = [
      { key: "z", name: "Command Z", type: "command", command: "cmd.z" },
      {
        key: "a",
        name: "Submenu A",
        type: "submenu",
        items: [],
      },
    ];

    const result = sortBindings(bindings, "custom");

    expect(result[0]?.type).toBe("submenu");
    expect(result[1]?.type).toBe("command");
  });

  it("should sort alphabetically when specified", () => {
    const bindings: BindingItem[] = [
      { key: "c", name: "Command C", type: "command", command: "cmd.c" },
      { key: "a", name: "Command A", type: "command", command: "cmd.a" },
      { key: "b", name: "Command B", type: "command", command: "cmd.b" },
    ];

    const result = sortBindings(bindings, "alphabetical");

    expect(result[0]?.key).toBe("a");
    expect(result[1]?.key).toBe("b");
    expect(result[2]?.key).toBe("c");
  });

  it("should not mutate original array", () => {
    const bindings: BindingItem[] = [
      { key: "b", name: "Command B", type: "command", command: "cmd.b" },
      { key: "a", name: "Command A", type: "command", command: "cmd.a" },
    ];

    sortBindings(bindings, "alphabetical");

    expect(bindings[0]?.key).toBe("b");
  });
});
