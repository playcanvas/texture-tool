import { copyAndWatch } from './plugins/copy-and-watch.mjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import sass from 'rollup-plugin-sass';
import typescript from '@rollup/plugin-typescript';

const HREF = process.env.BASE_HREF || '';

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
