import { Button, Panel, Container, SelectInput, LabelGroup } from '@playcanvas/pcui';
import { Texture, Asset, reprojectTexture, PIXELFORMAT_R8_G8_B8_A8, PIXELFORMAT_RGBA16F, TEXTURETYPE_DEFAULT, TEXTURETYPE_RGBM, TEXTURETYPE_RGBE } from 'playcanvas';
import { Texture as ToolTexture } from './texture.js';
import { Helpers } from './helpers.js';

class TextureReprojectPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'textureReprojectPane',
            headerText: 'Reproject',
            collapsible: true,
            flexGrow: 1
        });

        super(args);

        const projections = {
            0: 'cube',
            1: 'equirect',
            2: 'octahedral'
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
            2: 'linear',
            3: 'srgb'
        };

        const eindices = {
            rgbm: '0',
            rgbe: '1',
            linear: '2',
            srgb: '3'
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
            { v: '2', t: 'octahedral' }
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
                { v: '2', t: 'linear' },
                { v: '3', t: 'srgb' }
            ],
            width: 100
        });

        // reproject
        const reprojectButton = new Button({
            class: 'inspectorButton',
            text: 'Reproject'
        });

        const buttonContainer = new Container({
            class: 'inspectorButtonContainer',
            flex: true,
            flexDirection: 'row'
        });

        buttonContainer.append(reprojectButton);

        this.append(new LabelGroup({ text: 'source', field: source }));
        this.append(new LabelGroup({ text: 'target', field: target }));
        this.append(new LabelGroup({ text: 'encoding', field: encoding }));
        this.append(buttonContainer);

        source.enabled = target.enabled = encoding.enabled = reprojectButton.enabled = false;

        const events = [];
        textureManager.on('textureSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            const t = texture.resource;

            // register new events
            events.push(reprojectButton.on('click', () => {
                const sourceProjection = projections[source.value];
                const targetProjection = projections[target.value];
                const targetEncoding = encodings[encoding.value];

                const sourceSize = {
                    'cube': texture.height,
                    'equirect': texture.height,
                    'octahedral': texture.height / 2
                }[sourceProjection];

                const format = {
                    'rgbm': PIXELFORMAT_R8_G8_B8_A8,
                    'rgbe': PIXELFORMAT_R8_G8_B8_A8,
                    'linear': PIXELFORMAT_RGBA16F,
                    'srgb': PIXELFORMAT_R8_G8_B8_A8
                }[targetEncoding];

                const type = {
                    'rgbm': 'rgbm',
                    'rgbe': 'rgbe',
                    'linear': 'default',
                    'srgb': 'default'
                }[targetEncoding];

                let targetTexture;
                if (targetProjection === 'cube') {
                    targetTexture = new Texture(t.device, {
                        cubemap: true,
                        width: sourceSize,
                        height: sourceSize,
                        format: format,
                        type: type,
                        mipmaps: false
                    });
                } else {
                    const targetWidth = {
                        'equirect': sourceSize * 2,
                        'octahedral': sourceSize * 2
                    };
                    const targetHeight = {
                        'equirect': sourceSize,
                        'octahedral': sourceSize * 2
                    }
                    targetTexture = new Texture(t.device, {
                        width: targetWidth[targetProjection],
                        height: targetHeight[targetProjection],
                        format: format,
                        type: type,
                        mipmaps: false
                    });
                }

                // reprojectTexture function uses the texture's own setup so apply view settings to the texture
                if (t) {
                    t.projection = sourceProjection;
                    switch (texture.view.get('type')) {
                        case '2':
                            t.type = TEXTURETYPE_RGBM;
                            break;
                        case '3':
                            t.type = TEXTURETYPE_RGBE;
                            break;
                        default:
                            t.type = TEXTURETYPE_DEFAULT;
                            break;
                    }
                }
                targetTexture.projection = targetProjection;

                reprojectTexture(t, targetTexture);

                const asset = new Asset(`${Helpers.removeExtension(texture.asset.name)}-${targetProjection}`, 'cubemap', {
                    filename: `${Helpers.removeExtension(texture.filename)}-${targetProjection}`,
                    url: ''
                }, null);
                asset.resource = targetTexture;
                asset.loaded = true;

                const toolTexture = new ToolTexture(asset);
                textureManager.assets.add(asset);
                textureManager.addTexture(toolTexture);
                textureManager.selectTexture(toolTexture);
            }));

            source.enabled = target.enabled = encoding.enabled = reprojectButton.enabled = !!t;
            if (t) {
                source.options = t.cubemap ? sourceCubemapProjections  : sourceTextureProjections;
                source.value = t.cubemap ? pindices['cube'] : pindices[t.projection];

                target.options = targetProjections;
                target.value = t.cubemap ? pindices['equirect'] : pindices['cube'];

                encoding.value = eindices[t.encoding];
            }
        });
    }
}

export {
    TextureReprojectPanel
}
