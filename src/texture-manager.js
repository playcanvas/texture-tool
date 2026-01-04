import { Events } from '@playcanvas/observer';

import { TextureDoc } from './texture-doc.js';

class TextureManager extends Events {
    constructor(assets) {
        super();

        this.assets = assets;
        this.emptyTextureDoc = new TextureDoc(null);
        this.textureDocs = new Map();
        this.selectedTextureDoc = null;
    }

    // add a texture asset
    addTextureDocByUrl(url, filename, callback) {
        this.assets.loadFromUrlAndFilename(url, filename, 'texture', (err, asset) => {
            if (err) {
                console.error(err);
                if (callback) {
                    callback(err, null);
                }
            } else {
                this.addTextureDoc(new TextureDoc(asset), callback);
            }
        });
    }

    addTextureDoc(textureDoc, callback) {
        this.textureDocs.set(textureDoc.id, textureDoc);
        this.emit('textureDocAdded', textureDoc);
        if (callback) {
            callback(null, textureDoc);
        }
    }

    removeTextureDoc(textureDoc) {
        const id = textureDoc.id;
        if (!this.textureDocs.has(id)) {
            console.error('invalid texture');
        } else {
            if (textureDoc === this.selectedTextureDoc) {
                const ids = this.textureDocIds;
                if (ids.length === 1) {
                    // user is closing the last texture, select an empty texture
                    this.selectTextureDoc(this.emptyTextureDoc);
                } else {
                    // find another texture in the list
                    const idx = ids.indexOf(textureDoc.id) + 1;
                    this.selectTextureDoc(this.getTextureDoc(ids[idx === ids.length ? idx - 2 : idx]));
                }
            }
            this.emit('textureDocRemoved', textureDoc);

            const asset = textureDoc.asset;
            asset.unload();
            this.assets.remove(id);
            this.textureDocs.delete(id);
        }
    }

    selectTextureDoc(textureDoc) {
        if (textureDoc !== this.selectedTextureDoc) {
            this.selectedTextureDoc = textureDoc;
            this.emit('textureDocSelected', textureDoc);

            // fire changed values on everything
            const recurse = (json, path) => {
                Object.keys(json).forEach((key) => {
                    const p = `${path}${path.length > 0 ? '.' : ''}${key}`;
                    if (typeof json[key] === 'object') {
                        recurse(json[key], p);
                    } else {
                        textureDoc.settings.set(p, textureDoc.settings.get(p), undefined, undefined, true);
                    }
                });
            };

            recurse(textureDoc.settings.json(), '');
        }
    }

    get textureDocIds() {
        return Array.from(this.textureDocs.keys());
    }

    getTextureDoc(id) {
        return this.textureDocs.get(id) || null;
    }
}

export {
    TextureManager
};
