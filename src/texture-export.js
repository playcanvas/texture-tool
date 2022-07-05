import { RenderTarget } from 'playcanvas';
import { Button, Panel, Container } from '@playcanvas/pcui';
import { PngExport } from './png-export.js';
import { Helpers } from './helpers.js';

const readPixels = (texture, face) => {
    const rt = new RenderTarget({ colorBuffer: texture, depth: false, face: face });
    const data = new Uint8ClampedArray(texture.width * texture.height * 4);
    const device = texture.device;

    device.setFramebuffer(rt._glFrameBuffer);
    device.initRenderTarget(rt);
    device.gl.readPixels(0, 0, texture.width, texture.height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, data);

    rt.destroy();

    return data;
};

// download the data uri
const download = (filename, data) => {
    const blob = new Blob([data.buffer], { type: "octet/stream" });
    const url = window.URL.createObjectURL(blob);

    const lnk = document.createElement('a');
    lnk.download = filename;
    lnk.href = url;

    // create a "fake" click-event to trigger the download
    if (document.createEvent) {
        const e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, true, window,
                         0, 0, 0, 0, 0, false, false, false,
                         false, 0, null);
        lnk.dispatchEvent(e);
    } else if (lnk.fireEvent) {
        lnk.fireEvent("onclick");
    }

    window.URL.revokeObjectURL(url);
};

class TextureExportPanel extends Panel {
    constructor(textureManager, args = { }) {
        Object.assign(args, {
            id: 'textureExportPane',
            headerText: 'Export',
            collapsible: true,
            flexGrow: 0
        });

        super(args);

        const pngExport = new PngExport();

        const exportToPng = new Button({
            class: 'inspectorButton',
            text: 'EXPORT TO PNG',
            icon: '\E228'
        });

        const exportToPngContainer = new Container({
            class: 'inspectorButtonContainer'
        });
        exportToPngContainer.append(exportToPng);

        this.append(exportToPngContainer);

        exportToPng.enabled = false;

        const events = [];
        textureManager.on('textureSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            // register new events
            events.push(exportToPng.on('click', () => {
                const t = texture.resource;

                if (t.cubemap) {
                    const faceNames = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
                    for (let face = 0; face < 6; ++face) {
                        download(`${Helpers.removeExtension(texture.filename)}_${faceNames[face]}.png`, pngExport.compress(readPixels(t, face), t.width, t.height));
                    }
                } else {
                    download(`${Helpers.removeExtension(texture.filename)}.png`, pngExport.compress(readPixels(t, null), t.width, t.height));
                }
            }));

            exportToPng.enabled = !!texture.resource;
        });
    }
}

export {
    TextureExportPanel
};
