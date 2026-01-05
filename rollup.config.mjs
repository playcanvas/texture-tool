import path from 'path';
import { copyAndWatch } from './plugins/copy-and-watch.mjs';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import sass from 'rollup-plugin-sass';
import typescript from '@rollup/plugin-typescript';

const PROD_BUILD = process.env.BUILD_TYPE === 'prod';
const HREF       = process.env.BASE_HREF || '';
const ENGINE_DIR = process.env.ENGINE_PATH || 'node_modules/playcanvas';
const PCUI_DIR = process.env.PCUI_PATH || 'node_modules/@playcanvas/pcui';

const ENGINE_NAME = PROD_BUILD ? 'playcanvas.mjs' : 'playcanvas.dbg.mjs';
const ENGINE_PATH = path.resolve(ENGINE_DIR, 'build', ENGINE_NAME);
const PCUI_PATH = path.resolve(PCUI_DIR, 'dist/module/src/index.mjs');

// define supported module overrides
const aliasEntries = {
    'playcanvas': ENGINE_PATH,
    'pcui': PCUI_PATH
};

const TARGETS = [
    {
        src: 'src/index.html',
        transform: (contents) => {
            return contents.toString().replace('__BASE_HREF__', HREF);
        }
    },
    { src: 'static/playcanvas-logo.png' },
    { src: 'static/lib' },
    { src: 'static/textures' },
    { src: 'src/fonts.css' }
];

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: true
    },
    watch: {
        include: 'src/**'
    },
    plugins: [
        copyAndWatch(TARGETS),
        alias({ entries: aliasEntries }),
        resolve(),
        typescript({
            tsconfig: './tsconfig.json'
        }),
        sass({
            insert: false,
            output: 'dist/style.css',
            outputStyle: 'compressed',
            api: 'modern'
        }),
        json()
    ]
};
