import { Label, LabelGroup, Container } from '@playcanvas/pcui';
import { PixelFormatTable, TextureTypeTable } from './const';

const attributes = [{
    label: 'Filename',
    value: t => t.filename
}, {
    label: 'Type',
    value: t => (t.cubemap ? 'Cubemap' : '2d')
}, {
    label: 'Dimensions',
    value: t => `${t.width}x${t.height}`
}, {
    label: 'Format',
    value: t => PixelFormatTable[t.format]
}, {
    label: 'Type',
    value: t => TextureTypeTable[t.type]
}, {
    label: 'URL',
    value: t => t.url
}];

class TextureDetails extends Container {
    constructor(textureManager, args = {}) {
        Object.assign(args, {
            class: 'texture-details-container',
            headerText: 'Textures',
            flex: true,
            flexDirection: 'column'
        });
        super(args);

        this.fields = attributes.map((attribute) => {
            const label = new Label({
                class: 'texture-details-value',
                text: '-'
            });

            this.append(new LabelGroup({
                class: 'texture-details-item-group',
                text: attribute.label,
                field: label
            }));

            return label;
        });

        textureManager.on('textureDocSelected', t => this.textureSelected(t));
    }

    textureSelected(texture) {
        attributes.forEach((attribute, index) => {
            this.fields[index].text = texture ? `${attribute.value(texture)}` : '';
        });
    }
}

export {
    TextureDetails
};
