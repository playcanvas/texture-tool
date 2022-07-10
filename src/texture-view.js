import {
    Layer,
    LayerComposition,
    Entity,
    Mesh,
    Material,
    MeshInstance,
    Color,
    Texture,
    FILTER_LINEAR,
    FILTER_NEAREST,
    FILTER_LINEAR_MIPMAP_LINEAR,
    FILTER_NEAREST_MIPMAP_LINEAR,
    PIXELFORMAT_R8_G8_B8_A8,
    TEXTURETYPE_DEFAULT
} from 'playcanvas';
import { ShaderDef } from './shader-gen';

class TextureView {
    constructor(canvas) {
        const device = canvas.renderer.app.graphicsDevice;

        this.canvas = canvas;

        // construct the scene
        this.composition = new LayerComposition('texture-preview');

        this.layer = new Layer({
            id: -2,
            enabled: true,
            opaqueSortMost: 2,
            transparentSortMode: 3
        });
        this.composition.push(this.layer);

        this.canvas.composition = this.composition;

        // root entity
        this.root = new Entity();

        // mesh
        const mesh = new Mesh(device);
        mesh.setPositions([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ]);
        mesh.setIndices([
            0, 1, 2,
            0, 2, 3
        ]);
        mesh.update();

        // construct the material
        this.material = new Material();

        this.material.getShaderVariant = (device) => {
            const decodeFunc = {
                'gamma': 'decodeGamma',
                'linear': 'decodeLinear',
                'rgbm': 'decodeRGBM',
                'rgbe': 'decodeRGBE',
                'rgbp': 'decodeRGBP',
                'a': 'decodeAlpha'
            };

            const shaderDef = {
                vertex: {
                    source: 'texture.vert'
                },
                fragment: {
                    defines: {
                        TEXTURE_ALPHA: this.alpha,
                        TEXTURE_CUBEMAP: this.texture && this.texture.cubemap,
                        DECODE_FUNC: decodeFunc[this.textureType]
                    },
                    source: 'texture.frag',
                    webgl1Extensions: [
                        'GL_OES_standard_derivatives',
                        'GL_EXT_shader_texture_lod'
                    ]
                }
            };

            return ShaderDef.createShader(device, shaderDef);
        };

        // render entity
        this.render = new Entity();
        this.render.addComponent('render', {
            material: this.material,
            meshInstances: [
                new MeshInstance(mesh, this.material)
            ]
        });
        this.root.addChild(this.render);

        // camera
        this.camera = new Entity();
        this.camera.addComponent('camera', {
            nearClip: 0.01,
            farClip: 32,
            fov: 30,
            clearColor: new Color(0, 0, 0, 0),
            frustumCulling: false,
            layers: []
        });
        this.camera.setLocalPosition(0, 0, 2.2);
        this.camera.camera.layers = [this.layer.id];
        this.root.addChild(this.camera);

        this.layer.addMeshInstances(this.render.render.meshInstances);
        this.layer.addCamera(this.camera.camera);

        this.root.syncHierarchy();

        // handle canvas resize
        this.canvas.on('resize', () => {
            this.setViewport(this.canvas.canvasWidth * window.devicePixelRatio,
                             this.canvas.canvasHeight * window.devicePixelRatio);
        });

        // handle renders
        this.canvas.on('prerender', (frameTime) => {
            // set filtering
            if (this.texture && this.texture.resource) {
                this.texture.resource.magFilter = this.filter ? FILTER_LINEAR : FILTER_NEAREST;
                this.texture.resource.minFilter = this.filter ? FILTER_LINEAR_MIPMAP_LINEAR : FILTER_NEAREST_MIPMAP_LINEAR;
            }
            this.prepare();
        });

        // create default texture
        const data = new Uint8ClampedArray([64, 64, 64, 255]);
        this.defaultTex = new Texture(device, {
            cubemap: false,
            width: 1,
            height: 1,
            format: PIXELFORMAT_R8_G8_B8_A8,
            type: TEXTURETYPE_DEFAULT,
            levels: [data]
        });

        this.rebuildMaterial = true;
        this.texture = null;
        this.textureType = 'gamma';
        this.alpha = false;
        this.face = 0;
        this.filter = false;
        this.mipmap = 0;
        this.exposure = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1.0;
        this.viewportW = 300;
        this.viewportH = 150;
    }

