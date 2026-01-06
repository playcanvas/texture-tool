import { Container } from '@playcanvas/pcui';
import type { LayerComposition } from 'playcanvas';
import type { Renderer } from './renderer';

// implements a pcui canvas element with rendering
class RenderCanvas extends Container {
    renderer: Renderer;
    composition: LayerComposition;
    renderRequest: number | null;
    canvas: HTMLCanvasElement;
    needsResize: boolean;
    canvasWidth: number;
    canvasHeight: number;
    observer: ResizeObserver;
    animationFrame: (timeStamp: number) => void;

    constructor(renderer: Renderer, composition: LayerComposition | null = null, args: Record<string, any> = {}) {
        Object.assign(args, {
            class: 'render-canvas-container',
            flex: true,
            flexGrow: '1',
            flexShrink: '1'
        });
        super(args);

        this.renderer = renderer;
        this.composition = composition || this.renderer.app.scene.layers;
        this.renderRequest = null;

        // canvas
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('renderCanvas');
        this.append(this.canvas);

        this.needsResize = false;
        this.canvasWidth = 300;
        this.canvasHeight = 150;

        // resize observer
        this.observer = new ResizeObserver(() => {
            const rect = this.dom.getBoundingClientRect();
            const width = Math.floor(rect.width);
            const height = Math.floor(rect.height);
            if (width !== this.canvasWidth || height !== this.canvasHeight) {
                this.needsResize = true;
                this.canvasWidth = width;
                this.canvasHeight = height;
                this.canvas.style.width = `${width}px`;
                this.canvas.style.height = `${height}px`;
                this.emit('resize', width, height);
            }
        });
        this.observer.observe(this.dom);

        // animation frame
        this.animationFrame = () => {
            // clear request
            this.renderRequest = null;

            // check canvas is correctly sized just before render to avoid flicker
            if (this.needsResize) {
                this.needsResize = false;
                this.canvas.width = Math.floor(this.canvasWidth * window.devicePixelRatio);
                this.canvas.height = Math.floor(this.canvasHeight * window.devicePixelRatio);
            }

            // allow users to update
            this.emit('prerender', 0);

            // render the composition
            this.renderer.render(this.canvas, this.composition);
        };
    }

    render(): void {
        if (!this.renderRequest) {
            this.renderRequest = window.requestAnimationFrame(this.animationFrame);
        }
    }
}

export {
    RenderCanvas
};
