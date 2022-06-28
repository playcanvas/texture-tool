class PngExport {
    constructor() {
        this.module = null;
        this.memory = null;

        WebAssembly.instantiateStreaming(
            fetch('lib/lodepngjs.wasm'),
            { }
        ).then(m => {
            this.module = m;
            this.memory = new Uint8Array(this.module.instance.exports.memory.buffer);
        });
    }

    compress(bytes, width, height) {
        const exports = this.module.instance.exports;

        const resultDataPtrPtr = exports.malloc(4);
        const resultSizePtr = exports.malloc(4);
        const imageData = exports.malloc(width * height * 4);

        // copy memory data
        for (let i = 0; i < width * height * 4; ++i) {
            this.memory[imageData + i] = bytes[i];
        }

        // invoke compress
        exports.lodepng_encode32(resultDataPtrPtr, resultSizePtr, imageData, width, height);

        // read results
        const u32 = new Uint32Array(this.memory.buffer);
        const result = this.memory.slice(u32[resultDataPtrPtr / 4], u32[resultDataPtrPtr / 4] + u32[resultSizePtr / 4]);

        exports.free(resultDataPtrPtr);
        exports.free(resultSizePtr);
        exports.free(imageData);

        return result;
    }
}

export {
    PngExport
}
