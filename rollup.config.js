import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import path from 'path';
import fs from 'fs';

const settings = {
    debugBuild: process.env.BUILD_TYPE === 'debug',
    prodEnv: process.env.NODE_ENV === 'production',
    enginePath: process.env.ENGINE_PATH,
    pcuiPath: process.env.PCUI_PATH,
    pcuiGraphPath: process.env.PCUI_GRAPH_PATH,
    href: process.env.BASE_HREF || ''
};

const externs = [
    'static/playcanvas-logo.png',
    'static/lib',
    'static/textures',
    'src/styles.css',
    'src/pcom.css'
];

// get aliases
const aliasEntries = () => {
    const entries = [];

    if (settings.pcuiPath) {
        entries.push({
            find: /^@playcanvas\/pcui/,
            replacement: path.resolve(settings.pcuiPath)
        });
    }

    if (settings.pcuiGraphPath) {
        entries.push({
            find: /^@playcanvas\/pcui-graph/,
            replacement: path.resolve(settings.pcuiGraphPath)
        });
    }

    if (settings.enginePath) {
        entries.push({
            find: 'playcanvas',
            replacement: path.resolve(settings.enginePath, settings.debugBuild ? 'build/playcanvas.dbg.mjs' : 'build/playcanvas.mjs')
        });
    }

    return {
        entries: entries
    };
};

console.log(JSON.stringify(settings));
console.log(JSON.stringify(aliasEntries()));

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
        sourcemap: settings.debugBuild ? 'inline' : null
    },
    plugins: [
        alias(aliasEntries()),
        resolve(),
        copyAndWatch({
            targets: [{
                src: 'src/index.html',
                dest: '',
                transform: (contents, filename) => {
                    return contents.toString().replace('__BASE_HREF__', settings.href);
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
