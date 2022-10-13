import path from 'path';
import copyAndWatch from "./copy-and-watch.mjs";
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import sass from 'rollup-plugin-sass';

const PROD_BUILD = process.env.BUILD_TYPE === 'prod';
const HREF          = process.env.BASE_HREF || '';
const ENGINE_DIR = process.env.ENGINE_PATH || 'node_modules/playcanvas';
const PCUI_DIR = process.env.PCUI_PATH || 'node_modules/@playcanvas/pcui';

const ENGINE_NAME = PROD_BUILD ? 'playcanvas.min.mjs' : 'playcanvas.dbg.mjs';
const ENGINE_PATH = path.resolve(ENGINE_DIR, 'build', ENGINE_NAME);
const PCUI_PATH = path.resolve(PCUI_DIR, 'dist/pcui.mjs');

// define supported module overrides
const aliasEntries = {
    'playcanvas': ENGINE_PATH,
    'pcui': PCUI_PATH
};

const tsCompilerOptions = {
    baseUrl: '.',
    paths: {
        'playcanvas': [ENGINE_PATH],
        'pcui': [PCUI_PATH]
    }
};

const externs = [
    'static/playcanvas-logo.png',
    'static/lib',
    'static/textures',
    'src/fonts.css'
];

export default {
    input: 'src/index.js',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        copyAndWatch({
            targets: [{
                src: 'src/index.html',
                dest: '',
                transform: (contents, filename) => {
                    return contents.toString().replace('__BASE_HREF__', HREF);
                }
            }].concat(externs.map((e) => {
                return {
                    src: e,
                    dest: ''
                };
            }))
        }),
        alias({ entries: aliasEntries }),
        resolve(),
        sass({
            insert: false,
            output: 'dist/style.css',
            outputStyle: 'compressed'
        }),
        sourcemaps(),
        json(),
        (PROD_BUILD && terser())
    ]
};
