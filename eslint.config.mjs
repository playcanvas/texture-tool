import playcanvasConfig from '@playcanvas/eslint-config';
import globals from 'globals';

export default [
    ...playcanvasConfig,
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                'JSZip': 'readonly'
            }
        },
        rules: {
            'import/no-unresolved': 'off'
        }
    },
    {
        ignores: [
            'src/unused/**'
        ]
    }
];

