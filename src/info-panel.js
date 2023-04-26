import { Panel, Label } from 'pcui';
import { PixelFormatTable, TextureTypeTable } from './const.js';

class InfoPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            headerText: '-',
            flexGrow: 0,
            flexShrink: 0
        });
        super(args);

        // footer
        this.textureStructure = new Label({
            width: 80,
            class: 'center-align'
        });

        this.textureDims = new Label({
            width: 80,
            class: 'center-align'
        });

        this.texturePixelFormat = new Label({
            width: 80,
            class: 'center-align'
        });

        this.textureType = new Label({
            width: 80,
            class: 'center-align'
        });

        this.cursorTexel = new Label({
            width: 80,
            class: 'center-align'
        });

        this.header.append(this.textureStructure);
        this.header.append(this.textureDims);
        this.header.append(this.texturePixelFormat);
        this.header.append(this.textureType);
        this.header.append(this.cursorTexel);

        textureManager.on('textureDocSelected', (texture) => {
            this.setTexture(texture);
        });
    }

    setTexture(texture) {
        // filename
        this.headerText = texture.url.startsWith('blob:') ? texture.filename : texture.url;

        // texture structure
        this.textureStructure.text = texture.cubemap ? ' cubemap' : '2d';

        // texture dims
        this.textureDims.text = `${texture.width}x${texture.height}`;

        // pixel format
        this.texturePixelFormat.text = `${PixelFormatTable[texture.format] || '???'}`;

        // texture type
        this.textureType.text = `${TextureTypeTable[texture.type] || '???'}`;
    }
}

export {
    InfoPanel
};
