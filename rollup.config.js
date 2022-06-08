import resolve from '@rollup/plugin-node-resolve';
import { createFilter } from '@rollup/pluginutils';
import alias from '@rollup/plugin-alias';
import path from 'path';
import fs from 'fs';

const prodEnv = process.env.ENVIRONMENT !== 'dev';

// inline chunk files 
const chunks = (chunksDir) => {
    // generate chunks.js to include all files in the chunks dir
    const basename = path.basename(chunksDir);
    const imports = [];
    const exports = [];
    fs.readdirSync(chunksDir).forEach((f) => {
        const name = f.replace('.', '_');
        imports.push(`import ${name} from './${basename}/${f}';`);
        exports.push(`    '${f}': ${name}`);
    });

    const source =
        `${imports.join('\n')}\n\n` +
        `const Chunks = {\n${exports.join(',\n')}\n};\n\n` +
        `export { Chunks };\n`;

    fs.writeFileSync(`${chunksDir}.js`, source);

    // return transform for glsl imports
    const filter = createFilter([
        `${chunksDir}/*`
    ], []);

    return {
        transform(code, id) {
            return filter(id) ? { code: `export default ${JSON.stringify(code)};` } : null;
        }
    }
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

    if (process.env.PCUI_PATH) {
        entries.push({
            find: /^@playcanvas\/pcui/,
            replacement: path.resolve(process.env.PCUI_PATH)
        });
    }

    if (process.env.PCUI_GRAPH_PATH) {
        entries.push({
            find: /^@playcanvas\/pcui-graph/,
            replacement: path.resolve(process.env.PCUI_GRAPH_PATH)
        });
    }

    if (process.env.ENGINE_PATH) {
        entries.push({
            find: /^playcanvas/,
            replacement: path.resolve(process.env.ENGINE_PATH)
            // replacement: path.resolve(process.env.ENGINE_PATH, prodEnv ? '' : 'build/playcanvas.dbg.mjs')
        });
    }

    return {
        entries: entries
    };
};

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
        sourcemap: 'inline'
    },
    plugins: [
        chunks('./src/chunks'),
        alias(aliasEntries()),
        resolve(),
        copyAndWatch({
            targets: [{
                src: 'src/index.html',
                dest: '',
                transform: (contents, filename) => {
                    return contents.toString().replace('__BASE_HREF__', process.env.BASE_HREF || '');
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
