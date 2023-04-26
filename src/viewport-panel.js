import { Container } from 'pcui';
import { RenderCanvas } from './render-canvas.js';
import { TextureView } from './texture-view.js';
import { InfoPanel } from './info-panel.js';

class ViewportPanel extends Container {
    constructor(renderer, textureManager, args = {}) {
        Object.assign(args, {
            class: 'texture-2d-panel',
            flex: true,
            flexGrow: 1,
            flexShrink: 1
        });
        super(args);

        this.renderer = renderer;
        this.canvas = new RenderCanvas(renderer);
        this.view = new TextureView(this.canvas);
        this.texture = null;

        this.append(this.canvas);
        this.append(new InfoPanel(textureManager));

        // handle mouse events
        this.dom.addEventListener('wheel', (event) => {
            const rect = event.target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.view.setScale(this.view.scale - event.deltaY * 0.01, x * window.devicePixelRatio, y * window.devicePixelRatio);
        });

        let mx = 0;
        let my = 0;
        let dragging = false;

        this.dom.addEventListener('mousedown', (event) => {
            event.preventDefault();
            mx = event.offsetX;
            my = event.offsetY;
            dragging = true;
        });

        this.dom.addEventListener('mousemove', (event) => {
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

                if (uv.u >= 0 && uv.v >= 0 && uv.u < t.width && uv.v < t.height) {
                    uv.u = Math.floor(uv.u / Math.pow(2, this.view.mipmap));
                    uv.v = Math.floor((t.height - uv.v) / Math.pow(2, this.view.mipmap));
                    // this.cursorTexel.text = `${uv.u.toFixed(0)},${uv.v.toFixed(0)}`;
                } else {
                    // this.cursorTexel.text = `-`;
                }
            }
        });

        this.dom.addEventListener('mouseup', (event) => {
            dragging = false;
        });

        textureManager.on('textureDocAdded', (doc) => {
            doc.settings.patch({
                viewport: {
                    
                }
            });
        });

        const events = [];
        textureManager.on('textureDocSelected', (texture) => {
            events.forEach(ev => ev.unbind());
            events.length = 0;

            events.push(texture.settings.on('view.filter:set', (value) => {
                this.view.setFilter(value);
            }));
            events.push(texture.settings.on('view.face:set', (value) => {
                this.view.setFace(parseInt(value, 10));
            }));
            events.push(texture.settings.on('view.mipmap:set', (value) => {
                this.view.setMipmap(parseInt(value, 10));
            }));
            events.push(texture.settings.on('view.type:set', (value) => {
                this.view.setTextureType(value);
            }));
            events.push(texture.settings.on('view.alpha:set', (value) => {
                this.view.setAlpha(value);
            }));
            events.push(texture.settings.on('view.exposure:set', (value) => {
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
