import { zodToJsonSchema } from 'zod-to-json-schema';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WhatKeyConfigSchema, BindingItemSchema } from '../src/config/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, '..', 'schemas');

// Ensure schemas directory exists
mkdirSync(schemasDir, { recursive: true });

// Generate JSON schemas
const configSchema = zodToJsonSchema(WhatKeyConfigSchema, {
  name: 'WhatKeyConfig',
  $refStrategy: 'none',
});

const bindingSchema = zodToJsonSchema(BindingItemSchema, {
  name: 'BindingItem',
  $refStrategy: 'none',
});

// Write schemas
writeFileSync(
  join(schemasDir, 'whatkey-config.schema.json'),
  JSON.stringify(configSchema, null, 2),
);

writeFileSync(join(schemasDir, 'binding-item.schema.json'), JSON.stringify(bindingSchema, null, 2));

console.log('JSON schemas generated successfully in ./schemas/');
