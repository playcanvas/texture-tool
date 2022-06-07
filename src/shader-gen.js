import * as pc from 'playcanvas';
import { Chunks } from './chunks.js';

const attributeSemantics = {
    vertex_position: pc.SEMANTIC_POSITION,
    vertex_normal: pc.SEMANTIC_NORMAL,
    vertex_tangent: pc.SEMANTIC_TANGENT,
    vertex_texCoord0: pc.SEMANTIC_TEXCOORD0,
    vertex_texCoord1: pc.SEMANTIC_TEXCOORD1,
    vertex_texCoord2: pc.SEMANTIC_TEXCOORD2,
    vertex_texCoord3: pc.SEMANTIC_TEXCOORD3,
    vertex_texCoord4: pc.SEMANTIC_TEXCOORD4,
    vertex_texCoord5: pc.SEMANTIC_TEXCOORD5,
    vertex_texCoord6: pc.SEMANTIC_TEXCOORD6,
    vertex_texCoord7: pc.SEMANTIC_TEXCOORD7,
    vertex_color: pc.SEMANTIC_COLOR,
    vertex_boneIndices: pc.SEMANTIC_BLENDINDICES,
    vertex_boneWeights: pc.SEMANTIC_BLENDWEIGHT
};

class ShaderSource {
    constructor() {
        this.lines = [];
    }

    append(text) {
        const lines = text.split('\n');
        lines.forEach((l) => {
            this.lines.push(l);
        })
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
            vertSource.append(pc.shaderChunks.gles3VS);

            fragSource.append(version);
            fragSource.append(pc.shaderChunks.gles3PS);
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

        return new pc.Shader(device, {
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
                    source.append(`#define ${k} ${defines[k]}`);
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
}
