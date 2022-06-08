import { Events } from '@playcanvas/observer';

// handle file drag/drop
// fires 'load' event
class DropHandler extends Events {
    constructor(dom, textureManager) {
        super();

        this.textureManager = textureManager;

        // handle drop target for env maps and models
        const transferType = 'Files';

        dom.addEventListener('dragover', (ev) => {
            if (ev.dataTransfer.types.includes(transferType)) {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = "copy";
            }
        });

        dom.addEventListener('drop', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.emit('filesDropped', ev.dataTransfer.items);
        }, false);
    }

    // handle drop events
    onFilesDropped(files) {
        files.forEach((file, index) => {
            this.textureManager.addTexture(file.url, file.filename, (err, texture) => {
                if (!err && index === files.length - 1) {
                    this.textureManager.selectTexture(texture);
                }
            });
        });
    }
}

export {
    DropHandler
};
