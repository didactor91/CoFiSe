import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.vite/**',
      '**/*.d.ts',
      'client/src/graphql/generated-types.ts',
      'packages/types/generated/**',
      '**/*.min.js',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './client/tsconfig.app.json',
            './client/tsconfig.node.json',
            './server/tsconfig.json',
          ],
        },
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-duplicate-imports': 'error',
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/no-cycle': ['error', { maxDepth: Infinity }],
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'warn',
      'import/no-unresolved': 'error',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': false },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      'prefer-const': 'warn',
      'no-empty-function': 'warn',
      'no-prototype-builtins': 'warn',
      'no-unreachable': 'error',
    },
  },

  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactRefresh.configs.vite.rules,
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'off',

      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/no-danger': 'warn',
    },
  },

  {
    files: ['server/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-process-env': 'error',
      'no-sync': 'warn',
    },
  },

  {
    files: ['server/src/config.ts', 'playwright.config.ts', 'database/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      'no-process-env': 'off',
      'no-sync': 'off',
    },
  },

  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        vitest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/order': 'off',
      'import/no-duplicates': 'off',
      'prefer-const': 'off',
      'no-empty': 'off',
      'no-console': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-sync': 'off',
    },
  },

  {
    files: ['*.config.{js,mjs,cjs}', '*.config.ts', '*.rc.{js,json}'],
    rules: {
      'no-console': 'off',
      'import/no-unresolved': 'off',
    },
  },

  eslintConfigPrettier,
)
