import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: [
      'next',
      'next/core-web-vitals',
      'next/typescript',
      'plugin:storybook/recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:prettier/recommended',
      'plugin:jest/recommended',
      'plugin:jest-dom/recommended',
      'plugin:testing-library/react',
    ],
    plugins: [
      'storybook',
      'prettier',
      'jsx-a11y',
      'import',
      'jest',
      'jest-dom',
      'testing-library',
      'playwright',
    ],
    rules: {
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
    ignorePatterns: [
      'dist/',
      'build/',
      '.next/',
      'node_modules/',
      'storybook-static/',
      'public/',
      'coverage/',
    ],
    overrides: [
      {
        files: ['**/*.test.{js,jsx,ts,tsx}'],
        env: {
          'jest/globals': true,
        },
        plugins: ['jest', 'jest-dom', 'testing-library'],
        extends: [
          'plugin:jest/recommended',
          'plugin:jest-dom/recommended',
          'plugin:testing-library/react',
        ],
        rules: {
          // Add or override jest-specific rules here
          'jest/no-disabled-tests': 'warn',
          'jest/no-focused-tests': 'error',
          'jest/no-identical-title': 'error',
          'jest/valid-expect': 'error',
        },
      },
      {
        files: ['e2e/**/*.[jt]s?(x)'],
        extends: 'plugin:playwright/recommended',
        plugins: ['playwright'],
        rules: {
          // Disable React Testing Library rules for Playwright tests
          'testing-library/prefer-screen-queries': 'off',
          'jest/no-disabled-tests': 'off',
          'jest/no-focused-tests': 'off',
          'jest/no-identical-title': 'off',
          'jest/valid-expect': 'off',
        },
      },
    ],
  }),
]

export default eslintConfig
