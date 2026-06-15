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
        let lodepng: any;
        try {
            lodepng = await initLodepng();
        } catch (err) {
            // report init failure on the first request so the caller's promise rejects
            self.onmessage = () => {
                (self as any).postMessage({ error: `failed to initialize lodepng: ${err}` });
            };
            return;
        }

        self.onmessage = (message: MessageEvent) => {
            const data = message.data;

            try {
                // compress
                const result = compress(lodepng, data.words, data.width, data.height);

                // return
                (self as any).postMessage({ result: result }, [result.buffer]);
            } catch (err) {
                (self as any).postMessage({ error: `${err}` });
            }
        };
    };

    main();
}

type PendingExport = {
    resolve: (value: Uint8Array) => void;
    reject: (reason?: any) => void;
};

class PngExporter {
    worker: Worker;
    pending: PendingExport | null = null;

    constructor() {
        this.worker = PngExporter.createWorker();

        this.worker.addEventListener('message', (message: MessageEvent) => {
            const pending = this.pending;
            if (!pending) {
                return;
            }
            this.pending = null;

            if (message.data.error) {
                pending.reject(new Error(message.data.error));
            } else {
                pending.resolve(message.data.result);
            }
        });

        this.worker.addEventListener('error', (e: ErrorEvent) => {
            const pending = this.pending;
            if (pending) {
                this.pending = null;
                pending.reject(new Error(e.message || 'PNG export worker error'));
            }
        });
    }

    static createWorker(): Worker {
        const workerBlob = new Blob([`(${PngExportWorker.toString()})('${window.location.href.split('?')[0]}')\n\n`], {
            type: 'application/javascript'
        });
        const url = URL.createObjectURL(workerBlob);
        const worker = new Worker(url);
        URL.revokeObjectURL(url);
        return worker;
    }

    run(words: Uint32Array, width: number, height: number): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            this.pending = { resolve, reject };
            this.worker.postMessage({
                words: words,
                width: width,
                height: height
            }, [words.buffer]);
        });
    }

    get extension(): string {
        return 'png';
    }
}

export {
    PngExporter
};
