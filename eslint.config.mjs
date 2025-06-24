import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';

export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      '**/.next/',
      '**/*.config.js',
      '**/*.config.ts',
      '**/venv/',
      '**/__pycache__/',
      '**/.pytest_cache/',
      '**/coverage/',
    ],
  },
  // Base JS config
  js.configs.recommended,
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      // Unused variables - allow underscore prefix and be more lenient
      '@typescript-eslint/no-unused-vars': [
        'warn', // Changed from 'error' to 'warn'
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Allow 'any' type during development
      '@typescript-eslint/no-explicit-any': 'warn',
      // React/JSX specific
      'no-undef': 'off', // Turn off for React components (React is global in modern setups)
      'prefer-const': 'error',
      'no-var': 'warn',
    },
  },
  // React/Next.js files - special handling
  {
    files: ['**/dashboard/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly', // Add React as global
        JSX: 'readonly',
      },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off', // React is global in Next.js
      'prefer-const': 'error',
      'no-var': 'warn',
    },
  },
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
