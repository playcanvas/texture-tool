import { Container } from 'pcui';
import { path } from 'playcanvas';

import { DropHandler } from './drop-handler.js';
import { FileTabs } from './file-tabs.js';
import { FilesBrowserPanel } from './files-browser-panel.js';
import { InspectorPanel } from './inspector-panel.js';
import { Renderer } from './renderer.js';
import { TextureManager } from './texture-manager.js';
import { ViewportPanel } from './viewport-panel.js';

// globals
const renderer = new Renderer();
const textureManager = new TextureManager(renderer.app.assets);

// disable global drag/drop
window.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'none';
}, false);

window.addEventListener('drop', (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'none';
}, false);

// construct application containers
const root = new Container({
    dom: document.getElementById('root')
});

const leftContainer = new Container({
    id: 'left-container',
    resizable: 'right',
    resizeMin: 100,
    resizeMax: 1000,
    width: 220,
    flex: true,
    flexDirection: 'column'
});

const centerContainer = new Container({
    id: 'center-container'
});

const rightContainer = new Container({
    id: 'right-container',
    width: 320,
    flex: true
});

root.append(leftContainer);
root.append(rightContainer);

// construct renderer instance
leftContainer.append(new FilesBrowserPanel(textureManager, new DropHandler(root.dom, textureManager)));
centerContainer.append(new ViewportPanel(renderer, textureManager));
centerContainer.append(new InspectorPanel(textureManager));
rightContainer.append(new FileTabs(textureManager));
rightContainer.append(centerContainer);

// handle search params
setTimeout(() => {
    // handle load param and ready promise for visual testing harness
    const url = new URL(window.location.href);

    const keys = Array.from(url.searchParams.keys());
    const values = Array.from(url.searchParams.values());
    let i = 0;
    let activeTexture = null;

    const handleNextParam = () => {
        if (i === keys.length) {
            return;
        }

        const param = keys[i];
        const value = values[i++];
        if (param === 'load') {
            textureManager.addTextureDocByUrl(value, path.getBasename(value).split('?')[0], (err, texture) => {
                if (!err && texture) {
                    textureManager.selectTextureDoc(texture);
                }
                activeTexture = texture;
                handleNextParam();
            });
        } else if (param === 'type') {
            if (activeTexture?.resource) {
                if (['srgb', 'gamma', 'linear', 'rgbm', 'rgbe', 'rgbp', 'a'].includes(value)) {
                    activeTexture.settings.set('view.type', value === 'srgb' ? 'gamma' : value);
                }
            }
            handleNextParam();
        } else {
            console.warn(`skipping unknown param: ${param}`);
            handleNextParam();
        }
    };

    handleNextParam();
});
