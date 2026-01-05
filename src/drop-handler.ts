import { Events } from '@playcanvas/observer';
import type { TextureManager } from './texture-manager';

// handle file drag/drop
// fires 'load' event
class DropHandler extends Events {
    textureManager: TextureManager;

    constructor(dom: HTMLElement, textureManager: TextureManager) {
        super();

        this.textureManager = textureManager;

        // handle drop target for env maps and models
        const transferType = 'Files';

        dom.addEventListener('dragover', (ev: DragEvent) => {
            if (ev.dataTransfer && ev.dataTransfer.types.includes(transferType)) {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
            }
        });

        dom.addEventListener('drop', (ev: DragEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.dataTransfer) {
                this.emit('filesDropped', ev.dataTransfer.items);
            }
        }, false);
    }
}

export {
    DropHandler
};
