// WebP lossless encoder backed by libwebp compiled to WebAssembly. The
// webp.mjs / webp.wasm assets in static/lib/webp are shared with
// @playcanvas/splat-transform (built from Google's libwebp).

type WebpModule = {
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    _free(ptr: number): void;
    _malloc(size: number): number;
    _webp_encode_lossless_rgba(
        data: number,
        width: number,
        height: number,
        stride: number,
        output: number,
        size: number
    ): number;
    _webp_free(ptr: number): void;
};

// lazily-instantiated libwebp module, shared across exports
let modulePromise: Promise<WebpModule> | null = null;

const loadModule = (): Promise<WebpModule> => {
    if (!modulePromise) {
        const dir = `${window.location.href.split('?')[0]}lib/webp/`;
        const promise = import(`${dir}webp.mjs`).then((mod) =>
            mod.default({ locateFile: (path: string) => `${dir}${path}` })
        ) as Promise<WebpModule>;
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
        const module = await loadModule();
        const rgba = new Uint8Array(words.buffer);

        const inPtr = module._malloc(rgba.length);
        const outPtrPtr = module._malloc(4);
        const outSizePtr = module._malloc(4);

        module.HEAPU8.set(rgba, inPtr);

        const ok = module._webp_encode_lossless_rgba(inPtr, width, height, width * 4, outPtrPtr, outSizePtr);
        if (!ok) {
            module._free(inPtr);
            module._free(outPtrPtr);
            module._free(outSizePtr);
            throw new Error('WebP lossless encode failed');
        }

        const outPtr = module.HEAPU32[outPtrPtr >> 2];
        const outSize = module.HEAPU32[outSizePtr >> 2];
        const bytes = module.HEAPU8.slice(outPtr, outPtr + outSize);

        module._webp_free(outPtr);
        module._free(inPtr);
        module._free(outPtrPtr);
        module._free(outSizePtr);

        return bytes;
    }

    readonly extension = 'webp';
}

export { WebpExporter };
