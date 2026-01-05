// Worker function - kept as a string template for blob creation
function PngExportWorker(href: string): void {
    const initLodepng = (): Promise<any> => {
        return new Promise((resolve) => {
            (self as any).importScripts(`${href}lib/lodepng/lodepng.js`);
            resolve((self as any).lodepng({
                locateFile: () => `${href}lib/lodepng/lodepng.wasm`
            }));
        });
    };

    const compress = (lodepng: any, words: Uint32Array, width: number, height: number): Uint8Array => {
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

    const main = async (): Promise<void> => {
        const lodepng = await initLodepng();

        self.onmessage = (message: MessageEvent) => {
            const data = message.data;

            // compress
            const result = compress(lodepng, data.words, data.width, data.height);

            // return
            (self as any).postMessage({ result: result }, [result.buffer]);
        };
    };

    main();
}

interface PngExportMessage {
    data: {
        result: Uint8Array;
    };
}

class PngExporter {
    worker: Worker;
    promiseFunc: (resolve: (value: Uint8Array) => void, reject: (reason?: any) => void) => void;

    constructor() {
        let receiver: ((message: PngExportMessage) => void) | null;

        this.worker = PngExporter.createWorker();
        this.worker.addEventListener('message', (message: MessageEvent) => {
            if (receiver) {
                receiver(message as PngExportMessage);
            }
        });

        this.promiseFunc = (resolve) => {
            receiver = (message: PngExportMessage) => {
                resolve(message.data.result);
                receiver = null;
            };
        };
    }

    static createWorker(): Worker {
        const workerBlob = new Blob([`(${PngExportWorker.toString()})('${window.location.href.split('?')[0]}')\n\n`], {
            type: 'application/javascript'
        });
        return new Worker(URL.createObjectURL(workerBlob));
    }

    run(words: Uint32Array, width: number, height: number): Promise<Uint8Array> {
        this.worker.postMessage({
            words: words,
            width: width,
            height: height
        }, [words.buffer]);

        return new Promise(this.promiseFunc);
    }

    get extension(): string {
        return 'png';
    }
}

export {
    PngExporter
};
