import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import path from 'path';
import fs from 'fs';

const PROD_END      = process.env.NODE_ENV === 'production';
const DEBUG_BUILD   = process.env.BUILD_TYPE === 'debug';
const HREF          = process.env.BASE_HREF || '';

const externs = [
    'static/playcanvas-logo.png',
    'static/lib',
    'static/textures',
    'src/styles.css',
    'src/pcom.css'
];

// define supported module overrides
const moduleOverrides = {
    PCUI_PATH: /^@playcanvas\/pcui(.*)/,
    PCUI_GRAPH_PATH: /^@playcanvas\/pcui-graph(.*)/,
    EDITOR_API_PATH: /^@playcanvas\/editor-api(.*)/,
    ENGINE_PATH: /^playcanvas(.*)/
};

const aliasEntries = Object.keys(moduleOverrides)
    .filter(key => process.env.hasOwnProperty(key))
    .map((key) => {
        return {
            find: moduleOverrides[key],
            replacement: `${path.resolve(process.env[key])}$1`
        };
    });

// custom plugin to copy files and watch them
function copyAndWatch(config) {
    const resolvedConfig = {
        targets: []
    };

    // resolve source directories into files
    config.targets.forEach((target) => {
        const readRec = (pathname) => {
            if (!fs.existsSync(pathname)) {
                console.log(`skipping missing file ${target.src}`);
            } else {
                if (fs.lstatSync(pathname).isDirectory()) {
                    const children = fs.readdirSync(pathname);
                    children.forEach((childPath) => {
                        readRec(path.join(pathname, childPath));
                    });
                } else {
                    let dest;
                    if (fs.lstatSync(target.src).isDirectory()) {
                        dest = path.join(target.dest, path.basename(target.src), path.relative(target.src, pathname));
                    } else {
                        dest = path.join(target.dest, path.basename(target.src));
                    }
                    resolvedConfig.targets.push({
                        src: pathname,
                        dest: dest,
                        transform: target.transform
                    });
                }
            }
        };
        readRec(target.src);
    });

    return {
        name: 'copy-and-watch',
        async buildStart() {
            resolvedConfig.targets.forEach((target) => {
                this.addWatchFile(target.src);
            });
        },
        async generateBundle() {
            resolvedConfig.targets.forEach((target) => {
                const contents = fs.readFileSync(target.src);
                this.emitFile({
                    type: 'asset',
                    fileName: target.dest,
                    source: target.transform ? target.transform(contents, target.src) : contents
                })
            });
        }
    }
}

export default {
    input: 'src/index.js',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: DEBUG_BUILD ? 'inline' : null
    },
    plugins: [
        alias({
            entries: aliasEntries
        }),
        resolve(),
        json(),
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
        })
    ]
};
