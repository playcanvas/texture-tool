import typescriptConfig from '@playcanvas/eslint-config/typescript';
import globals from 'globals';

export default [
    ...typescriptConfig,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            globals: globals.browser
        }
    }
];
