import * as pc from 'playcanvas';
import { ShaderDef } from './shader-gen.js';

class CubemapViewMaterial {
    constructor(device) {
        this.material = new pc.Material();

        this.material.updateShader = (device) => {
            const textureTypeTable = ['gamma', 'linear', 'rgbm', 'rgbe', 'a'];

            const shaderDef = {
                vertex: {
                    source: 'cubemap.vert'
                },
                fragment: {
                    defines: {
                        TEXTURE_TYPE: textureTypeTable.indexOf(this.textureType),
                        FIX_SEAMS: this.fixSeams ? '1' : '0'
                    },
                    source: 'cubemap.frag',
                    webgl1Extensions: [
                        'GL_OES_standard_derivatives',
                        'GL_EXT_shader_texture_lod'
                    ]
                }
            };

            this.material.shader = ShaderDef.createShader(device, shaderDef);
        };

        const data = new Uint8ClampedArray([64, 64, 64, 255]);
        this.defaultTex = new pc.Texture(device, {
            cubemap: true,
            width: 1,
            height: 1,
            format: pc.PIXELFORMAT_R8_G8_B8_A8,
            type: pc.TEXTURETYPE_DEFAULT,
            levels: [[data, data, data, data, data, data]]
        });

        this.rebuildMaterial = true;
        this.texture = null;
        this.textureType = 'gamma';
        this.filter = false;
        this.fixSeams = false;
        this.mipmap = 0;
        this.exposure = 1;
    }

    setTexture(texture) {
        if (texture !== this.texture) {
            this.texture = texture;
            this.rebuildMaterial = true;
        }
    }

    setTextureType(value) {
        if (value !== this.textureType) {
            this.textureType = value;
            this.rebuildMaterial = true;
        }
    }

    setFilter(value) {
        if (value !== this.filter) {
            this.filter = value;
        }
    }

    setFixSeams(value) {
        this.fixSeams = value;
        this.rebuildMaterial = true;
    }

    setMipmap(value) {
        this.mipmap = value;
    }

    setExposure(value) {
        this.exposure = value;
    }

    // prepare the material for rendering
    prepare() {
        if (this.rebuildMaterial) {
            this.rebuildMaterial = false;
            this.material.shader = null;
            this.material.clearVariants();
        }

        if (this.texture) {
            this.texture.magFilter = this.filter ? pc.FILTER_LINEAR : pc.FILTER_NEAREST;
            this.texture.minFilter = this.filter ? pc.FILTER_LINEAR_MIPMAP_LINEAR : pc.FILTER_NEAREST_MIPMAP_LINEAR;
        }

        this.material.setParameter('tex', this.texture || this.defaultTex);
        this.material.setParameter('mipmap', this.mipmap);
        this.material.setParameter('exposure', this.exposure);
        this.material.setParameter('texSize', this.texture ? this.texture.width : 1);
        this.material.update();
    }
}

export {
    CubemapViewMaterial
};
