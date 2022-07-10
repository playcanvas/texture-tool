import { Button, Panel, Container, SelectInput, LabelGroup, NumericInput } from '@playcanvas/pcui';
import {
    Texture, Asset, reprojectTexture,
    PIXELFORMAT_R8_G8_B8_A8, PIXELFORMAT_RGBA16F, PIXELFORMAT_RGBA32F,
    TEXTURETYPE_DEFAULT, TEXTURETYPE_RGBM, TEXTURETYPE_RGBE,
    FILTER_NEAREST, FILTER_LINEAR, FILTER_LINEAR_MIPMAP_LINEAR
} from 'playcanvas';
import { Texture as ToolTexture } from './texture.js';
import { Helpers } from './helpers.js';

class TextureReprojectPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'textureReprojectPane',
            headerText: 'Reproject',
            collapsible: true
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
        this.append(new LabelGroup({ text: 'width', field: width }));
        this.append(new LabelGroup({ text: 'height', field: height }));
        this.append(buttonContainer);

        this.content.enabled = false;

        const events = [];
        textureManager.on('textureSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            const t = texture.resource;

            if (!t) {
                source.options = {};
                target.options = {};
                width = '';
                height = '';
                this.content.enabled = false;
                return;
            }

            const onTargetProjectionChanged = () => {
                height.enabled = projections[target.value] !== 'cube';
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
                    'linear': PIXELFORMAT_RGBA16F,
                    'srgb': PIXELFORMAT_R8_G8_B8_A8
                }[targetEncoding];

                const type = {
                    'rgbm': 'rgbm',
                    'rgbe': 'rgbe',
                    'linear': 'default',
                    'srgb': 'default'
                }[targetEncoding];

                // create target texture
                let targetTexture = new Texture(t.device, {
                    cubemap: targetProjection === 'cube',
                    width: width.value,
                    height: height.value,
                    format: format,
                    type: type,
                    mipmaps: false,
                    projection: targetProjection
                });

                // reprojectTexture function uses the texture's own setup so apply view settings to the texture
                t.projection = sourceProjection;
                t.magFilter = t.encoding === 'rgbe' ? FILTER_NEAREST : FILTER_LINEAR;
                t.minFilter = t.encoding === 'rgbe' ? FILTER_NEAREST : FILTER_LINEAR_MIPMAP_LINEAR;
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

                // rgbe textures can't be filtered, so convert source texture to RGBA32F first if any sampling
                // is involved
                if (t.encoding === 'rgbe' &&
                    (width.value !== t.width || height.value !== t.height) ||
                    (sourceProjection !== targetProjection)) {
                    const tmp = new Texture(t.device, {
                        cubemap: sourceProjection === 'cube',
                        width: t.width,
                        height: t.height,
                        format: PIXELFORMAT_RGBA32F,
                        type: TEXTURETYPE_DEFAULT,
                        mipmaps: false,
                        projection: sourceProjection,
                        mipmaps: true
                    });

                    reprojectTexture(t, tmp);
                    reprojectTexture(tmp, targetTexture);

                    tmp.destroy();
                } else {
                    reprojectTexture(t, targetTexture);
                }

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

            this.content.enabled = true;
        });
    }
}

export {
    TextureReprojectPanel
};
