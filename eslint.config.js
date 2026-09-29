import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
export default [{ ignores: ['dist', 'node_modules'] }, { files: ['**/*.{ts,tsx}'], languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } }, plugins: { '@typescript-eslint': tseslint }, rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } }];
