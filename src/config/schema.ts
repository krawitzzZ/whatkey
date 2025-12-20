import { z } from "zod";

/**
 * Base binding - common fields for all binding types
 */
const BaseBindingSchema = z.object({
  key: z.string().min(1).max(2).describe("The key to trigger this binding"),
  name: z.string().min(1).describe("Display name for this binding"),
  detail: z
    .string()
    .optional()
    .describe(
      'Additional detail information for this binding that will be shown in the menu if enabled. By default, "command" bindings show the command ID, "commands" bindings show the number of commands and the "submenu" type the number of nested bindings.',
    ),
  icon: z
    .string()
    .optional()
    .describe(
      'VS Code icon identifier (e.g., "file", "code"). See https://code.visualstudio.com/api/references/icons-in-labels',
    ),
});

/**
 * Command binding - executes a single VS Code command
 */
export const CommandBindingSchema = BaseBindingSchema.extend({
  type: z.literal("command"),
  command: z.string().min(1).describe("VS Code command identifier to execute"),
  args: z.unknown().optional().describe("Arguments to pass to the command"),
});

/**
 * Commands binding - executes multiple VS Code commands in sequence
 */
export const CommandsBindingSchema = BaseBindingSchema.extend({
  type: z.literal("commands"),
  commands: z
    .array(
      z.union([
        z.string(),
        z.object({
          command: z
            .string()
            .min(1)
            .describe("VS Code command identifier to execute"),
          args: z
            .unknown()
            .optional()
            .describe("Arguments to pass to the command"),
        }),
      ]),
    )
    .min(1)
    .describe("Array of VS Code commands to execute in sequence"),
});

/**
 * Union for all binding items using discriminated union for better error messages
 */
export const BindingItemSchema: z.ZodType<
  CommandBinding | CommandsBinding | SubmenuBinding
> = z.lazy(() =>
  z
    .discriminatedUnion("type", [
      CommandBindingSchema,
      CommandsBindingSchema,
      BaseBindingSchema.extend({
        type: z.literal("submenu"),
        items: z
          .array(BindingItemSchema)
          .min(1, "Submenu must have at least one item")
          .describe("Nested bindings for submenu"),
      }),
    ])
    .superRefine((data, ctx) => {
      if (data.type === "command" && !("command" in data)) {
        ctx.addIssue({
          code: "custom",
          message: "Binding with type 'command' requires a 'command' property",
          path: ["command"],
        });
      }
      if (data.type === "commands" && !("commands" in data)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Binding with type 'commands' requires a 'commands' array property",
          path: ["commands"],
        });
      }
      if (data.type === "submenu" && !("items" in data)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Binding with type 'submenu' requires an 'items' array property",
          path: ["items"],
        });
      }
    }),
);

/**
 * Sort order for menu items
 */
export const SortOrderSchema = z
  .enum(["alphabetical", "custom"])
  .default("custom");

/**
 * Bindings merge strategy when loading additional bindings from user config
 */
export const BindingsMergeStrategySchema = z
  .enum(["merge", "replace"])
  .default("merge");

/**
 * Main extension configuration schema
 */
export const WhatKeyConfigSchema = z.object({
  bindings: z
    .array(BindingItemSchema)
    .default([])
    .describe("Root level command bindings for the WhatKey menu"),
  bindingsMergeStrategy: BindingsMergeStrategySchema.describe(
    "Strategy for combining default bindings with user-defined bindings",
  ),
  sortOrder: SortOrderSchema.describe("Sort order for menu items"),
  showIcons: z
    .boolean()
    .default(true)
    .describe("Whether to show icons in the command menu"),
  showDetail: z
    .boolean()
    .default(true)
    .describe(
      "Whether to show detail in the command menu (e.g., command IDs, number of commands)",
    ),
  keySequenceTimeout: z
    .number()
    .int()
    .min(0)
    .max(5000)
    .default(500)
    .describe(
      'Timeout in milliseconds for multi-character key sequences. When typing keys quickly within this window, they are combined to match multi-char bindings (e.g., "ca" to close all). Set to 0 to disable multi-char support.',
    ),
});

export type WhatKeyConfig = z.infer<typeof WhatKeyConfigSchema>;
export type CommandBinding = z.infer<typeof CommandBindingSchema>;
export type CommandsBinding = z.infer<typeof CommandsBindingSchema>;
export type BindingItem = z.infer<typeof BindingItemSchema>;
export interface SubmenuBinding {
  type: "submenu";
  key: string;
  name: string;
  icon?: string;
  detail?: string;
  items: BindingItem[];
}
export type BindingItemWithPath = BindingItem & {
  path: string;
};

/**
 * Validates and parses a configuration object
 */
export function parseConfig(config: unknown): WhatKeyConfig {
  return WhatKeyConfigSchema.parse(config);
}

/**
 * Validates a configuration object and returns errors if invalid
 */
export function validateConfig(
  config: unknown,
): z.ZodSafeParseResult<WhatKeyConfig> {
  return WhatKeyConfigSchema.safeParse(config);
}
