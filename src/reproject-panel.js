import { Button, Panel, Container, SelectInput, LabelGroup, NumericInput } from 'pcui';
import {
    Texture, Asset, reprojectTexture,
    PIXELFORMAT_R8_G8_B8_A8, PIXELFORMAT_RGBA16F, PIXELFORMAT_RGBA32F,
    TEXTURETYPE_DEFAULT, TEXTURETYPE_RGBM, TEXTURETYPE_RGBE, TEXTURETYPE_RGBP,
    FILTER_NEAREST, FILTER_LINEAR, FILTER_LINEAR_MIPMAP_LINEAR,
    ADDRESS_REPEAT, ADDRESS_CLAMP_TO_EDGE, EnvLighting
} from 'playcanvas';

import { Helpers } from './helpers.js';
import { TextureDoc } from './texture-doc.js';

class ReprojectPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'texture-reproject-pane',
            headerText: 'Reproject',
            collapsible: true
        });

        super(args);

        const projections = {
            0: 'cube',
            1: 'equirect',
            2: 'octahedral',
            3: 'envAtlas'
        };

        const pindices = {
            cube: '0',
            equirect: '1',
            octahedral: '2',
            none: '1'
        };

        const encodings = {
            0: 'rgbm',
            1: 'rgbe',
            2: 'rgbp',
            3: 'linear',
            4: 'srgb'
        };

        const eindices = {
            rgbm: '0',
            rgbe: '1',
            rgbp: '2',
            linear: '3',
            srgb: '4'
        };

        const sourceCubemapProjections = [
            { v: '0', t: 'cube' }
        ];

        const sourceTextureProjections = [
            { v: '1', t: 'equirect' },
            { v: '2', t: 'octahedral' }
        ];

        const targetProjections = [
            { v: '0', t: 'cube' },
            { v: '1', t: 'equirect' },
            { v: '2', t: 'octahedral' },
            { v: '3', t: 'envAtlas' }
        ];

        // source
        const source = new SelectInput({
            value: '0',
            options: [],
            width: 100
        });

        // target
        const target = new SelectInput({
            value: '0',
            options: [],
            width: 100
        });

        // encoding
        const encoding = new SelectInput({
            value: '0',
            options: [
                { v: '0', t: 'rgbm' },
                { v: '1', t: 'rgbe' },
                { v: '2', t: 'rgbp' },
                { v: '3', t: 'linear' },
                { v: '4', t: 'srgb' }
            ],
            width: 100
        });

        // width
        const width = new NumericInput({
            min: 1,
            max: 16384,
            precision: 0
        });

        // height
        const height = new NumericInput({
            min: 1,
            max: 16384,
            precision: 0
        });

        // reproject
        const reprojectButton = new Button({
            class: 'inspector-button',
            text: 'Reproject'
        });

        const buttonContainer = new Container({
            class: 'inspector-button-container',
            flex: true,
            flexDirection: 'row'
        });

        buttonContainer.append(reprojectButton);

        this.append(new LabelGroup({ text: 'source', field: source }));
        this.append(new LabelGroup({ text: 'target', field: target }));
        this.append(new LabelGroup({ text: 'encoding', field: encoding }));
        this.append(new LabelGroup({ text: 'width', field: width }));
        this.append(new LabelGroup({ text: 'height', field: height }));
        this.append(buttonContainer);

        const events = [];
        textureManager.on('textureDocSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            const t = texture.resource;

            if (!t) {
                source.options = [];
                target.options = [];
                width.value = '';
                height.value = '';
                this.enabled = false;
                return;
            }

            const onTargetProjectionChanged = () => {
                if (projections[target.value] === 'envAtlas') {
                    encoding.value = 2;
                    width.value = 512;
                }
                height.enabled = ['cube', 'envAtlas'].indexOf(projections[target.value]) === -1;
                if (!height.enabled) {
                    height.value = width.value;
                }
            };

            source.options = t.cubemap ? sourceCubemapProjections : sourceTextureProjections;
            source.value = t.cubemap ? pindices.cube : pindices[t.projection];

            target.options = targetProjections;
            target.value = t.cubemap ? pindices.equirect : pindices.cube;
            target.on('change', onTargetProjectionChanged);

            encoding.value = eindices[t.encoding];

            width.value = t.width;
            width.on('change', () => {
                onTargetProjectionChanged();
            });

            height.value = t.height;
            onTargetProjectionChanged();

            // register new events
            events.push(reprojectButton.on('click', () => {
                const sourceProjection = projections[source.value];
                const targetProjection = projections[target.value];
                const targetEncoding = encodings[encoding.value];

                const format = {
                    'rgbm': PIXELFORMAT_R8_G8_B8_A8,
                    'rgbe': PIXELFORMAT_R8_G8_B8_A8,
                    'rgbp': PIXELFORMAT_R8_G8_B8_A8,
                    'linear': PIXELFORMAT_RGBA16F,
                    'srgb': PIXELFORMAT_R8_G8_B8_A8
                }[targetEncoding];

                const type = {
                    'rgbm': 'rgbm',
                    'rgbe': 'rgbe',
                    'rgbp': 'rgbp',
                    'linear': 'default',
                    'srgb': 'default'
                }[targetEncoding];

                // create target texture
                const targetTexture = new Texture(t.device, {
                    cubemap: targetProjection === 'cube',
                    width: width.value,
                    height: height.value,
                    format: format,
                    type: type,
                    mipmaps: false,
                    projection: targetProjection,
                    anisotropy: t.device.maxAnisotropy
                });

                // reprojectTexture function uses the texture's own setup so apply view settings to the texture
                t.projection = sourceProjection;
                t.magFilter = t.encoding === 'rgbe' ? FILTER_NEAREST : FILTER_LINEAR;
                t.minFilter = t.encoding === 'rgbe' ? FILTER_NEAREST : FILTER_LINEAR_MIPMAP_LINEAR;
                t.addressU = ADDRESS_REPEAT;
                t.addressV = sourceProjection === 'equirect' ? ADDRESS_CLAMP_TO_EDGE : ADDRESS_REPEAT;
                switch (texture.settings.get('view.type')) {
                    case 'rgbm': t.type = TEXTURETYPE_RGBM; break;
                    case 'rgbe': t.type = TEXTURETYPE_RGBE; break;
                    case 'rgbp': t.type = TEXTURETYPE_RGBP; break;
                    default:  t.type = TEXTURETYPE_DEFAULT; break;
                }
                t.anisotropy = t.device.maxAnisotropy;

                // check if dimensions and projection are the same
                const sameProjection = sourceProjection === targetProjection;
                const sameDims = width.value === t.width && height.value === t.height;

                // check if source texture is capable of reprojection as-is
                if (sameProjection && (sameDims || (t.encoding !== 'rgbe' && t.mipmaps && t._levels.length > 1))) {
                    reprojectTexture(t, targetTexture, { numSamples: 1 });
                } else {
                    const tmp = new Texture(t.device, {
                        cubemap: sourceProjection === 'cube',
                        width: t.width,
                        height: t.height,
                        format: PIXELFORMAT_RGBA32F,
                        type: TEXTURETYPE_DEFAULT,
                        projection: sourceProjection,
                        addressU: ADDRESS_REPEAT,
                        addressV: sourceProjection === 'equirect' ? ADDRESS_CLAMP_TO_EDGE : ADDRESS_REPEAT,
                        mipmaps: true,
                        anisotropy: t.device.maxAnisotropy
                    });

                    reprojectTexture(t, tmp, { numSamples: 1 });

                    if (targetProjection === 'envAtlas') {
                        const lighting = EnvLighting.generateLightingSource(tmp, {
                            size: 256
                        });
                        lighting.anisotropy = t.device.maxAnisotropy;
                        EnvLighting.generateAtlas(lighting, {
                            target: targetTexture
                        });
                        lighting.destroy();
                    } else {
                        reprojectTexture(tmp, targetTexture, { numSamples: 1 });
                    }
                    tmp.destroy();
                }

                const asset = new Asset(`${Helpers.removeExtension(texture.asset.name)}-${targetProjection}`, targetProjection === 'cube' ? 'cubemap' : 'texture', {
                    filename: `${Helpers.removeExtension(texture.filename)}-${targetProjection}`,
                    url: ''
                }, null);
                asset.resource = targetTexture;
                asset.loaded = true;

                // create the new texture document
                const textureDoc = new TextureDoc(asset);
                textureManager.assets.add(asset);
                textureManager.addTextureDoc(textureDoc);
                textureManager.selectTextureDoc(textureDoc);
            }));

            this.enabled = true;
        });

        this.enabled = false;
    }

    generateEnvAtlas(source, target) {

    }
}

export {
    ReprojectPanel
};
