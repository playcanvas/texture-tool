import { Container, Label } from '@playcanvas/pcui';

class FileTabs extends Container {
    constructor(textureManager, args = {}) {
        Object.assign(args, {
            id: 'fileTabsContainer',
            flex: true,
            flexDirection: 'row'
        });
        super(args);

        this.textureManager = textureManager;
        this.buttons = new Map();

        textureManager.on('textureAdded', texture => this.onTextureAdded(texture));
        textureManager.on('textureRemoved', texture => this.onTextureRemoved(texture));
        textureManager.on('textureSelected', texture => this.onTextureSelected(texture));
    }

    onTextureAdded(texture) {
        const tab = new Container({
            class: 'fileTab',
            flex: true,
            flexDirection: 'row'
        });

        const label = new Label({
            class: 'fileTabLabel',
            text: texture.filename
        });

        const button = new Label({
            class: 'fileTabClose',
            text: '×'
        });

        tab.dom.addEventListener('mousedown', () => {
            this.textureManager.selectTexture(texture);
        });

        button.dom.addEventListener('click', () => {
            this.textureManager.removeTexture(texture);
        });

        tab.append(label);
        tab.append(button);
        this.append(tab);
        this.buttons.set(texture, tab);

        button.dom.scrollIntoView();
    }

    onTextureRemoved(texture) {
        this.remove(this.buttons.get(texture));
        this.buttons.delete(texture);
    }

    onTextureSelected(texture) {
        this.buttons.forEach((b, t) => {
            if (t === texture) {
                b.dom.classList.add('selected');
            } else {
                b.dom.classList.remove('selected');
            }
        });
    }
}

export {
    FileTabs
};
