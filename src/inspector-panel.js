import { Container } from '@playcanvas/pcui';
import { TextureViewSettingsPanel } from './texture-view-settings.js';
import { TextureProcessPanel } from './texture-process.js';
import { TextureExportPanel } from './texture-export.js';

class InspectorPanel extends Container {
    constructor(textureManager, args = {}) {
        Object.assign(args, {
            class: 'inspector-panel-container',
            flex: true,
            flexDirection: 'column',
            flexGrow: 1
        });
        super(args);

        // this.content.append(new TextureDetails(textureManager));
        this.append(new TextureViewSettingsPanel(textureManager));
        this.append(new TextureProcessPanel(textureManager));
        this.append(new TextureExportPanel(textureManager));
    }
}

export {
    InspectorPanel
};
