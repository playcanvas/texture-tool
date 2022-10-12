import { Container, Label } from 'pcui';

class FileTabs extends Container {
    constructor(textureManager, args = {}) {
        Object.assign(args, {
            id: 'file-tabs-container',
            flex: true,
            flexDirection: 'row'
        });
        super(args);

        this.textureManager = textureManager;
        this.buttons = new Map();

        textureManager.on('textureDocAdded', texture => this.onTextureDocAdded(texture));
        textureManager.on('textureDocRemoved', texture => this.onTextureDocRemoved(texture));
        textureManager.on('textureDocSelected', texture => this.onTextureDocSelected(texture));
    }

    onTextureDocAdded(texture) {
        const tab = new Container({
            class: 'file-tab',
            flex: true,
            flexDirection: 'row'
        });

        const label = new Label({
            class: 'file-tab-label',
            text: texture.filename
        });

        const button = new Label({
            class: 'file-tab-close',
            text: '×'
        });

        tab.dom.addEventListener('mousedown', () => {
            this.textureManager.selectTextureDoc(texture);
        });

        button.dom.addEventListener('click', () => {
            this.textureManager.removeTextureDoc(texture);
        });

        tab.append(label);
        tab.append(button);
        this.append(tab);
        this.buttons.set(texture, tab);

        button.dom.scrollIntoView();
    }

    onTextureDocRemoved(texture) {
        this.remove(this.buttons.get(texture));
        this.buttons.delete(texture);
    }

    onTextureDocSelected(texture) {
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
