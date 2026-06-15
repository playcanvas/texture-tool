// WebP lossless encoder backed by libwebp compiled to WebAssembly. The
// webp.mjs / webp.wasm assets in static/lib/webp are shared with
// @playcanvas/splat-transform (built from Google's libwebp).

// lazily-instantiated libwebp module, shared across exports
let modulePromise: Promise<any> | null = null;

const loadModule = (): Promise<any> => {
    if (!modulePromise) {
        const dir = `${window.location.href.split('?')[0]}lib/webp/`;
        const promise = import(`${dir}webp.mjs`).then(mod => mod.default({
            locateFile: (path: string) => `${dir}${path}`
        }));
        // reset on failure so a later attempt can retry the load
        promise.catch(() => {
            if (modulePromise === promise) {
                modulePromise = null;
            }
        });
        modulePromise = promise;
    }
    return modulePromise;
};

class WebpExporter {
    async run(words: Uint32Array, width: number, height: number): Promise<Uint8Array> {
        const Module = await loadModule();
        const rgba = new Uint8Array(words.buffer);

        const inPtr = Module._malloc(rgba.length);
        const outPtrPtr = Module._malloc(4);
        const outSizePtr = Module._malloc(4);

        Module.HEAPU8.set(rgba, inPtr);

        const ok = Module._webp_encode_lossless_rgba(inPtr, width, height, width * 4, outPtrPtr, outSizePtr);
        if (!ok) {
            Module._free(inPtr);
            Module._free(outPtrPtr);
            Module._free(outSizePtr);
            throw new Error('WebP lossless encode failed');
        }

        const outPtr = Module.HEAPU32[outPtrPtr >> 2];
        const outSize = Module.HEAPU32[outSizePtr >> 2];
        const bytes = Module.HEAPU8.slice(outPtr, outPtr + outSize);

        Module._webp_free(outPtr);
        Module._free(inPtr);
        Module._free(outPtrPtr);
        Module._free(outSizePtr);

        return bytes;
    }

    get extension(): string {
        return 'webp';
    }
}

export {
    WebpExporter
};
