import { Helpers } from './helpers.js';
import { RenderTarget } from 'playcanvas';
import { Button, Panel, Container } from '@playcanvas/pcui';
import { PngExporter } from './png-exporter.js';
import { HdrExporter } from './hdr-exporter.js';

const readPixels = (texture, face) => {
    const rt = new RenderTarget({ colorBuffer: texture, depth: false, face: face });
    const data = new Uint8ClampedArray(texture.width * texture.height * 4);
    const device = texture.device;

    device.setFramebuffer(rt._glFrameBuffer);
    device.initRenderTarget(rt);
    device.gl.readPixels(0, 0, texture.width, texture.height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, data);

    rt.destroy();

    return new Uint32Array(data.buffer);
};

// download the data uri
const download = (filename, data) => {
    const blob = new Blob([data], { type: "octet/stream" });
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
            flexGrow: 1
        });

        super(args);

        const pngExporter = new PngExporter();
        const hdrExporter = new HdrExporter();

        // png export
        const exportToPng = new Button({
            class: 'inspectorButton',
            text: 'EXPORT TO PNG',
            icon: '\E228',
            enabled: false
        });

        const exportToPngContainer = new Container({
            class: 'inspectorButtonContainer'
        });
        exportToPngContainer.append(exportToPng);

        // hdr export
        const exportToHdr = new Button({
            class: 'inspectorButton',
            text: 'EXPORT TO HDR',
            icon: '\E228',
            enabled: false
        });

        const exportToHdrContainer = new Container({
            class: 'inspectorButtonContainer'
        });
        exportToHdrContainer.append(exportToHdr);

        this.append(exportToPngContainer);
        this.append(exportToHdrContainer);

        const doExport = async (exporter, texture) => {
            const t = texture.resource;

            this.enabled = false;

            if (t.cubemap) {
                const faceNames = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
                for (let face = 0; face < 6; ++face) {
                    // eslint-disable-next-line
                    download(`${Helpers.removeExtension(texture.filename)}_${faceNames[face]}.${exporter.extension}`, await exporter.run(readPixels(t, face), t.width, t.height));
                }
            } else {
                download(`${Helpers.removeExtension(texture.filename)}.${exporter.extension}`, await exporter.run(readPixels(t, null), t.width, t.height));
            }

            this.enabled = true;
        };

        const events = [];
        textureManager.on('textureSelected', (texture) => {
            // unregister preview events
            events.forEach(ev => ev.unbind());
            events.length = 0;

            // register new events
            events.push(exportToPng.on('click', async () => {
                exportToPng.dom.classList.add('busy-anim');
                exportToPng.text = 'BUSY...';
                await doExport(pngExporter, texture);
                exportToPng.dom.classList.remove('busy-anim');
                exportToPng.text = 'EXPORT TO PNG';
            }));

            events.push(exportToHdr.on('click', async () => {
                exportToHdr.dom.classList.add('busy-anim');
                exportToHdr.text = 'BUSY...';
                await doExport(hdrExporter, texture);
                exportToHdr.dom.classList.remove('busy-anim');
                exportToHdr.text = 'EXPORT TO HDR';
            }));

            exportToPng.enabled = !!texture.resource;
            exportToHdr.enabled = texture.resource && texture.resource.encoding === 'rgbe';
        });
    }
}

export {
    TextureExportPanel
};
