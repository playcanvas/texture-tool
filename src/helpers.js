import { path } from 'playcanvas';

class Helpers {
    // deep compare of two json objects
    static cmp(value0, value1) {
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
                if (value0.hasOwnProperty(k)) {
                    if (!value1.hasOwnProperty(k) || !Helpers.cmp(value0[k], value1[k])) {
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
    static clone(object) {
        if (object === null || object === undefined) {
            // null
            return null;
        } else if (object instanceof Array) {
            // array
            const res = [];
            for (let i = 0; i < object.length; ++i) {
                res[i] = Helpers.clone(object[i]);
            }
            return res;
        } else if (typeof object === 'object') {
            // object
            const res = { };
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    res[key] = Helpers.clone(object[key]);
                }
            }
            return res;
        }
        // everything else
        return object;
    }

    // map, but on objects instead of arrays
    static map(object, callback) {
        const result = { };
        for (const k in object) {
            if (object.hasOwnProperty(k)) {
                const [nk, nv] = callback.call(this, object[k], k);
                result[nk] = nv;
            }
        }
        return result;
    }

    // forEach, but on objects instead of arrays
    static forEach(object, callback) {
        for (const k in object) {
            if (object.hasOwnProperty(k)) {
                callback.call(this, object[k], k);
            }
        }
    }

    static find(object, callback) {
        for (const k in object) {
            if (object.hasOwnProperty(k)) {
                const value = object[k];
                if (callback.call(this, value, k)) {
                    return value;
                }
            }
        }
        return undefined;
    }

    static isImageFilename(filename) {
        const imageExtensions = ['.png', '.jpg', '.hdr', '.dds', '.ktx', '.ktx2', '.webp'];
        return imageExtensions.indexOf(path.getExtension(filename).toLowerCase()) !== -1;
    }

    static valueFromArray(value) {
        if (Array.isArray(value)) {
            const names = ['x', 'y', 'z', 'w'];
            const result = { };
            value.forEach((v, i) => {
                result[names[i]] = v;
            });
            return result;
        }
        return value;
    }

    static valueToArray(value) {
        if (typeof value === 'object') {
            if (value.hasOwnProperty('w')) {
                return [value.x, value.y, value.z, value.w];
            } else if (value.hasOwnProperty('z')) {
                return [value.x, value.y, value.z];
            } else if (value.hasOwnProperty('y')) {
                return [value.x, value.y];
            }
        }
        return value;
    }

    static offByScope(eventHandler, scope) {
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

    static downloadBlob(name, blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
    }

    static downloadTextFile(name, text) {
        const type = name.split(".").pop();
        this.downloadBlob(name, new Blob([text], {
            type: `text/${type === "txt" ? "plain" : type}`
        }));
    }
}

export {
    Helpers
};
