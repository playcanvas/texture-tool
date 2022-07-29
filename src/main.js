import { path } from 'playcanvas';

// pcui
import { Container } from '@playcanvas/pcui';

// rendering
import { Renderer } from './renderer.js';
import { TextureManager } from './texture-manager.js';

// ui
import { FileTabs } from './file-tabs.js';
import { Texture2dPanel } from './texture-2d-panel.js';
import { DropHandler } from './drop-handler.js';
import { FilesBrowserPanel } from './files-browser-panel.js';
import { InspectorPanel } from './inspector-panel.js';

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
    id: 'leftContainer',
    resizable: 'right',
    resizeMin: 100,
    resizeMax: 1000,
    width: 220,
    flex: true,
    flexDirection: 'column'
});

const centerContainer = new Container({
    id: 'centerContainer'
});

const rightContainer = new Container({
    id: 'rightContainer',
    resizable: 'left',
    resizeMin: 100,
    resizeMax: 1000,
    width: 320,
    flex: true
});

root.append(leftContainer);
root.append(centerContainer);
root.append(rightContainer);

// construct renderer instance
const dropHandler = new DropHandler(root.dom, textureManager);

const browserPanel = new FilesBrowserPanel(textureManager, dropHandler);
leftContainer.append(browserPanel);

const fileTabs = new FileTabs(textureManager);
const texture2dPanel = new Texture2dPanel(renderer, textureManager);
centerContainer.append(fileTabs);
centerContainer.append(texture2dPanel);

const inspectorPanel = new InspectorPanel(textureManager);
rightContainer.append(inspectorPanel);

// handle invocation args
(() => {
    // extract query params. taken from https://stackoverflow.com/a/21152762
    const urlParams = {};
    if (location.search) {
        location.search.substr(1).split("&").forEach((item) => {
            const s = item.split("="),
                k = s[0],
                v = s[1] && decodeURIComponent(s[1]);
            (urlParams[k] = urlParams[k] || []).push(v);
        });
    }

    // handle load url param
    const loadUrls = (urlParams.load || []).concat(urlParams.assetUrl || []);
    if (loadUrls.length > 0) {
        loadUrls.forEach((url, index) => {
            textureManager.addTextureDocByUrl(url, path.getBasename(url).split('?')[0], (err, texture) => {
                if (!err && texture) {
                    textureManager.selectTextureDoc(texture);
                }
            });
        });
    }
})();
