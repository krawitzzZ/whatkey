import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2022',
      bundle: true,
      dts: false,
      output: {
        distPath: {
          root: './dist',
        },
      },
    },
  ],
  source: {
    entry: {
      extension: './src/extension.ts',
    },
  },
  output: {
    target: 'node',
    minify: false,
    sourceMap: {
      js: 'source-map',
    },
    externals: ['vscode'],
  },
});
