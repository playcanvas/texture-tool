import { Panel, Button, Container, LabelGroup, SelectInput, SliderInput, BooleanInput } from 'pcui';
interface EventHandleLike {
    unbind: () => void;
}
import type { TextureManager } from './texture-manager';
import type { TextureDoc } from './texture-doc';

class ShowPanel extends Panel {
    constructor(textureManager: TextureManager, args: Record<string, any> = {}) {
        Object.assign(args, {
            id: 'show-panel',
            headerText: 'Show',
            collapsible: true,
            flexGrow: '0'
        });

        super(args);

        // cubemap buttons
        //    +y
        // -x +z +x -z
        //    -y
        const faceButtonsContainer = new Container({
            id: 'cubemap-face-buttons-container'
        });

        const faceButtons: Record<string, Button> = {
            0: new Button({ id: 'cubemap-face-px', class: 'cubemap-face', text: '+x' }),
            1: new Button({ id: 'cubemap-face-nx', class: 'cubemap-face', text: '-x' }),
            2: new Button({ id: 'cubemap-face-py', class: 'cubemap-face', text: '+y' }),
            3: new Button({ id: 'cubemap-face-ny', class: 'cubemap-face', text: '-y' }),
            4: new Button({ id: 'cubemap-face-pz', class: 'cubemap-face', text: '+z' }),
            5: new Button({ id: 'cubemap-face-nz', class: 'cubemap-face', text: '-z' })
        };

        Object.keys(faceButtons).forEach((face) => {
            faceButtonsContainer.append(faceButtons[face]);
        });

        this.append(faceButtonsContainer);

        // mipmap select
        const mipmapSelect = new SelectInput({
            value: '0',
            options: [],
            flexGrow: '1'
        });

        // texture type
        const textureTypeSelect = new SelectInput({
            value: 'gamma',
            options: [
                { v: 'gamma', t: 'gamma' },
                { v: 'linear', t: 'linear' },
                { v: 'rgbm', t: 'rgbm' },
                { v: 'rgbe', t: 'rgbe' },
                { v: 'rgbp', t: 'rgbp' },
                { v: 'a', t: 'a' }
            ],
            flexGrow: '1'
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
            flexGrow: '1'
        });

        // label groups
        this.append(new LabelGroup({ text: 'mipmap', field: mipmapSelect }));
        this.append(new LabelGroup({ text: 'type', field: textureTypeSelect }));
        this.append(new LabelGroup({ text: 'alpha', field: alphaToggle }));
        this.append(new LabelGroup({ text: 'filter', field: filterToggle }));
        this.append(new LabelGroup({ text: 'exposure', field: exposureSlider }));

        const getTextureType = (texture: TextureDoc): string => {
            const encoding = (texture?.asset?.resource as any)?.encoding || 'gamma';
            return encoding === 'srgb' ? 'gamma' : encoding;
        };

        textureManager.on('textureDocAdded', (doc: TextureDoc) => {
            doc.settings.patch({
                view: {
                    filter: false,
                    face: '0',
                    mipmap: '0',
                    type: getTextureType(doc),
                    alpha: false,
                    exposure: '0',
                    offsetX: 0,
                    offsetY: 0,
                    scale: 0
                }
            });
        });

        const events: EventHandleLike[] = [];
        textureManager.on('textureDocSelected', (texture: TextureDoc) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            // register change events
            events.push(texture.settings.on('view.face:set', (value: string) => {
                Object.keys(faceButtons).forEach((face) => {
                    if (face === value) {
                        faceButtons[face].dom.classList.add('depressed');
                    } else {
                        faceButtons[face].dom.classList.remove('depressed');
                    }
                });
            }));
            events.push(texture.settings.on('view.mipmap:set', (value: string) => {
                mipmapSelect.value = value;
            }));
            events.push(texture.settings.on('view.type:set', (value: string) => {
                textureTypeSelect.value = value;
            }));
            events.push(texture.settings.on('view.alpha:set', (value: boolean) => {
                alphaToggle.value = !!value;
            }));
            events.push(texture.settings.on('view.filter:set', (value: boolean) => {
                filterToggle.value = !!value;
            }));
            events.push(texture.settings.on('view.exposure:set', (value: number) => {
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
            const mips: { v: string; t: string }[] = [];
            for (let i = 0; i < numMipmaps; ++i) {
                mips.push({ v: `${i}`, t: `${i}` });
            }
            mipmapSelect.options = mips;

            // face select
            faceButtonsContainer.enabled = !!texture.cubemap;

            this.enabled = !!texture.resource;
        });

        this.enabled = false;
    }
}

export {
    ShowPanel
};