    setTexture(texture) {
        if (texture !== this.texture) {
            this.texture = texture;
            this.scale = Math.min(this.viewportW / this.texture.width, this.viewportH / this.texture.height);
            this.offsetX = 0;
            this.offsetY = 0;
            this.clamp();
            this.rebuildMaterial = true;
            this.canvas.render();
        }
    }

    setFace(value) {
        if (value !== this.face) {
            this.face = value;
            this.canvas.render();
        }
    }

    setTextureType(value) {
        if (value !== this.textureType) {
            this.textureType = value;
            this.rebuildMaterial = true;
            this.canvas.render();
        }
    }

    setAlpha(value) {
        if (value !== this.alpha) {
            this.alpha = value;
            this.rebuildMaterial = true;
            this.canvas.render();
        }
    }

    setFilter(value) {
        if (value !== this.filter) {
            this.filter = value;
            this.canvas.render();
        }
    }

    setMipmap(value) {
        if (value !== this.mipmap) {
            this.mipmap = value;
            this.canvas.render();
        }
    }

    setExposure(value) {
        if (value !== this.exposure) {
            this.exposure = value;
            this.canvas.render();
        }
    }

    setViewport(width, height) {
        this.viewportW = width;
        this.viewportH = height;
        this.clamp();
    }

    setScale(scale, pixelX, pixelY) {
        const tex = this.pixelToTexel(pixelX, this.viewportH - pixelY);

        // update scale
        this.scale = scale; // Math.max(1, Math.min(100, scale));
        this.clamp();

        // keep pixelX,pixelY under the cursor
        const pix = this.texelToPixel(tex.u, tex.v);
        this.offsetX -= pix.x - pixelX;
        this.offsetY -= pix.y - (this.viewportH - pixelY);
        this.clamp();
    }

    setOffset(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.clamp();
    }

    pixelToTexel(x, y) {
        return {
            u: (x - this.offsetX) / this.scale,
            v: (y - this.offsetY) / this.scale
        };
    }

    texelToPixel(u, v) {
        return {
            x: u * this.scale + this.offsetX,
            y: v * this.scale + this.offsetY
        };
    }

    clamp() {
        if (this.texture) {
            // clamp scale
            const minScale = 0.2; // Math.min(this.viewportW / this.texture.width, this.viewportH / this.texture.height);
            const maxScale = 100;
            this.scale = Math.max(minScale, Math.min(maxScale, this.scale));

            // clamp offsetX
            const diffX = this.scale * this.texture.width - this.viewportW;
            this.offsetX = diffX < 0 ? diffX * -0.5 : Math.max(-diffX, Math.min(0, this.offsetX));

            // clamp offsetY
            const diffY = this.scale * this.texture.height - this.viewportH;
            this.offsetY = diffY < 0 ? diffY * -0.5 : Math.max(-diffY, Math.min(0, this.offsetY));

            this.canvas.render();
        }
    }

    // prepare the material for rendering
    prepare() {
        if (this.rebuildMaterial) {
            this.rebuildMaterial = false;
            this.material.shader = null;
            this.material.clearVariants();
        }
        this.material.setParameter('tex', this.texture?.resource || this.defaultTex);
        this.material.setParameter('face', this.face);
        this.material.setParameter('mipmap', this.mipmap);
        this.material.setParameter('exposure', this.exposure);
        this.material.setParameter('offset', [this.offsetX, this.offsetY]);
        this.material.setParameter('scale', this.scale);
        this.material.setParameter('viewportSize', [this.viewportW, this.viewportH]);
        this.material.setParameter('texSize', this.texture ? [this.texture.width, this.texture.height] : [1, 1]);
        this.material.update();
    }
}

export {
    TextureView
};
