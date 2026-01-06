import { Container } from '@playcanvas/pcui';
import type { EventHandle } from '@playcanvas/observer';

import { InfoPanel } from './info-panel';
import { RenderCanvas } from './render-canvas';
import { TextureView } from './texture-view';
import type { Renderer } from './renderer';
import type { TextureManager } from './texture-manager';
import type { TextureDoc } from './texture-doc';

class ViewportPanel extends Container {
    renderer: Renderer;
    canvas: RenderCanvas;
    view: TextureView;
    texture: TextureDoc | null;

    constructor(renderer: Renderer, textureManager: TextureManager, args: Record<string, any> = {}) {
        Object.assign(args, {
            class: 'texture-2d-panel',
            flex: true,
            flexGrow: '1',
            flexShrink: '1'
        });
        super(args);

        this.renderer = renderer;
        this.canvas = new RenderCanvas(renderer);
        this.view = new TextureView(this.canvas);
        this.texture = null;

        this.append(this.canvas);
        this.append(new InfoPanel(textureManager));

        // handle mouse events
        this.dom.addEventListener('wheel', (event: WheelEvent) => {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.view.setScale(this.view.scale - event.deltaY * 0.01, x * window.devicePixelRatio, y * window.devicePixelRatio);
        });

        let mx = 0;
        let my = 0;
        let dragging = false;

        this.dom.addEventListener('mousedown', (event: MouseEvent) => {
            event.preventDefault();
            mx = event.offsetX;
            my = event.offsetY;
            dragging = true;
        });

        this.dom.addEventListener('mousemove', (event: MouseEvent) => {
            const ratio = window.devicePixelRatio;

            if (dragging) {
                this.view.setOffset(
                    this.view.offsetX + (event.offsetX - mx) * ratio,
                    this.view.offsetY - (event.offsetY - my) * ratio);
                mx = event.offsetX;
                my = event.offsetY;
            }

            const t = this.view.texture;
            if (t) {
                const uv = this.view.pixelToTexel(event.offsetX * ratio, this.view.viewportH - event.offsetY * ratio);

                if (uv.u >= 0 && uv.v >= 0 && uv.u < t.width! && uv.v < t.height!) {
                    uv.u = Math.floor(uv.u / Math.pow(2, this.view.mipmap));
                    uv.v = Math.floor((t.height! - uv.v) / Math.pow(2, this.view.mipmap));
                    // this.cursorTexel.text = `${uv.u.toFixed(0)},${uv.v.toFixed(0)}`;
                } else {
                    // this.cursorTexel.text = `-`;
                }
            }
        });

        this.dom.addEventListener('mouseup', () => {
            dragging = false;
        });

        textureManager.on('textureDocAdded', () => {
            // doc.settings.patch({
            //     viewport: {
            //     }
            // });
        });

        const events: EventHandle[] = [];
        textureManager.on('textureDocSelected', (texture: TextureDoc) => {
            events.forEach(ev => ev.unbind());
            events.length = 0;

            events.push(texture.settings.on('view.filter:set', (value: boolean) => {
                this.view.setFilter(value);
            }));
            events.push(texture.settings.on('view.face:set', (value: string) => {
                this.view.setFace(parseInt(value, 10));
            }));
            events.push(texture.settings.on('view.mipmap:set', (value: string) => {
                this.view.setMipmap(parseInt(value, 10));
            }));
            events.push(texture.settings.on('view.type:set', (value: string) => {
                this.view.setTextureType(value);
            }));
            events.push(texture.settings.on('view.alpha:set', (value: boolean) => {
                this.view.setAlpha(value);
            }));
            events.push(texture.settings.on('view.exposure:set', (value: string) => {
                this.view.setExposure(Math.pow(2, parseInt(value, 10)));
            }));

            this.texture = texture;
            this.view.setTexture(this.texture);
        });
    }
}

export {
    ViewportPanel
};
