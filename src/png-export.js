function PngExportWorker(href) {
    const initLodepng = () => {
        return new Promise((resolve, reject) => {
            self.importScripts(`${href}lib/lodepng/lodepng.js`);
            resolve(self.lodepng({
                locateFile: () => `${href}lib/lodepng/lodepng.wasm`
            }));
        });
    };

    const compress = (lodepng, words, width, height) => {
        const resultDataPtrPtr = lodepng._malloc(4);
        const resultSizePtr = lodepng._malloc(4);
        const imageData = lodepng._malloc(width * height * 4);

        // copy pixels into wasm memory
        for (let i = 0; i < width * height; ++i) {
            lodepng.HEAPU32[imageData / 4 + i] = words[i];
        }

        // invoke compress
        lodepng._lodepng_encode32(resultDataPtrPtr, resultSizePtr, imageData, width, height);

        // read results
        const u32 = lodepng.HEAPU32;
        const result = lodepng.HEAPU8.slice(u32[resultDataPtrPtr / 4], u32[resultDataPtrPtr / 4] + u32[resultSizePtr / 4]);

        lodepng._free(resultDataPtrPtr);
        lodepng._free(resultSizePtr);
        lodepng._free(imageData);

        return result;
    };

    const main = async () => {
        const lodepng = await initLodepng();

        self.onmessage = (message) => {
            const data = message.data;

            // compress
            const result = compress(lodepng, data.words, data.width, data.height);

            // return
            self.postMessage({ result: result }, [ result.buffer ]);
        };
    }

    main();
}

class PngExport {
    constructor() {
        this.worker = PngExport.createWorker();

        let receiver;

        this.worker.addEventListener('message', (message) => {
            receiver(message);
        });

        this.promiseFunc = (resolve, reject) => {
            receiver = (message) => {
                resolve(message.data.result);
                receiver = null;
            };
        };
    }

    static createWorker() {
        const workerBlob = new Blob([`(${PngExportWorker.toString()})('${window.location.href}')\n\n`], {
            type: 'application/javascript'
        });
        return new Worker(URL.createObjectURL(workerBlob));
    }

    async compress(words, width, height) {
        this.worker.postMessage({
            words: words,
            width: width,
            height: height
        }, [words.buffer]);

        return new Promise(this.promiseFunc);
    }
}

export {
    PngExport
};
