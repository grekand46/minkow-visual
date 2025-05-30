import { Gfx } from "./gfx.js";
import { Mat3x3, Vec3 } from "./linalg.js";
import { attr, hdist } from "./util.js";

const defaultColor = "hsl(0deg 100% 65%)";
const tickWidth = 0.08;

function angle(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.atan2(dy, dx);
}

export class WorldLine {
    /**
     * @param {[number, number][]} points
     */
    constructor(points, options) {
        this._segment = -1;
        this._points = points;
        this._color = attr(options, "color") || defaultColor;
        this._ticks = attr(options, "ticks") || false;
    }

    /**
     * @param {Gfx} gfx
     * @param {Mat3x3} transform
     */
    renderWith(gfx, transform) {
        gfx.lineCap = "round";
        gfx.lineWidth = 0.1;
        gfx.stroke = this._color;
        for (let i = 0; i < this._points.length - 1; i++) {
            const p1 = Vec3.fromXY(...this._points[i]);
            const p2 = Vec3.fromXY(...this._points[i + 1]);
            p1.applyMat(transform);
            p2.applyMat(transform);

            gfx.line(p1.x, p1.y, p2.x, p2.y);
        }

        if (this._ticks) {
            let overshoot = 0;
            for (let i = 0; i < this._points.length - 1; i++) {
                const p1 = Vec3.fromXY(...this._points[i]);
                const p2 = Vec3.fromXY(...this._points[i + 1]);

                p1.applyMat(transform);
                p2.applyMat(transform);

                const step = 1 / hdist(p1, p2);
                const dir = angle(p1, p2);
                const sin = Math.sin(dir);
                const cos = Math.cos(dir);
                let offset;
                for (offset = overshoot; offset < 1; offset += step) {
                    const pos = Vec3.lerp(p1, p2, offset);
                    gfx.stroke = this._color;
                    gfx.line(pos.x + sin * tickWidth, pos.y - cos * tickWidth, pos.x - sin * tickWidth, pos.y + cos * tickWidth);
                }
                overshoot = offset - 1;

                gfx.line(p1.x, p1.y, p2.x, p2.y);
            }
        }

        //return;
        for (const [x, y] of this._points) {
            const p = Vec3.fromXY(x, y);
            p.applyMat(transform);
            gfx.fill = this._color;
            gfx.circle(p.x, p.y, 0.15);
            gfx.fill = "#000000";
            gfx.circle(p.x, p.y, 0.08);
        }
    }

    /**
     * @param {Mat3x3} transform 
     * @returns {number | null}
     */
    currentVelocity(transform) {
        if (this._segment > -1) {
            const p1 = Vec3.fromXY(...this.segmentStart());
            const p2 = Vec3.fromXY(...this.segmentEnd());
            p1.applyMat(transform);
            p2.applyMat(transform);
            return (p2.x - p1.x) / (p2.y - p1.y);
        }
        for (let i = 0; i < this._points.length - 1; i++) {
            const p1 = Vec3.fromXY(...this._points[i]);
            const p2 = Vec3.fromXY(...this._points[i + 1]);
            p1.applyMat(transform);
            p2.applyMat(transform);
            if (p1.y * p2.y <= 0.0001) return (p2.x - p1.x) / (p2.y - p1.y);
        }
        return null;
    }

    segmentStart() {
        return this._segment > -1 ? this._points[this._segment] : null;
    }

    segmentEnd() {
        return this._segment > -1 ? this._points[this._segment + 1] : null;
    }
}
