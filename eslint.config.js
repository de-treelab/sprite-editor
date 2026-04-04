import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_', 
          varsIgnorePattern: '^_', 
          caughtErrorsIgnorePattern: '^_' 
        },
      ],
    },
  },
  {
    ignores: ['dist/', 'src-tauri/', 'node_modules/', 'src/test/'],
  },
);
