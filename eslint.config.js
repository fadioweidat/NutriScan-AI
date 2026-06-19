import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist', 
    'scripts', 
    'src/pages', 
    'src/components', 
    'src/contexts', 
    'src/lib/nutrients.js', 
    'src/lib/reportGenerator.js', 
    'src/lib/test_engine.js',
    'real-e2e-test.js',
    'test-*.js',
    'test_*.js',
    'test-validation.js',
    'test_insert.js',
    'verify-*.js'
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['scripts/**/*.js', 'real-e2e-test.js', 'test-*.js', 'test_*.js', 'eslint.config.js', 'vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
])
