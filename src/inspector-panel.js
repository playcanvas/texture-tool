import { Container } from 'pcui';

import { TextureExportPanel } from './export-panel.js';
import { FeedbackPanel } from './feedback-panel.js';
import { ReprojectPanel } from './reproject-panel.js';
import { ShowPanel } from './show-panel.js';

class InspectorPanel extends Container {
    constructor(textureManager, args = {}) {
        Object.assign(args, {
            class: 'inspector-panel-container',
            resizable: 'left',
            resizeMin: 100,
            resizeMax: 1000,
            flex: true,
            flexDirection: 'column',
            flexGrow: 1
        });
        super(args);

        this.append(new ShowPanel(textureManager));
        this.append(new ReprojectPanel(textureManager));
        this.append(new TextureExportPanel(textureManager));
        this.append(new FeedbackPanel());
    }
}

export {
    InspectorPanel
};
