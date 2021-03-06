import { Observer } from '@playcanvas/observer';

class TextureDoc {
    constructor(asset) {
        this.asset = asset;

        // observable/editable state
        this.settings = new Observer();
    }

    get filename() {
        return this.asset ? this.asset.file.filename : '';
    }

    get url() {
        return this.asset ? this.asset.file.url : '';
    }

    get resource() {
        return this.asset ? this.asset.resource : null;
    }

    get id() {
        return this.asset ? this.asset.id : 0;
    }

    get width() {
        return this.resource ? this.resource.width : null;
    }

    get height() {
        return this.resource ? this.resource.height : null;
    }

    get type() {
        return this.resource ? this.resource.type : null;
    }

    get format() {
        return this.resource ? this.resource.format : null;
    }

    get mipmaps() {
        return this.resource ? this.resource.mipmaps : null;
    }

    get cubemap() {
        return this.resource ? this.resource.cubemap : null;
    }

    get levels() {
        return this.resource ? this.resource._levels : null;
    }

    get numMipmaps() {
        return this.levels ? this.levels.length : 0;
    }
}

export {
    TextureDoc
};
