import { Container, Label } from '@playcanvas/pcui';
import type { TextureManager } from './texture-manager';
import type { TextureDoc } from './texture-doc';

class FileTabs extends Container {
    textureManager: TextureManager;
    buttons: Map<TextureDoc, Container>;

    constructor(textureManager: TextureManager, args: Record<string, any> = {}) {
        Object.assign(args, {
            id: 'file-tabs-container',
            flex: true,
            flexDirection: 'row'
        });
        super(args);

        this.textureManager = textureManager;
        this.buttons = new Map();

        textureManager.on('textureDocAdded', (texture: TextureDoc) => this.onTextureDocAdded(texture));
        textureManager.on('textureDocRemoved', (texture: TextureDoc) => this.onTextureDocRemoved(texture));
        textureManager.on('textureDocSelected', (texture: TextureDoc) => this.onTextureDocSelected(texture));
    }

    onTextureDocAdded(texture: TextureDoc): void {
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

    onTextureDocRemoved(texture: TextureDoc): void {
        const tab = this.buttons.get(texture);
        if (tab) {
            this.remove(tab);
        }
        this.buttons.delete(texture);
    }

    onTextureDocSelected(texture: TextureDoc): void {
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
