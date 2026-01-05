import { Observer } from '@playcanvas/observer';
import type { Asset, Texture } from 'playcanvas';

interface AssetFile {
    filename: string;
    url: string;
}

class TextureDoc {
    asset: Asset | null;
    settings: Observer;

    constructor(asset: Asset | null) {
        this.asset = asset;

        // observable/editable state
        this.settings = new Observer();
    }

    get filename(): string {
        return this.asset ? (this.asset.file as AssetFile).filename : '';
    }

    get url(): string {
        return this.asset ? (this.asset.file as AssetFile).url : '';
    }

    get resource(): Texture | null {
        return this.asset ? this.asset.resource as Texture : null;
    }

    get id(): number {
        return this.asset ? this.asset.id : 0;
    }

    get width(): number | null {
        return this.resource ? this.resource.width : null;
    }

    get height(): number | null {
        return this.resource ? this.resource.height : null;
    }

    get type(): number | null {
        return this.resource ? (this.resource.type as unknown as number) : null;
    }

    get format(): number | null {
        return this.resource ? this.resource.format : null;
    }

    get mipmaps(): boolean | null {
        return this.resource ? this.resource.mipmaps : null;
    }

    get cubemap(): boolean | null {
        return this.resource ? this.resource.cubemap : null;
    }

    get levels(): any[] | null {
        return this.resource ? (this.resource as any)._levels : null;
    }

    get numMipmaps(): number {
        return this.levels ? this.levels.length : 0;
    }
}

export {
    TextureDoc
};
