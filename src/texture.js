import { Observer } from '@playcanvas/observer';
import {
    TEXTURETYPE_RGBM,
    TEXTURETYPE_RGBE,
    PIXELFORMAT_RGBA16F,
    PIXELFORMAT_RGBA32F
} from 'playcanvas';

const getTextureType = (texture) => {
    switch (texture.type) {
        case TEXTURETYPE_RGBM:
            return '2';
        case TEXTURETYPE_RGBE:
            return '3';
        default: 
            return (texture.format === PIXELFORMAT_RGBA16F || texture.format === PIXELFORMAT_RGBA32F) ? '1' : '0';
    }
};

class Texture {
    constructor(asset) {
        this.asset = asset;
        this.view = new Observer({
            filter: false,
            face: '0',
            mipmap: '0',
            type: asset ? getTextureType(asset.resource) : '0',
            alpha: false,
            exposure: '0'
        });
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
    Texture
};
