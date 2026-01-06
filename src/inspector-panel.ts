import { Container } from '@playcanvas/pcui';

import { TextureExportPanel } from './export-panel';
import { FeedbackPanel } from './feedback-panel';
import { ReprojectPanel } from './reproject-panel';
import { ShowPanel } from './show-panel';
import type { TextureManager } from './texture-manager';

class InspectorPanel extends Container {
    constructor(textureManager: TextureManager, args: Record<string, any> = {}) {
        Object.assign(args, {
            class: 'inspector-panel-container',
            resizable: 'left',
            resizeMin: 100,
            resizeMax: 1000,
            flex: true,
            flexDirection: 'column',
            flexGrow: '1'
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
