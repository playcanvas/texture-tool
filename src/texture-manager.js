import * as pc from 'playcanvas';
import { Texture } from './texture.js';

class TextureManager extends pc.EventHandler {
    constructor(assets) {
        super();

        this.assets = assets;
        this.emptyTexture = new Texture(null);
        this.textures = new Map();
        this.selectedTexture = null;
    }

    // add a texture asset
    addTexture(url, filename, callback) {
        this.assets.loadFromUrlAndFilename(url, filename, 'texture', (err, asset) => {
            if (err) {
                console.error(err);
                if (callback) {
                    callback(err, null);
                }
            } else {
                const texture = new Texture(asset);
                this.textures.set(texture.id, texture);
                this.fire('textureAdded', texture);
                if (callback) {
                    callback(null, texture);
                }
            }
        });
    }

    removeTexture(texture) {
        const id = texture.id;
        if (!this.textures.has(id)) {
            console.error('invalid texture');
        } else {
            if (texture === this.selectedTexture) {
                const ids = this.textureIds;
                if (ids.length === 1) {
                    // user is closing the last texture, select an empty texture
                    this.selectTexture(this.emptyTexture);
                } else {
                    // find another texture in the list
                    const idx = ids.indexOf(texture.id) + 1;
                    this.selectTexture(this.getTexture(ids[idx === ids.length ? idx - 2 : idx]));
                }
            }
            this.fire('textureRemoved', texture);

            const asset = texture.asset;
            asset.unload();
            this.assets.remove(id);
            this.textures.delete(id);
        }
    }

    selectTexture(texture) {
        if (texture !== this.selectedTexture) {
            this.selectedTexture = texture;
            this.fire('textureSelected', texture);

            // raise change events so everyone is notified of state
            ['filter', 'face', 'mipmap', 'type', 'alpha', 'exposure'].forEach((key) => {
                texture.view.set(key, texture.view.get(key), undefined, undefined, true);
            });
        }
    }

    get textureIds() {
        return Array.from(this.textures.keys());
    }

    getTexture(id) {
        return this.textures.get(id) || null;
    }
}

export {
    TextureManager
};
