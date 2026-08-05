// Worker function - kept as a string template for blob creation
type LodePng = {
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    _free(ptr: number): void;
    _lodepng_encode32(data: number, size: number, image: number, width: number, height: number): void;
    _malloc(size: number): number;
};

type WorkerRequest = {
    words: Uint32Array;
    width: number;
    height: number;
};

type WorkerResponse = {
    error?: string;
    result?: Uint8Array;
};

type WorkerScope = {
    importScripts(url: string): void;
    lodepng(args: { locateFile: () => string }): Promise<LodePng>;
    onmessage: ((message: MessageEvent<WorkerRequest>) => void) | null;
    postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
};

function PngExportWorker(href: string): void {
    const scope = self as unknown as WorkerScope;
    const initLodepng = (): Promise<LodePng> => {
        return new Promise((resolve) => {
            scope.importScripts(`${href}lib/lodepng/lodepng.js`);
            resolve(
                scope.lodepng({
                    locateFile: () => `${href}lib/lodepng/lodepng.wasm`
                })
            );
        });
    };

    const compress = (lodepng: LodePng, words: Uint32Array, width: number, height: number): Uint8Array => {
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
        const result = lodepng.HEAPU8.slice(
            u32[resultDataPtrPtr / 4],
            u32[resultDataPtrPtr / 4] + u32[resultSizePtr / 4]
        );

        lodepng._free(resultDataPtrPtr);
        lodepng._free(resultSizePtr);
        lodepng._free(imageData);

        return result;
    };

    const main = async (): Promise<void> => {
        let lodepng: LodePng;
        try {
            lodepng = await initLodepng();
        } catch (err) {
            // report init failure on the first request so the caller's promise rejects
            scope.onmessage = () => {
                scope.postMessage({ error: `failed to initialize lodepng: ${err}` });
            };
            return;
        }

        scope.onmessage = (message) => {
            const data = message.data;

            try {
                // compress
                const result = compress(lodepng, data.words, data.width, data.height);

                // return
                scope.postMessage({ result: result }, [result.buffer]);
            } catch (err) {
                scope.postMessage({ error: `${err}` });
            }
        };
    };

    main();
}

type PendingExport = {
    resolve: (value: Uint8Array) => void;
    reject: (reason?: unknown) => void;
};

class PngExporter {
    worker: Worker;
    pending: PendingExport | null = null;

    constructor() {
        this.worker = PngExporter.createWorker();

        this.worker.addEventListener('message', (message: MessageEvent<WorkerResponse>) => {
            const pending = this.pending;
            if (!pending) {
                return;
            }
            this.pending = null;

            if (message.data.error) {
                pending.reject(new Error(message.data.error));
            } else {
                pending.resolve(message.data.result!);
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
            this.worker.postMessage(
                {
                    words: words,
                    width: width,
                    height: height
                },
                [words.buffer]
            );
        });
    }

    readonly extension = 'png';
}

export { PngExporter };
