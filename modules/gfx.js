const X_INTERVAL = 10;

export class Gfx {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        this._canvas = canvas;
        this._ctx = canvas.getContext("2d");
        this._callbacks = {};
        this._fontFamily = "";
        this._fontSize = 0.75;

        const font = new FontFace("Symbola", "url(/fonts/Symbola.ttf)");
        font.load().then((font) => {
            document.fonts.add(font);
            const cb = this._callbacks.fontload;
            if (cb !== undefined) cb();
            //this._ctx.font = "30px Symbola";
        });
    }

    style(obj) {
        for (const [key, val] of Object.entries(obj)) {
            this._canvas.style[key] = val;
        }
    }

    /**
     * @param {HTMLElement} parent 
     */
    attachTo(parent) {
        parent.appendChild(this._canvas);
    }

    /**
     * @param {any} event 
     * @param {(ev: any) => any} handler 
     * @param {boolean | AddEventListenerOptions} options 
     */
    on(event, handler, options) {
        if (event === "#fontload") {
            this._callbacks.fontload = handler;
        }
        else this._canvas.addEventListener(event, handler, options);
    }

    /**
     * @param {number} w 
     * @param {number} h 
     */
    refreshSize(w, h) {
        const dpr = window.devicePixelRatio;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
    }

    /**
     * @param {string} color 
     */
    clear(color) {
        this._ctx.fillStyle = color;
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    _f(x, y) {
        const c = this._canvas;
        const s = c.width / (X_INTERVAL * 2);
        return [
            x * s + c.width / 2,
            y * -s + c.height / 2
        ];
    }

    _fl(d) {
        const s = this._canvas.width / (X_INTERVAL * 2);
        return d * s;
    }

    canonicalPos(x, y) {
        const c = this._canvas;
        const s = c.width / (X_INTERVAL * 2);
        return [
            (x - c.width / 2) / s,
            -(y - c.height / 2) / s
        ];
    }

    /**
     * @param {string} color
     */
    set stroke(color) {
        this._ctx.strokeStyle = color;
    }

    /**
     * @param {number} width
     */
    set lineWidth(width) {
        this._ctx.lineWidth = this._fl(width);
    }

    /**
     * @param {"butt" | "round" | "square"} cap
     */
    set lineCap(cap) {
        this._ctx.lineCap = cap;
    }

    /**
     * @param {"bevel" | "round" | "miter"} join
     */
    set lineJoin(join) {
        this._ctx.lineJoin = join;
    }

    /**
     * @param {string} color
     */
    set fill(color) {
        this._ctx.fillStyle = color;
    }

    _updateFont() {
        const realSize = (this._fl(this._fontSize));
        this._ctx.font = `bold ${realSize}px ${this._fontFamily}`;
    }

    /** @param {string} font */
    set fontFamily(font) {
        this._fontFamily = font;
        this._updateFont();
    }

    /** @param {number} size */
    set fontSize(size) {
        this._fontSize = size;
        this._updateFont();
    }

    line(x1, y1, x2, y2) {
        const [xn1, yn1] = this._f(x1, y1);
        const [xn2, yn2] = this._f(x2, y2);
        this._ctx.beginPath();
        this._ctx.moveTo(xn1, yn1);
        this._ctx.lineTo(xn2, yn2);
        this._ctx.stroke();
    }

    circle(x, y, r) {
        const [xn, yn] = this._f(x, y);
        this._ctx.beginPath();
        this._ctx.arc(xn, yn, this._fl(r), 0, 2 * Math.PI);
        this._ctx.fill();
    }
}