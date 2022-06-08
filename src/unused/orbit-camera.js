import {
    math, Vec3, BoundingBox, Mouse,
    EVENT_MOUSEMOVE,
    EVENT_MOUSEWHEEL,
    EVENT_MOUSEDOWN,
    EVENT_MOUSEUP,
    MOUSEBUTTON_LEFT,
    MOUSEBUTTON_RIGHT
} from 'playcanvas';
import { Events } from '@playcanvas/observer';

const workForward = new Vec3();
const workUp = new Vec3();
const workRight = new Vec3();

class OrbitTransform extends Events {
    constructor() {
        super();
        this.focalPoint = new Vec3(0, 0, 0);
        this.azimuth = 45;
        this.elevation = -30;
        this.distance = 2;
    }

    pan(x, y) {
        this.calcForward(workForward);
        workRight.cross(Vec3.UP, workForward).normalize();
        workUp.cross(workForward, workRight);
        workRight.scale(x * this.distance * 0.002);
        workUp.scale(y * this.distance * 0.002);
        this.focalPoint.add(workRight);
        this.focalPoint.add(workUp);
        this.emit('changed');
    }

    rotate(azimuth, elevation) {
        this.azimuth = (this.azimuth + azimuth * -0.5) % 360;
        this.elevation = Math.max(-90, Math.min(90, this.elevation + elevation * -0.5));
        this.emit('changed');
    }

    zoom(zoom) {
        this.distance -= zoom * this.distance * 0.1;
        this.emit('changed');
    }

    frame(bbox, fovDeg) {
        this.focalPoint.copy(bbox.center);
        this.distance = (bbox.halfExtents.length() * 1.4) / Math.sin(0.5 * fovDeg * math.DEG_TO_RAD);
        this.emit('changed');
    }

    // apply the current orbit transform to the given entity
    applyTo(entity) {
        this.calcForward(workForward);
        workForward.scale(this.distance);
        workForward.add(this.focalPoint);

        entity.setLocalPosition(workForward);
        entity.setLocalEulerAngles(this.elevation, this.azimuth, 0);
    }

    // calculate forward vector
    calcForward(result) {
        const ex = this.elevation * math.DEG_TO_RAD;
        const ey = this.azimuth * math.DEG_TO_RAD;
        const s1 = Math.sin(-ex);
        const c1 = Math.cos(-ex);
        const s2 = Math.sin(-ey);
        const c2 = Math.cos(-ey);
        result.set(-c1 * s2, s1, c1 * c2);
    }
}

class MouseOrbit {
    constructor(transform, canvas) {
        this._transform = transform;
        this._mouse = new Mouse(canvas);
        this._mouse.disableContextMenu();
        this._mouse.on(EVENT_MOUSEMOVE, this._move.bind(this));
        this._mouse.on(EVENT_MOUSEWHEEL, this._wheel.bind(this));

        // hack: currently the pc mouse device only receives down events
        // and no up events thereby confusing pc.mouse. this tracking
        // flag is the workaround.
        this._mouse.on(EVENT_MOUSEDOWN, this._down.bind(this));
        this._mouse.on(EVENT_MOUSEUP, this._up.bind(this));
        this._tracking = false;
    }

    _down(event) {
        this._tracking = true;
    }

    _up(event) {
        this._tracking = false;
    }

    _move(event) {
        if (this._tracking) {
            if (this._mouse.isPressed(MOUSEBUTTON_LEFT)) {
                this._transform.rotate(event.dx, event.dy);
            } else if (this._mouse.isPressed(MOUSEBUTTON_RIGHT)) {
                this._transform.pan(-event.dx, event.dy);
            }
        }
    }

    _wheel(event) {
        this._transform.zoom(event.wheel);
    }
}

class OrbitCamera {
    constructor(canvas) {
        this._transform = new OrbitTransform();
        this._mouse = new MouseOrbit(this._transform, canvas);
        // TODO: add orbit touch controller
    }

    get transform() {
        return this._transform;
    }

    frame(rootEntity, camera) {
        let bbox = null;

        const update = (meshInstance) => {
            if (bbox) {
                bbox.add(meshInstance.aabb);
            } else {
                bbox = new BoundingBox();
                bbox.copy(meshInstance.aabb);
            }
        };

        const recurse = (entity) => {
            entity.findComponents('render').concat(entity.findComponents('model')).forEach((component) => {
                component.meshInstances.forEach(update);
            });
        };

        recurse(rootEntity);

        if (bbox) {
            camera.farClip = bbox.halfExtents.length() * 20;
            camera.nearClip = camera.farClip / 1000;
            this.transform.frame(bbox, camera.fov);
        }
    }
}

export {
    OrbitCamera
};
