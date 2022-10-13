import * as pc from 'playcanvas';
import { Panel, Button, SelectInput } from 'pcui';
import { OrbitCamera } from './orbit-camera.js';
import { RenderCanvas } from './render-canvas.js';
import { CubemapViewMaterial } from './cubemap-material.js';

const calcMipmaps = (width, height) => {
    return Math.floor(Math.log2(Math.max(width, height))) + 1;
};

class CubemapView extends Panel {
    constructor(renderer, args = {}) {
        Object.assign(args, {
            class: 'render-view',
            flex: true,
            flexGrow: 1,
            flexShrink: 1
        });
        super(args);

        const device = renderer.app.graphicsDevice;

        this.renderer = renderer;
        this.canvas = new RenderCanvas();
        this.append(this.canvas);
        this.renderView = new RenderView(renderer, this.canvas);
        this.texture = null;
        this.renderTexture = null;

        // fix seams toggle
        this.fixSeamsToggle = new Button({
            text: 'Fix seams'
        });
        this.fixSeamsToggle.on('click', () => {
            this.material.setFixSeams(this.fixSeamsToggle.dom.classList.toggle('depressed'));
            this.renderView.render();
        });

        // view selector
        this.viewSelect = new SelectInput({
            width: 110,
            value: '0',
            options: [
                { v: '0', t: 'Texture' },
                { v: '1', t: 'Lighting' },
                { v: '2', t: 'Reflection' },
                { v: '3', t: 'Ambient' }
            ]
        });
        this.viewSelect.on('change', () => {
            this.updateTexture();
        });

        // filter toggle
        this.filterToggle = new Button({
            text: 'Filter'
        });
        this.filterToggle.on('click', () => {
            this.material.setFilter(this.filterToggle.dom.classList.toggle('depressed'));
            this.renderView.render();
        });

        // mipmap selector
        this.mipmapSelect = new SelectInput({
            width: 50,
            value: '0',
            options: []
        });
        this.mipmapSelect.on('change', () => {
            this.material.setMipmap(parseInt(this.mipmapSelect.value, 10));
            this.renderView.render();
        });

        // pixel type selector
        this.textureTypeSelect = new SelectInput({
            width: 80,
            value: '0',
            options: [
                { v: '0', t: 'gamma' },
                { v: '1', t: 'linear' },
                { v: '2', t: 'rgbm' },
                { v: '3', t: 'rgbe' },
                { v: '4', t: 'rgbp' },
                { v: '5', t: 'a' }
            ]
        });
        this.textureTypeSelect.on('change', () => {
            this.material.setTextureType(this.textureTypeSelect.options[this.textureTypeSelect.value].t);
            this.renderView.render();
        });

        // exposure selector
        this.exposureSelector = new SelectInput({
            width: 50,
            value: '0',
            options: [
                { v: '-3', t: '-3' },
                { v: '-2', t: '-2' },
                { v: '-1', t: '-1' },
                { v: '0', t: '0' },
                { v: '1', t: '1' },
                { v: '2', t: '2' },
                { v: '3', t: '3' }
            ]
        });
        this.exposureSelector.on('change', () => {
            this.material.setExposure(Math.pow(2, parseInt(this.exposureSelector.value, 10)));
            this.renderView.render();
        });

        this.header.append(this.fixSeamsToggle);
        this.header.append(this.viewSelect);
        this.header.append(this.filterToggle);
        this.header.append(this.mipmapSelect);
        this.header.append(this.textureTypeSelect);
        this.header.append(this.exposureSelector);

        // create shape primitives
        this.material = new CubemapViewMaterial(device);

        // create sphere mesh
        const sphereMesh = pc.createSphere(device, { radius: 0.5, longitudeBands: 64, latitudeBands: 64 });
        const sphere = new pc.Entity('sphere');
        sphere.addComponent('render', {
            material: this.material.material,
            meshInstances: [new pc.MeshInstance(sphereMesh, this.material.material)]
        });

        // create the shape root
        this.shapeRoot = new pc.Entity('shapeRoot');
        this.shapeRoot.addChild(sphere);
        this.renderer.app.root.addChild(this.shapeRoot);

        // create the light
        this.light = new pc.Entity();
        this.light.addComponent('light', {
            type: 'directional'
        });
        this.light.setLocalEulerAngles(90, 0, 0);

        // create the camera
        this.camera = new pc.Entity();
        this.camera.addComponent('camera', {
            clearColor: new pc.Color(0.2, 0.2, 0.2, 1.0),
            fov: 45,
            farClip: 100000
        });
        this.camera.addChild(this.light);
        this.renderer.app.root.addChild(this.camera);

        // create the orbit camera
        this.orbitCamera = new OrbitCamera(this.canvas.canvas);
        this.orbitCamera.transform.applyTo(this.camera);
        this.orbitCamera.transform.on('changed', () => {
            this.orbitCamera.transform.applyTo(this.camera);
            this.renderView.render();
        });

        this.frameModel();

        this.renderView.on('prerender', (frameTime) => {
            this.material.prepare();
        });
    }

