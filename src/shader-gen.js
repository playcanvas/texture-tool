import {
    SEMANTIC_POSITION,
    SEMANTIC_NORMAL,
    SEMANTIC_TANGENT,
    SEMANTIC_TEXCOORD0,
    SEMANTIC_TEXCOORD1,
    SEMANTIC_TEXCOORD2,
    SEMANTIC_TEXCOORD3,
    SEMANTIC_TEXCOORD4,
    SEMANTIC_TEXCOORD5,
    SEMANTIC_TEXCOORD6,
    SEMANTIC_TEXCOORD7,
    SEMANTIC_COLOR,
    SEMANTIC_BLENDINDICES,
    SEMANTIC_BLENDWEIGHT,
    shaderChunks,
    Shader
} from 'playcanvas';
import { Chunks } from './chunks.js';

const attributeSemantics = {
    vertex_position: SEMANTIC_POSITION,
    vertex_normal: SEMANTIC_NORMAL,
    vertex_tangent: SEMANTIC_TANGENT,
    vertex_texCoord0: SEMANTIC_TEXCOORD0,
    vertex_texCoord1: SEMANTIC_TEXCOORD1,
    vertex_texCoord2: SEMANTIC_TEXCOORD2,
    vertex_texCoord3: SEMANTIC_TEXCOORD3,
    vertex_texCoord4: SEMANTIC_TEXCOORD4,
    vertex_texCoord5: SEMANTIC_TEXCOORD5,
    vertex_texCoord6: SEMANTIC_TEXCOORD6,
    vertex_texCoord7: SEMANTIC_TEXCOORD7,
    vertex_color: SEMANTIC_COLOR,
    vertex_boneIndices: SEMANTIC_BLENDINDICES,
    vertex_boneWeights: SEMANTIC_BLENDWEIGHT
};

class ShaderSource {
    constructor() {
        this.lines = [];
    }

    append(text) {
        const lines = text.split('\n');
        lines.forEach((l) => {
            this.lines.push(l);
        });
    }

    replace(line, text) {
        this.lines.splice(line, 1, ...text.split('\n'));
    }

    toString() {
        return this.lines.join('\n');
    }
}

class ShaderDef {
    static createShader(device, shaderDef) {
        const vertSource = new ShaderSource();
        const fragSource = new ShaderSource();

        if (device.webgl2) {
            const version = `#version 300 es`;
            vertSource.append(version);
            vertSource.append(shaderChunks.gles3VS);

            fragSource.append(version);
            fragSource.append(shaderChunks.gles3PS);
        } else {
            // extensions
            if (shaderDef.fragment.webgl1Extensions) {
                shaderDef.fragment.webgl1Extensions.forEach((e) => {
                    fragSource.append(`#extension ${e} : enable`);
                });
            }
        }

        // precision
        fragSource.append(`precision ${device.precision} float;`);
        if (device.webgl2) {
            fragSource.append(`precision ${device.precision} sampler2DShadow;`);
        }

        // construct vertex shader
        ShaderDef._genDefines(vertSource, shaderDef.vertex.defines);
        vertSource.append(`#include "${shaderDef.vertex.source}"`);
        ShaderDef._preprocess(vertSource);

        // construct fragment shader
        ShaderDef._genDefines(fragSource, shaderDef.fragment.defines);
        fragSource.append(`#include "${shaderDef.fragment.source}"`);
        ShaderDef._preprocess(fragSource);

        const vertString = vertSource.toString();

        return new Shader(device, {
            attributes: ShaderDef._collectAttributes(vertString),
            vshader: vertString,
            fshader: fragSource.toString(),
            useTransformFeedback: !!shaderDef.useTransformFeedback
        });
    }

    static _collectAttributes(source) {
        const result = {};
        let attrs = 0;
        let found = source.indexOf("attribute");
        while (found >= 0) {
            if (found > 0 && source[found - 1] === "/") break;
            const endOfLine = source.indexOf(';', found);
            const startOfAttribName = source.lastIndexOf(' ', endOfLine);
            const attribName = source.substr(startOfAttribName + 1, endOfLine - (startOfAttribName + 1));

            const semantic = attributeSemantics[attribName];
            if (semantic !== undefined) {
                result[attribName] = semantic;
            } else {
                result[attribName] = "ATTR" + attrs;
                attrs++;
            }

            found = source.indexOf("attribute", found + 1);
        }
        return result;
    }

    static _genDefines(source, defines) {
        if (defines) {
            for (const k in defines) {
                if (defines.hasOwnProperty(k)) {
                    const val = defines[k];
                    if (typeof val === 'string') {
                        source.append(`#define ${k} ${val}`);
                    } else if (val) {
                        source.append(`#define ${k}`);
                    }
                }
            }
        }
    }

    static _preprocess(source) {
        for (let i = 0; i < source.lines.length; ++i) {
            const line = source.lines[i];
            if (line.startsWith('#include ')) {
                const includeFilename = line.substring(10, line.length - 1);

                if (Chunks.hasOwnProperty(includeFilename)) {
                    source.replace(i, Chunks[includeFilename]);
                    // re-process current line
                    --i;
                } else {
                    console.warn(`unable to resolve include '${includeFilename}'`);
                }
            }
        }
    }
}

export {
    ShaderDef
};
