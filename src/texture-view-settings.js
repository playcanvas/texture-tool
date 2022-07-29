import { Panel, Button, Container, LabelGroup, SelectInput, SliderInput, BooleanInput } from '@playcanvas/pcui';

const encodingTable = {
    'srgb': '0',
    'linear': '1',
    'rgbm': '2',
    'rgbe': '3'
};

class TextureViewSettingsPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'textureViewSettingsPane',
            headerText: 'View',
            collapsible: true,
            flexGrow: 0
        });

        super(args);

        // cubemap buttons
        //    +y
        // -x +z +x -z
        //    -y
        const faceButtonsContainer = new Container({
            id: 'cubemapFaceButtonsContainer'
        });

        const faceButtons = {
            0: new Button({ id: 'cubemapFacePx', class: 'cubemapFace', text: '+x' }),
            1: new Button({ id: 'cubemapFaceNx', class: 'cubemapFace', text: '-x' }),
            2: new Button({ id: 'cubemapFacePy', class: 'cubemapFace', text: '+y' }),
            3: new Button({ id: 'cubemapFaceNy', class: 'cubemapFace', text: '-y' }),
            4: new Button({ id: 'cubemapFacePz', class: 'cubemapFace', text: '+z' }),
            5: new Button({ id: 'cubemapFaceNz', class: 'cubemapFace', text: '-z' })
        };

        Object.keys(faceButtons).forEach((face) => {
            faceButtonsContainer.append(faceButtons[face]);
        });

        this.append(faceButtonsContainer);

        // mipmap select
        const mipmapSelect = new SelectInput({
            value: '0',
            options: [],
            flexGrow: 1
        });

        // texture type
        const textureTypeSelect = new SelectInput({
            value: '0',
            options: [
                { v: '0', t: 'gamma' },
                { v: '1', t: 'linear' },
                { v: '2', t: 'rgbm' },
                { v: '3', t: 'rgbe' },
                { v: '4', t: 'a' }
            ],
            flexGrow: 1
        });

        // alpha
        const alphaToggle = new BooleanInput();

        // filter
        const filterToggle = new BooleanInput();

        // exposure
        const exposureSlider = new SliderInput({
            value: 0,
            min: -5,
            max: 5,
            precision: 1,
            flexGrow: 1
        });

        // label groups
        this.append(new LabelGroup({ text: 'mipmap', field: mipmapSelect }));
        this.append(new LabelGroup({ text: 'type', field: textureTypeSelect }));
        this.append(new LabelGroup({ text: 'alpha', field: alphaToggle }));
        this.append(new LabelGroup({ text: 'filter', field: filterToggle }));
        this.append(new LabelGroup({ text: 'exposure', field: exposureSlider }));

        this.enabled = false;

        textureManager.on('textureDocAdded', (doc) => {
            doc.settings.patch({
                view: {
                    filter: false,
                    face: '0',
                    mipmap: '0',
                    type: doc.asset && encodingTable[doc.asset.resource.encoding] || '0',
                    alpha: false,
                    exposure: '0',
                    offsetX: 0,
                    offsetY: 0,
                    scale: 0
                }
            });
        });

        const events = [];
        textureManager.on('textureDocSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            // register change events
            events.push(texture.settings.on('view.face:set', (value) => {
                Object.keys(faceButtons).forEach((face) => {
                    if (face === value) {
                        faceButtons[face].dom.classList.add('depressed');
                    } else {
                        faceButtons[face].dom.classList.remove('depressed');
                    }
                });
            }));
            events.push(texture.settings.on('view.mipmap:set', (value) => {
                mipmapSelect.value = value;
            }));
            events.push(texture.settings.on('view.type:set', (value) => {
                textureTypeSelect.value = value;
            }));
            events.push(texture.settings.on('view.alpha:set', (value) => {
                alphaToggle.value = !!value;
            }));
            events.push(texture.settings.on('view.filter:set', (value) => {
                filterToggle.value = !!value;
            }));
            events.push(texture.settings.on('view.exposure:set', (value) => {
                exposureSlider.value = value;
            }));

            // register ui events
            Object.keys(faceButtons).forEach((face) => {
                events.push(faceButtons[face].on('click', () => {
                    texture.settings.set('view.face', face);
                }));
            });
            events.push(mipmapSelect.on('change', () => {
                texture.settings.set('view.mipmap', mipmapSelect.value);
            }));
            events.push(textureTypeSelect.on('change', () => {
                texture.settings.set('view.type', textureTypeSelect.value);
            }));
            events.push(alphaToggle.on('change', () => {
                texture.settings.set('view.alpha', alphaToggle.value);
            }));
            events.push(filterToggle.on('change', () => {
                texture.settings.set('view.filter', filterToggle.value);
            }));
            events.push(exposureSlider.on('change', () => {
                texture.settings.set('view.exposure', `${exposureSlider.value}`);
            }));

            // mipmap select
            const numMipmaps = texture.numMipmaps;
            const mips = [];
            for (let i = 0; i < numMipmaps; ++i) {
                mips.push({ v: '' + i, t: '' + i });
            }
            mipmapSelect.options = mips;

            // face select
            this.enabled = !!texture.resource;
            faceButtonsContainer.enabled = texture.cubemap;
        });
    }
}

export {
    TextureViewSettingsPanel
};
