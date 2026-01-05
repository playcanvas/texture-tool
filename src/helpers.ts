import { path } from 'playcanvas';

interface VectorLike {
    x?: number;
    y?: number;
    z?: number;
    w?: number;
}

interface EventCallback {
    callback: (...args: any[]) => void;
    scope: any;
}

interface EventHandler {
    _callbacks: Record<string, EventCallback[]>;
    off: (name: string, callback: (...args: any[]) => void, scope: any) => void;
}

class Helpers {
    // deep compare of two json objects
    static cmp(value0: any, value1: any): boolean {
        if (value0 === null) {
            return value1 === null;
        } else if (value1 === null) {
            return false;
        }

        // neither are null
        if (typeof value0 !== typeof value1) {
            return false;
        }

        // types match
        if (typeof value0 === 'object') {
            // cmp objects
            for (const k in value0) {
                if (Object.prototype.hasOwnProperty.call(value0, k)) {
                    if (!Object.prototype.hasOwnProperty.call(value1, k) || !Helpers.cmp(value0[k], value1[k])) {
                        return false;
                    }
                }
            }
            return true;
        } else if (value0.constructor === Array) {
            // cmp arrays
            if (value0.length !== value1.length) {
                return false;
            }
            for (let i = 0; i < value0.length; ++i) {
                if (!Helpers.cmp(value0[i], value1[i])) {
                    return false;
                }
            }
            return true;
        }

        // cmp atomic types
        return value0 === value1;
    }

    // create a deep clone of a simple object
    static clone<T>(object: T): T | null {
        if (object === null || object === undefined) {
            // null
            return null;
        } else if (object instanceof Array) {
            // array
            const res: any[] = [];
            for (let i = 0; i < object.length; ++i) {
                res[i] = Helpers.clone(object[i]);
            }
            return res as unknown as T;
        } else if (typeof object === 'object') {
            // object
            const res: Record<string, any> = {};
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    res[key] = Helpers.clone((object as Record<string, any>)[key]);
                }
            }
            return res as T;
        }
        // everything else
        return object;
    }

    // map, but on objects instead of arrays
    static map<T, R>(object: Record<string, T>, callback: (value: T, key: string) => [string, R]): Record<string, R> {
        const result: Record<string, R> = {};
        for (const k in object) {
            if (Object.prototype.hasOwnProperty.call(object, k)) {
                const [nk, nv] = callback(object[k], k);
                result[nk] = nv;
            }
        }
        return result;
    }

    // forEach, but on objects instead of arrays
    static forEach<T>(object: Record<string, T>, callback: (value: T, key: string) => void): void {
        for (const k in object) {
            if (Object.prototype.hasOwnProperty.call(object, k)) {
                callback(object[k], k);
            }
        }
    }

    static find<T>(object: Record<string, T>, callback: (value: T, key: string) => boolean): T | undefined {
        for (const k in object) {
            if (Object.prototype.hasOwnProperty.call(object, k)) {
                const value = object[k];
                if (callback(value, k)) {
                    return value;
                }
            }
        }
        return undefined;
    }

    static isImageFilename(filename: string): boolean {
        const imageExtensions = ['.png', '.jpg', '.hdr', '.dds', '.ktx', '.ktx2', '.webp'];
        return imageExtensions.indexOf(path.getExtension(filename).toLowerCase()) !== -1;
    }

    static valueFromArray(value: number[] | any): VectorLike | any {
        if (Array.isArray(value)) {
            const names: (keyof VectorLike)[] = ['x', 'y', 'z', 'w'];
            const result: VectorLike = {};
            value.forEach((v, i) => {
                result[names[i]] = v;
            });
            return result;
        }
        return value;
    }

    static valueToArray(value: VectorLike | any): number[] | any {
        if (typeof value === 'object') {
            if (Object.prototype.hasOwnProperty.call(value, 'w')) {
                return [value.x, value.y, value.z, value.w];
            } else if (Object.prototype.hasOwnProperty.call(value, 'z')) {
                return [value.x, value.y, value.z];
            } else if (Object.prototype.hasOwnProperty.call(value, 'y')) {
                return [value.x, value.y];
            }
        }
        return value;
    }

    static offByScope(eventHandler: EventHandler, scope: any): void {
        for (const name in eventHandler._callbacks) {
            const events = eventHandler._callbacks[name];
            for (let i = 0; i < events.length; ++i) {
                const event = events[i];
                if (event.scope === scope) {
                    eventHandler.off(name, event.callback, event.scope);
                }
            }
        }
    }

    static downloadBlob(name: string, blob: Blob): void {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
    }

    static downloadTextFile(name: string, text: string): void {
        const type = name.split('.').pop();
        this.downloadBlob(name, new Blob([text], {
            type: `text/${type === 'txt' ? 'plain' : type}`
        }));
    }

    static removeExtension(filename: string): string {
        return filename.substring(0, filename.length - path.getExtension(filename).length);
    }
}

export {
    Helpers
};
