import { Button, Container, Label, SelectInput, SliderInput } from '@playcanvas/pcui';

class TextureViewSettingsPanel extends Container {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'textureViewSettings'
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

        const mipmapSelect = new SelectInput({
            value: '0',
            options: [],
            flexGrow: 1
        });

        const mipmapContainer = new Container({
            flex: true,
            flexDirection: 'row'
        });
        mipmapContainer.append(new Label({ text: 'mipmap' }));
        mipmapContainer.append(mipmapSelect);

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

        const alphaToggle = new Button({
            id: 'alphaToggle',
            text: 'a',
            flexGrow: 0,
            flexShrink: 0,
            height: 24
        });

        const textureTypeContainer = new Container({
            flex: true,
            flexDirection: 'row'
        });
        textureTypeContainer.append(new Label({ text: 'type' }));
        textureTypeContainer.append(textureTypeSelect);
        textureTypeContainer.append(alphaToggle);

        const exposureSlider = new SliderInput({
            value: 0,
            min: -5,
            max: 5,
            precision: 1,
            flexGrow: 1
        });

        const exposureContainer = new Container({
            flex: true,
            flexDirection: 'row'
        });
        exposureContainer.append(new Label({ text: 'exposure' }));
        exposureContainer.append(exposureSlider);

        const filterToggle = new Button({
            text: 'Filter'
        });

        this.append(faceButtonsContainer);
        this.append(mipmapContainer);
        this.append(textureTypeContainer);
        this.append(exposureContainer);
        this.append(filterToggle);

        const events = [];

        textureManager.on('textureSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            // register change events
            events.push(texture.view.on('filter:set', (value) => {
                if (value) {
                    filterToggle.dom.classList.add('depressed');
                } else {
                    filterToggle.dom.classList.remove('depressed');
                }
            }));
            events.push(texture.view.on('face:set', (value) => {
                Object.keys(faceButtons).forEach((face) => {
                    if (face === value) {
                        faceButtons[face].dom.classList.add('depressed');
                    } else {
                        faceButtons[face].dom.classList.remove('depressed');
                    }
                });
            }));
            events.push(texture.view.on('mipmap:set', (value) => {
                mipmapSelect.value = value;
            }));
            events.push(texture.view.on('type:set', (value) => {
                textureTypeSelect.value = value;
            }));
            events.push(texture.view.on('alpha:set', (value) => {
                if (value) {
                    alphaToggle.dom.classList.add('depressed');
                } else {
                    alphaToggle.dom.classList.remove('depressed');
                }
            }));
            events.push(texture.view.on('exposure:set', (value) => {
                exposureSlider.value = value;
            }));

            // register ui events
            events.push(filterToggle.on('click', () => {
                texture.view.set('filter', !filterToggle.dom.classList.contains('depressed'));
            }));
            Object.keys(faceButtons).forEach((face) => {
                events.push(faceButtons[face].on('click', () => {
                    texture.view.set('face', face);
                }));
            });
            events.push(mipmapSelect.on('change', () => {
                texture.view.set('mipmap', mipmapSelect.value);
            }));
            events.push(textureTypeSelect.on('change', () => {
                texture.view.set('type', textureTypeSelect.value);
            }));
            events.push(alphaToggle.on('click', () => {
                texture.view.set('alpha', !alphaToggle.dom.classList.contains('depressed'));
            }));
            events.push(exposureSlider.on('change', () => {
                texture.view.set('exposure', `${exposureSlider.value}`);
            }));

            // face select
            faceButtonsContainer.enabled = texture.cubemap;

            // mipmap select
            const numMipmaps = texture.numMipmaps;
            const mips = [];
            for (let i = 0; i < numMipmaps; ++i) {
                mips.push({ v: '' + i, t: '' + i });
            }
            mipmapSelect.options = mips;
        });
    }
};

export {
    TextureViewSettingsPanel
};