    setTexture(texture, filename) {
        this.texture = texture;
        this.updateTexture();
    }

    updateTexture() {
        // destroy previously processed texture
        if (this.renderTexture) {
            this.renderTexture.destroy();
            this.renderTexture = null;
        }

        // create new processed texture
        switch (this.viewSelect.options[this.viewSelect.value].t) {
            case 'Texture':
                if (!this.texture.cubemap) {
                    this.renderTexture = pc.EnvLighting.generateSkyboxCubemap(this.texture);
                }
                break;
            case 'Lighting':
                if (this.texture.type === pc.TEXTURETYPE_DEFAULT && this.texture.format === pc.PIXELFORMAT_R8_G8_B8_A8) {
                    this.texture.type = pc.TEXTURETYPE_RGBM;
                }
                this.renderTexture = pc.EnvLighting.generateLightingSource(this.texture);
                break;
            case 'Reflection': {
                if (this.texture.type === pc.TEXTURETYPE_DEFAULT && this.texture.format === pc.PIXELFORMAT_R8_G8_B8_A8) {
                    this.texture.type = pc.TEXTURETYPE_RGBM;
                }
                const lighting = pc.EnvLighting.generateLightingSource(this.texture);
                this.renderTexture = pc.EnvLighting.generateReflection(lighting);
                lighting.destroy();
                break;
            }
            case 'Ambient': {
                if (this.texture.type === pc.TEXTURETYPE_DEFAULT && this.texture.format === pc.PIXELFORMAT_R8_G8_B8_A8) {
                    this.texture.type = pc.TEXTURETYPE_RGBM;
                }
                const lighting = pc.EnvLighting.generateLightingSource(this.texture);
                this.renderTexture = pc.EnvLighting.generateAmbient(lighting);
                lighting.destroy();
                break;
            }
        }

        const texture = this.renderTexture || this.texture;
        this.updateUI(texture);
        this.material.setTexture(texture);
        this.renderView.render();
    }

    updateUI(texture) {
        // mipmap select
        const numMips = texture.mipmaps ? calcMipmaps(texture.width, texture.height) : 1;
        const mips = [];
        for (let i = 0; i < numMips; ++i) {
            mips.push({ v: '' + i, t: '' + i });
        }
        this.mipmapSelect.options = mips;

        // texture type select
        if (texture.type === pc.TEXTURETYPE_RGBM) {
            this.textureTypeSelect.value = '2';
        } else if (texture.type === pc.TEXTURETYPE_RGBE) {
            this.textureTypeSelect.value = '3';
        } else {
            const floatFormat = texture.format === pc.PIXELFORMAT_RGBA16F || texture.format === pc.PIXELFORMAT_RGBA32F;
            this.textureTypeSelect.value = floatFormat ? '1' : '0';
        }
    }

    frameModel() {
        this.orbitCamera.frame(this.shapeRoot, this.camera.camera);
    }
}

export {
    CubemapView
};
