# WhatKey

A VS Code extension that provides a customizable command menu with key sequences and search functionality.
Similar to [WhichKey](https://vspacecode.github.io/docs/whichkey) but with enhanced search capabilities.

## Features

- **Key Sequence Navigation**: Trigger the command menu and navigate through nested menus using
  single key presses (e.g., `;ff` for Format → Format Document)
- **Search Mode**: Search through all configured commands and execute them directly
- **Customizable Bindings**: Define your own key bindings and command mappings
- **Nested Menus**: Organize commands into logical groups with submenus
- **Shell Commands**: Execute shell commands with configurable output (silent, terminal, output channel, notification)
- **Icons Support**: Display VS Code icons next to menu items

## Media

### Default View

![Default View](https://github.com/krawitzzZ/whatkey/raw/main/resources/default.png)

### Without Details

![Without Details](https://github.com/krawitzzZ/whatkey/raw/main/resources/no-detail.png)

### Without Icons

![Without Icons](https://github.com/krawitzzZ/whatkey/raw/main/resources/no-icons.png)

### Usage Demo

![Usage Demo](https://github.com/krawitzzZ/whatkey/raw/main/resources/video.gif)

## Usage

### Commands

- `WhatKey: Show Command Menu` (`Ctrl+Alt+;` / `Cmd+Alt+;`) - Opens the hierarchical command menu
- `WhatKey: Search Commands` - Opens a searchable list of all commands

### Key Sequence Mode

1. Press `Ctrl+Alt+;` (or `Cmd+Alt+;` on macOS) to open the menu
2. Press a single key to either:
   - Execute a command directly
   - Navigate to a submenu
3. Continue pressing keys to navigate deeper or execute commands

### Search Mode

1. Run `WhatKey: Search Commands` from the command palette
2. Type to filter commands by name, key path, or command ID
3. Press Enter to execute the selected command

## Configuration

Configure WhatKey in your VS Code settings (`settings.json`):

```json
{
  "whatkey.bindings": [
    {
      "key": "f",
      "name": "Format",
      "type": "submenu",
      "icon": "edit",
      "items": [
        {
          "key": "f",
          "name": "Format Document",
          "type": "command",
          "command": "editor.action.formatDocument"
        },
        {
          "key": "s",
          "name": "Format Selection",
          "type": "command",
          "command": "editor.action.formatSelection"
        }
      ]
    }
  ],
  "whatkey.sortOrder": "custom",
  "whatkey.showIcons": true,
  "whatkey.showDetail": false,
  "whatkey.keySequenceTimeout": 350
}
```

### Binding Types

#### Command Binding

Executes a single VS Code command:

```json
{
  "key": "s",
  "name": "Save",
  "type": "command",
  "command": "workbench.action.files.save",
  "args": {}
}
```

#### Commands Binding

Executes multiple commands in sequence:

```json
{
  "key": "x",
  "name": "Save and Close",
  "type": "commands",
  "commands": [
    "workbench.action.files.save",
    "workbench.action.closeActiveEditor"
  ]
}
```

#### Shell Binding

Executes a shell command. Supports multiple output modes:

```json
{
  "key": "g",
  "name": "Git Status",
  "type": "shell",
  "command": "git",
  "args": ["status"],
  "output": "terminal"
}
```

**Output modes:**

| Mode           | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `silent`       | Run in background with no output (default)                           |
| `channel`      | Show output in the "whatkey" Output panel                            |
| `notification` | Show result as VS Code notification (truncated to 200 chars)         |
| `terminal`     | Run in a visible terminal (reuses a shared "WhatKey Shell" terminal) |

**Additional options:**

- `cwd` - Working directory for the command (defaults to workspace root)
- `args` - Array of arguments to pass to the command

#### Submenu

Creates a nested menu:

```json
{
  "key": "g",
  "name": "Navigate",
  "type": "submenu",
  "items": [
    {
      "key": "d",
      "name": "Go to Definition",
      "type": "command",
      "command": "editor.action.revealDefinition"
    }
  ]
}
```

### Configuration Options

| Option                          | Type                           | Default    | Description                                                                                          |
| ------------------------------- | ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `whatkey.bindings`              | array                          | `[]`       | Array of binding configurations                                                                      |
| `whatkey.bindingsMergeStrategy` | `"merge"` \| `"replace"`       | `"merge"`  | Strategy for combining user bindings with defaults. `merge` appends to submenus, `replace` overrides |
| `whatkey.sortOrder`             | `"alphabetical"` \| `"custom"` | `"custom"` | Sort order for menu items (submenus always appear first)                                             |
| `whatkey.showIcons`             | boolean                        | `true`     | Show icons in the menu                                                                               |
| `whatkey.showDetail`            | boolean                        | `true`     | Show detail text (command IDs, item counts) in the menu                                              |
| `whatkey.keySequenceTimeout`    | number                         | `350`      | Timeout (ms) for multi-char key sequences. Set to 0 to disable                                       |

### Bindings Merge Strategy

By default, WhatKey uses **merge** strategy which combines your custom bindings with the built-in defaults:

- If you define a submenu key that already exists (e.g., `b` for Buffer), your items are **appended** to the default items
- If you define a new key, it's **added** to the menu
- If you redefine an existing key with a different type, your binding **overrides** the default
- **Duplicate keys**: If you define the same key multiple times at the same level, only the **first occurrence** is used (a warning will be shown when config loads)

Example - adding a custom command to the existing Buffer submenu:

```json
{
  "whatkey.bindings": [
    {
      "key": "b",
      "name": "Buffer",
      "type": "submenu",
      "items": [
        {
          "key": "e",
          "name": "Open Explorer",
          "type": "command",
          "command": "workbench.view.explorer"
        }
      ]
    }
  ]
}
```

This adds `e` (Open Explorer) alongside the default Buffer items (Save, Close, Format, etc.).

To completely replace defaults with your own bindings, use:

```json
{
  "whatkey.bindingsMergeStrategy": "replace",
  "whatkey.bindings": [...]
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start development build (watch mode)
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm typecheck

# Generate JSON schemas from Zod definitions
pnpm generate:schema
```

### Debugging

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. The extension will be active in the new window

## JSON Schemas

JSON schemas are available for validating your configuration:

- [binding-item.schema.json](https://github.com/krawitzzZ/whatkey/blob/main/schemas/binding-item.schema.json) - Schema for individual binding items
- [whatkey-config.schema.json](https://github.com/krawitzzZ/whatkey/blob/main/schemas/whatkey-config.schema.json) - Schema for the full WhatKey configuration

You can reference these schemas in your `settings.json` for autocompletion and validation, or use them programmatically.

## License

MIT
