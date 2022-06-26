import { Button, Panel, Container, SelectInput, Label } from '@playcanvas/pcui';
import { Texture, Asset, reprojectTexture, PIXELFORMAT_R8_G8_B8_A8, PIXELFORMAT_RGBA16F } from 'playcanvas';
import { Texture as ToolTexture } from './texture.js';

class TextureProcessPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'textureProcessPane',
            headerText: 'Process',
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
        const sourceContainer = new Container({
            flex: true,
            flexDirection: 'row'
        });

        const source = new SelectInput({
            value: '0',
            options: [],
            width: 100
        });

        sourceContainer.append(new Label({ text: 'source' }));
        sourceContainer.append(source);

        // target
        const targetContainer = new Container({
            flex: true,
            flexDirection: 'row'
        });

        const target = new SelectInput({
            value: '0',
            options: [],
            width: 100
        });

        targetContainer.append(new Label({ text: 'target' }));
        targetContainer.append(target);

        // encoding
        const encodingContainer = new Container({
            flex: true,
            flexDirection: 'row'
        });

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

        encodingContainer.append(new Label({ text: 'encoding' }));
        encodingContainer.append(encoding);

        const equiToCubemapButton = new Button({
            text: 'Reproject'
        });

        this.append(sourceContainer);
        this.append(targetContainer);
        this.append(encodingContainer);
        this.append(equiToCubemapButton);

        const events = [];
        textureManager.on('textureSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            // register new events
            events.push(equiToCubemapButton.on('click', () => {
                const sourceProjection = projections[source.value];
                const targetProjection = projections[target.value];
                const targetEncoding = encodings[encoding.value];

                const sourceSize = {
                    'cube': texture.resource.height,
                    'equirect': texture.resource.height,
                    'octahedral': texture.resource.height / 2
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
                    targetTexture = new Texture(texture.resource.device, {
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
                    targetTexture = new Texture(texture.resource.device, {
                        width: targetWidth[targetProjection],
                        height: targetHeight[targetProjection],
                        format: format,
                        type: type,
                        mipmaps: false
                    });
                }

                texture.resource.projection = sourceProjection;
                targetTexture.projection = targetProjection;

                reprojectTexture(texture.resource, targetTexture);

                const asset = new Asset(`${texture.name}-${targetProjection}`, 'cubemap', {
                    filename: `${texture.filename}-${targetProjection}`,
                    url: ''
                }, null);
                asset.resource = targetTexture;
                asset.loaded = true;

                textureManager.addTexture(new ToolTexture(asset));
            }));

            source.options = texture.resource.cubemap ? sourceCubemapProjections  : sourceTextureProjections;
            source.value = texture.resource.cubemap ? pindices['cube'] : pindices[texture.resource.projection];

            target.options = targetProjections;
            target.value = texture.resource.cubemap ? pindices['equirect'] : pindices['cube'];

            encoding.value = eindices[texture.resource.encoding];
        });
    }
}

export {
    TextureProcessPanel
}
