import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import path from 'path';
import copyAndWatch from "./copy-and-watch";

const PROD_BUILD    = process.env.BUILD_TYPE === 'prod';
const HREF          = process.env.BASE_HREF || '';

const externs = [
    'static/playcanvas-logo.png',
    'static/lib',
    'static/textures',
    'src/styles.css',
    'src/fonts.css'
];

const paths = {};
['PCUI_PATH', 'ENGINE_PATH'].forEach((p) => {
    const envPath = process.env[p];
    if (envPath) {
        paths[p] = path.resolve(envPath)
    }
});

const aliasEntries = [];

if (paths.PCUI_PATH) {
    aliasEntries.push({
        find: /^@playcanvas\/pcui(.*)/,
        replacement: `${paths.PCUI_PATH}$1`
    });
}

if (paths.ENGINE_PATH) {
    aliasEntries.push({
        find: /^playcanvas$/,
        replacement: `${paths.ENGINE_PATH}/build/playcanvas.dbg.mjs`
    });

    aliasEntries.push({
        find: /^playcanvas(.*)/,
        replacement: `${paths.ENGINE_PATH}$1`
    });
}

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
        sourcemaps(),
        json(),
        (PROD_BUILD && terser())
    ]
};
