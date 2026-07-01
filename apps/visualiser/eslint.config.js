import path from 'node:path';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from "globals"; 
export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: path.resolve('./tsconfig.json'),
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.nodeBuiltin
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Add custom rules here
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '.yarn/'],
  },
];