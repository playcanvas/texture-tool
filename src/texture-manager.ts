import { Events } from '@playcanvas/observer';
import type { AssetRegistry, Asset } from 'playcanvas';

import { TextureDoc } from './texture-doc';

type TextureDocCallback = (err: Error | null, textureDoc: TextureDoc | null) => void;

class TextureManager extends Events {
    assets: AssetRegistry;
    emptyTextureDoc: TextureDoc;
    textureDocs: Map<number, TextureDoc>;
    selectedTextureDoc: TextureDoc | null;

    constructor(assets: AssetRegistry) {
        super();

        this.assets = assets;
        this.emptyTextureDoc = new TextureDoc(null);
        this.textureDocs = new Map();
        this.selectedTextureDoc = null;
    }

    // add a texture asset
    addTextureDocByUrl(url: string, filename: string, callback?: TextureDocCallback): void {
        this.assets.loadFromUrlAndFilename(url, filename, 'texture', (err: string | null, asset?: Asset) => {
            if (err) {
                console.error(err);
                if (callback) {
                    callback(new Error(err), null);
                }
            } else if (asset) {
                this.addTextureDoc(new TextureDoc(asset), callback);
            }
        });
    }

    addTextureDoc(textureDoc: TextureDoc, callback?: TextureDocCallback): void {
        this.textureDocs.set(textureDoc.id, textureDoc);
        this.emit('textureDocAdded', textureDoc);
        if (callback) {
            callback(null, textureDoc);
        }
    }

    removeTextureDoc(textureDoc: TextureDoc): void {
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
                    this.selectTextureDoc(this.getTextureDoc(ids[idx === ids.length ? idx - 2 : idx])!);
                }
            }
            this.emit('textureDocRemoved', textureDoc);

            const asset = textureDoc.asset;
            if (asset) {
                asset.unload();
                this.assets.remove(asset);
            }
            this.textureDocs.delete(id);
        }
    }

    selectTextureDoc(textureDoc: TextureDoc): void {
        if (textureDoc !== this.selectedTextureDoc) {
            this.selectedTextureDoc = textureDoc;
            this.emit('textureDocSelected', textureDoc);

            // fire changed values on everything
            const recurse = (json: Record<string, any>, path: string) => {
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

    get textureDocIds(): number[] {
        return Array.from(this.textureDocs.keys());
    }

    getTextureDoc(id: number): TextureDoc | null {
        return this.textureDocs.get(id) || null;
    }
}

export {
    TextureManager
};
