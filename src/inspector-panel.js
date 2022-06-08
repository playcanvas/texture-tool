import { Panel } from '@playcanvas/pcui';
import { TextureViewSettingsPanel } from './texture-view-settings.js';

class InspectorPanel extends Panel {
    constructor(textureManager, args = {}) {
        Object.assign(args, {
            class: 'inspector-panel-container',
            headerText: 'View',
            flex: true,
            flexDirection: 'column'
        });
        super(args);

        // this.content.append(new TextureDetails(textureManager));
        this.content.append(new TextureViewSettingsPanel(textureManager));
    }
}

export {
    InspectorPanel
};
