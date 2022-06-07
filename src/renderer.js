import * as pc from 'playcanvas';

// initialize basis

const getAssetPath = (assetPath) => {
    return assetPath;
};

pc.basisInitialize({
    glueUrl: getAssetPath('lib/basis/basis.wasm.js'),
    wasmUrl: getAssetPath('lib/basis/basis.wasm.wasm'),
    fallbackUrl: getAssetPath('lib/basis/basis.js'),
    lazyInit: true
});

class Renderer {
    constructor() {
        // create the canvas (which will remain invisible)
        this._canvas = document.createElement('canvas');

        // create the app
        this._app = new pc.Application(this._canvas, {
            graphicsDeviceOptions: {
                alpha: true,
                preferWebGl2: true
            }
        });

        this._app.loader.getHandler('texture').imgParser.crossOrigin = 'anonymous';

        // taken from Application.start()
        this._app.systems.fire('initialize', this._app.root);
        this._app.systems.fire('postInitialize', this._app.root);

        this._renderRequest = null;
    }

    get app() {
        return this._app;
    }

    render(canvas, composition) {
        // ensure back buffer is large enough
        if (canvas.width > this._canvas.width ||
            canvas.height > this._canvas.height) {
            this._canvas.width = Math.max(this._canvas.width, canvas.width);
            this._canvas.height = Math.max(this._canvas.height, canvas.height);
        }

        // default to app scene
        composition = composition || this._app.scene.layers;

        // step through all cameras in the composition and set their viewport
        // based on the device backbuffer.
        // NOTE: we can't rely on composition.cameras here because that list
        // only gets populated during renderComposition.
        const seen = new Set();
        for (const layer of composition.layerList) {
            for (const camera of layer.cameras) {
                if (!seen.has(camera)) {
                    seen.add(camera);
                    camera.rect.x = 0;
                    camera.rect.y = 0;
                    camera.rect.z = canvas.width / this._canvas.width;
                    camera.rect.w = canvas.height / this._canvas.height;
                }
            }
        }

        const ms = 0;

        // update
        this._app.systems.fire('update', ms, false);
        this._app.systems.fire('animationUpdate', ms, false);
        this._app.systems.fire('postUpdate', ms, false);

        // render
        this._app.batcher.updateAll();
        this._app.renderer.renderComposition(composition);

        // copy the result to the target canvas
        const context = canvas.getContext('2d');
        context.globalCompositeOperation = 'copy';
        context.drawImage(this._canvas, 0, this._canvas.height - canvas.height, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    }
}

export {
    Renderer
};
