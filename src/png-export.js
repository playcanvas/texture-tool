import { RenderTarget } from 'playcanvas';

class PngExporter {

    static readPixels(texture, face) {
        const rt = new RenderTarget({ colorBuffer: texture, depth: false, face: face });
        const data = new Uint8ClampedArray(texture.width * texture.height * 4);
        const device = texture.device;

        device.setFramebuffer(rt._glFrameBuffer);
        device.initRenderTarget(rt);
        device.gl.readPixels(0, 0, texture.width, texture.height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, data);

        rt.destroy();

        return data;
    }

    // download the data uri
    static download(url, filename) {
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
    }

    static exportToPng(texture, face) {
        // read texture data from GPU
        const data = PngExporter.readPixels(texture, face);

        // create image bitmap
        createImageBitmap(new ImageData(data, texture.width, texture.height), {
            premultiplyAlpha: 'none'
        }).then((imageBitmap) => {
            const canvas = document.createElement('canvas');
            canvas.width = texture.width;
            canvas.height = texture.height;
    
            const context = canvas.getContext('bitmaprenderer');
            context.transferFromImageBitmap(imageBitmap);
    
            PngExporter.download(canvas.toDataURL("image/png"));
        }, (reject) => {
            console.error(reject);
        });
    }
}

export {
    PngExporter
}
