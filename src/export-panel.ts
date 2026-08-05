import type { EventHandle } from '@playcanvas/observer';
import { Button, Panel, Container } from '@playcanvas/pcui';
import type { PanelArgs } from '@playcanvas/pcui';
import type { Texture, WebglGraphicsDevice } from 'playcanvas';
import { RenderTarget } from 'playcanvas';

import { HdrExporter } from './hdr-exporter';
import { removeExtension } from './helpers';
import { PngExporter } from './png-exporter';
import type { TextureDoc } from './texture-doc';
import type { TextureManager } from './texture-manager';
import { WebpExporter } from './webp-exporter';

type Exporter = {
    run(words: Uint32Array, width: number, height: number): Promise<Uint8Array> | Uint8Array;
    extension: string;
};

const readPixels = (texture: Texture, face: number | null): Uint32Array => {
    const rt = new RenderTarget({ colorBuffer: texture, depth: false, face: face ?? undefined });
    const data = new Uint8ClampedArray(texture.width * texture.height * 4);
    const device = texture.device as WebglGraphicsDevice;
    const gl = device.gl;

    device.setFramebuffer(rt.impl._glFrameBuffer);
    device.initRenderTarget(rt);
    gl.readPixels(0, 0, texture.width, texture.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    rt.destroy();

    return new Uint32Array(data.buffer);
};

// download the data uri
const download = (filename: string, data: Uint8Array): void => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'octet/stream' });
    const url = window.URL.createObjectURL(blob);

    const lnk = document.createElement('a');
    lnk.download = filename;
    lnk.href = url;

    lnk.click();

    window.URL.revokeObjectURL(url);
};

class TextureExportPanel extends Panel {
    constructor(textureManager: TextureManager, args: PanelArgs = {}) {
        Object.assign(args, {
            id: 'texture-export-pane',
            headerText: 'Export',
            collapsible: true,
            flexGrow: '1'
        });

        super(args);

        const pngExporter = new PngExporter();
        const webpExporter = new WebpExporter();
        const hdrExporter = new HdrExporter();

        // png export
        const exportToPng = new Button({
            class: 'inspector-button',
            text: 'EXPORT TO PNG',
            icon: 'E228',
            enabled: false
        });

        const exportToPngContainer = new Container({
            class: 'inspector-button-container'
        });
        exportToPngContainer.append(exportToPng);

        // webp export
        const exportToWebp = new Button({
            class: 'inspector-button',
            text: 'EXPORT TO WEBP',
            icon: 'E228',
            enabled: false
        });

        const exportToWebpContainer = new Container({
            class: 'inspector-button-container'
        });
        exportToWebpContainer.append(exportToWebp);

        // hdr export
        const exportToHdr = new Button({
            class: 'inspector-button',
            text: 'EXPORT TO HDR',
            icon: 'E228',
            enabled: false
        });

        const exportToHdrContainer = new Container({
            class: 'inspector-button-container'
        });
        exportToHdrContainer.append(exportToHdr);

        this.append(exportToPngContainer);
        this.append(exportToWebpContainer);
        this.append(exportToHdrContainer);

        const doExport = async (exporter: Exporter, texture: TextureDoc): Promise<void> => {
            const t = texture.resource!;

            this.enabled = false;

            try {
                if (t.cubemap) {
                    const faceNames = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
                    for (let face = 0; face < 6; ++face) {
                        download(
                            `${removeExtension(texture.filename)}_${faceNames[face]}.${exporter.extension}`,
                            await exporter.run(readPixels(t, face), t.width, t.height)
                        );
                    }
                } else {
                    download(
                        `${removeExtension(texture.filename)}.${exporter.extension}`,
                        await exporter.run(readPixels(t, null), t.width, t.height)
                    );
                }
            } finally {
                this.enabled = true;
            }
        };

        const events: EventHandle[] = [];
        textureManager.on('textureDocSelected', (texture: TextureDoc) => {
            // unregister preview events
            events.forEach((ev) => ev.unbind());
            events.length = 0;

            // register new events
            events.push(
                exportToPng.on('click', async () => {
                    exportToPng.dom.classList.add('busy-anim');
                    exportToPng.text = 'BUSY...';
                    try {
                        await doExport(pngExporter, texture);
                    } catch (err) {
                        console.error(err);
                    } finally {
                        exportToPng.dom.classList.remove('busy-anim');
                        exportToPng.text = 'EXPORT TO PNG';
                    }
                })
            );

            events.push(
                exportToWebp.on('click', async () => {
                    exportToWebp.dom.classList.add('busy-anim');
                    exportToWebp.text = 'BUSY...';
                    try {
                        await doExport(webpExporter, texture);
                    } catch (err) {
                        console.error(err);
                    } finally {
                        exportToWebp.dom.classList.remove('busy-anim');
                        exportToWebp.text = 'EXPORT TO WEBP';
                    }
                })
            );

            events.push(
                exportToHdr.on('click', async () => {
                    exportToHdr.dom.classList.add('busy-anim');
                    exportToHdr.text = 'BUSY...';
                    try {
                        await doExport(hdrExporter, texture);
                    } catch (err) {
                        console.error(err);
                    } finally {
                        exportToHdr.dom.classList.remove('busy-anim');
                        exportToHdr.text = 'EXPORT TO HDR';
                    }
                })
            );

            exportToPng.enabled = !!texture.resource;
            exportToWebp.enabled = !!texture.resource;
            exportToHdr.enabled = texture.resource?.encoding === 'rgbe';

            this.enabled = !!texture.resource;
        });

        this.enabled = false;
    }
}

export { TextureExportPanel };
