import { assert } from "./util.js";

export class Mat3x3 {
    /**
     * Matrix elements in row major format
     * @param {number[]} data 
     */
    constructor(...data) {
        assert(data.length === 9, `Mat3x3 must have 9 elements, got ${data.length}`);
        this._data = data;
    }

    /**
     * @returns {Mat3x3}
     */
    clone() {
        return new Mat3x3(...this._data);
    }

    /**
     * @param {Mat3x3} m 
     */
    transformBy(m) {
        const old = this._data;
        const other = m._data;
        this._data = [
            old[0] * other[0] + old[3] * other[1] + old[6] * other[2],
            old[1] * other[0] + old[4] * other[1] + old[7] * other[2],
            old[2] * other[0] + old[5] * other[1] + old[8] * other[2],
            old[0] * other[3] + old[3] * other[4] + old[6] * other[5],
            old[1] * other[3] + old[4] * other[4] + old[7] * other[5],
            old[2] * other[3] + old[5] * other[4] + old[8] * other[5],
            old[0] * other[6] + old[3] * other[7] + old[6] * other[8],
            old[1] * other[6] + old[4] * other[7] + old[7] * other[8],
            old[2] * other[6] + old[5] * other[7] + old[8] * other[8],
        ];
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @returns {Mat3x3}
     */
    static translation(x, y) {
        return new Mat3x3(1, 0, x, 0, 1, y, 0, 0, 1);
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @returns {Mat3x3}
     */
    static linear(a, b, c, d) {
        return new Mat3x3(a, b, 0, c, d, 0, 0, 0, 1);
    }

    static ident() {
        return new Mat3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);
    }
}

export class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static get zero() {
        return new Vec3(0, 0, 0);
    }

    static fromXY(x, y) {
        return new Vec3(x, y, 1);
    }

    /**
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @returns {number}
     */
    static dist(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
    }

    /**
     * 
     * @param {Vec3} a 
     * @param {Vec3} b 
     * @param {number} t 
     * @returns {Vec3}
     */
    static lerp(a, b, t) {
        return new Vec3(
            a.x * (1 - t) + b.x * t,
            a.y * (1 - t) + b.y * t,
            a.z * (1 - t) + b.z * t
        );
    }

    static sub(a, b) {
        return new Vec3(
            a.x - b.x,
            a.y - b.y,
            a.z - b.z
        );
    }

    /**
     * @returns {Vec3}
     */
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

    /**
     * @param {Mat3x3} m 
     */
    applyMat(m) {
        const a = m._data;
        const x = this.x * a[0] + this.y * a[1] + this.z * a[2];
        const y = this.x * a[3] + this.y * a[4] + this.z * a[5];
        const z = this.x * a[6] + this.y * a[7] + this.z * a[8];
        this.x = x;
        this.y = y;
        this.z = z;
    }

    scale(k) {
        this.x *= k;
        this.y *= k;
        this.z *= k;
    } 
}