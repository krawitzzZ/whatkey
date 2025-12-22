import type { BindingItem, BindingItemWithPath } from "../config";
import { getLabel, getIcon, getDescription, getCommandDetail } from "./labels";

describe("getLabel", () => {
  it("should return key padded to 2 characters with default icon", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "command",
      command: "cmd.file",
    };

    const result = getLabel(binding, true);

    expect(result).toBe("$(play)  f ");
  });

  it("should return path for BindingItemWithPath", () => {
    const binding: BindingItemWithPath = {
      key: "s",
      name: "Save",
      type: "command",
      command: "cmd.save",
      path: "rfs",
    };

    const result = getLabel(binding, true);

    expect(result).toBe("$(play)  rfs");
  });

  it("should not include icon when showIcons is false", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "command",
      command: "cmd.file",
    };

    const result = getLabel(binding, false);

    expect(result).toBe("f ");
  });
});

describe("getIcon", () => {
  it("should return empty string when showIcons is false", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "command",
      command: "cmd.file",
      icon: "file",
    };

    const result = getIcon(binding, false);

    expect(result).toBe("");
  });

  it("should return custom icon when specified", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "command",
      command: "cmd.file",
      icon: "file",
    };

    const result = getIcon(binding, true);

    expect(result).toBe("$(file)  ");
  });

  it("should return folder icon for submenu type", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "submenu",
      items: [],
    };

    const result = getIcon(binding, true);

    expect(result).toBe("$(folder)  ");
  });

  it("should return play icon for command type", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "command",
      command: "cmd.file",
    };

    const result = getIcon(binding, true);

    expect(result).toBe("$(play)  ");
  });

  it("should return play icon for commands type", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "commands",
      commands: ["cmd.a", "cmd.b"],
    };

    const result = getIcon(binding, true);

    expect(result).toBe("$(play)  ");
  });
});

describe("getDescription", () => {
  it("should return name with chevron for submenu", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "submenu",
      items: [],
    };

    const result = getDescription(binding);

    expect(result).toBe("File $(chevron-right)");
  });

  it("should return just name for command", () => {
    const binding: BindingItem = {
      key: "f",
      name: "Format",
      type: "command",
      command: "cmd.format",
    };

    const result = getDescription(binding);

    expect(result).toBe("Format");
  });

  it("should return just name for commands", () => {
    const binding: BindingItem = {
      key: "f",
      name: "Format All",
      type: "commands",
      commands: ["cmd.a", "cmd.b"],
    };

    const result = getDescription(binding);

    expect(result).toBe("Format All");
  });
});

describe("getCommandDetail", () => {
  it("should return undefined when showDetail is false", () => {
    const binding: BindingItem = {
      key: "f",
      name: "Format",
      type: "command",
      command: "editor.action.formatDocument",
    };

    const result = getCommandDetail(binding, false);

    expect(result).toBeUndefined();
  });

  it("should return custom detail when specified", () => {
    const binding: BindingItem = {
      key: "f",
      name: "Format",
      type: "command",
      command: "cmd.format",
      detail: "Custom detail text",
    };

    const result = getCommandDetail(binding, true);

    expect(result).toBe("Custom detail text");
  });

  it("should return command ID for command type", () => {
    const binding: BindingItem = {
      key: "f",
      name: "Format",
      type: "command",
      command: "editor.action.formatDocument",
    };

    const result = getCommandDetail(binding, true);

    expect(result).toBe("editor.action.formatDocument");
  });

  it("should return commands count for commands type", () => {
    const binding: BindingItem = {
      key: "f",
      name: "Format All",
      type: "commands",
      commands: ["cmd.a", "cmd.b", "cmd.c"],
    };

    const result = getCommandDetail(binding, true);

    expect(result).toBe("3 commands");
  });

  it("should return items count for submenu type", () => {
    const binding: BindingItem = {
      key: "f",
      name: "File",
      type: "submenu",
      items: [
        { key: "s", name: "Save", type: "command", command: "cmd.save" },
        { key: "o", name: "Open", type: "command", command: "cmd.open" },
      ],
    };

    const result = getCommandDetail(binding, true);

    expect(result).toBe("2 items");
  });
});
