import { Gfx } from "./gfx.js";
import { Mat3x3, Vec3 } from "./linalg.js";
import { assert, hdist } from "./util.js";
import { WorldLine } from "./world-line.js";

const eventSize = 0.08;

function pastelColor(hue) {
    return `hsl(${hue}deg 100% 65%)`;
}

const State = {
    /** @type {WorldLine[]} */
    worldLines: [],
    worldEvents: [],
    enable: {
        frontGrid: false,
        events: false,
        tracing: false
    },
    loadWorldLines(worldLines) {
        this.worldLines = [];
        for (const info of worldLines) {
            const points = info.p;
            assert(points, "info.p must not be null");
            const color = info.c;
            const ticks = info.t;
            this.worldLines.push(new WorldLine(points, { color, ticks }));
        }
    },
    pickWorldLine(wl) {
        for (const worldLine of this.worldLines) {
            if (worldLine === wl) {
                if (wl._segment < 0) wl._segment = 0; 
            }
            else worldLine._segment = -1;
        }
    }
};

const BOUNDS = 10;
const Render = {
    frontGrid() {
        const B = BOUNDS;
        for (let i = -B; i <= B; i++) {
            gfx.lineWidth = 0.025;
            gfx.stroke = "hsl(220deg 50% 60%)";
            const v = [
                Vec3.fromXY(i, -B),
                Vec3.fromXY(i, B),
                Vec3.fromXY(-B, i),
                Vec3.fromXY(B, i),
            ];
            v.forEach((x) => x.applyMat(Diagram.transform));
            gfx.line(v[0].x, v[0].y, v[1].x, v[1].y);
            gfx.line(v[2].x, v[2].y, v[3].x, v[3].y);
        }

        const v = [
            Vec3.fromXY(0, -B),
            Vec3.fromXY(0, B),
            Vec3.fromXY(-B, 0),
            Vec3.fromXY(B, 0),
        ];
        v.forEach((x) => x.applyMat(Diagram.transform));
        gfx.lineWidth = 0.035;
        gfx.stroke = "hsl(0deg 0% 100%)";
        gfx.line(v[0].x, v[0].y, v[1].x, v[1].y);
        gfx.line(v[2].x, v[2].y, v[3].x, v[3].y);
    },
    backGrid() {
        const B = BOUNDS;
        for (let i = -B; i <= B; i++) {
            gfx.lineWidth = i === 0 ? 0.03 : 0.01;
            gfx.stroke = `#ffffff80`;
            const v = [
                Vec3.fromXY(i, -B),
                Vec3.fromXY(i, B),
                Vec3.fromXY(-B, i),
                Vec3.fromXY(B, i),
            ];
            gfx.line(v[0].x, v[0].y, v[1].x, v[1].y);
            gfx.line(v[2].x, v[2].y, v[3].x, v[3].y);
        }
    },
    labels() {
        gfx._ctx.textBaseline = "top";
        gfx.fontSize = 0.3;
        gfx.fontFamily = "Symbola";
        gfx.fill = "#ffffff80";
        {
            const message = "Displacement (light-seconds)";
            const metrics = gfx._ctx.measureText(message);
            gfx._ctx.fillText(
                message,
                gfx._canvas.width - metrics.width - gfx._fl(0.1),
                gfx._f(0, 0)[1] + gfx._fl(0.1),
            );
        }
        {
            const message = "Time (seconds)";
            gfx._ctx.fillText(
                message,
                gfx._f(0, 0)[0] + gfx._fl(0.1),
                gfx._fl(0.1),
            );
        }
    },
    lights() {
        gfx.lineWidth = 0.035;
        gfx.stroke = "hsl(60deg 100% 75% / 50%)";
        gfx.line(-10, -10, 10, 10);
        gfx.line(10, -10, -10, 10);
    },
    events() {
        const lw = [0.15, 0.08];
        const sk = ["hsl(60deg 100% 65%)", "#000000"];
        const S = eventSize;

        for (let i = 0; i < 2; i++) {
            gfx.lineWidth = lw[i];
            gfx.stroke = sk[i];
            for (const p of State.worldEvents) {
                const v = Vec3.fromXY(p[0], p[1]);
                v.applyMat(Diagram.transform);
                gfx.line(
                    v.x - S,
                    v.y - S,
                    v.x + S,
                    v.y + S,
                );
                gfx.line(
                    v.x + S,
                    v.y - S,
                    v.x - S,
                    v.y + S,
                );
            }
        }
    }
};

export const Diagram = {
    transform: Mat3x3.ident(),
    loadPreset(preset) {
        this.transform = Mat3x3.ident();
        State.loadWorldLines(preset.wl);
        State.worldEvents = [];
        State.enable.frontGrid = preset.fg || false;
        State.enable.events = preset.ev || false;
        State.enable.tracing = preset.tr || false;
    },
    draw() {
        gfx.clear("#000000");
        Render.backGrid();
        Render.labels();
        if (State.enable.frontGrid) Render.frontGrid();
        Render.lights();
        for (const worldLine of State.worldLines) {
            worldLine.renderWith(gfx, Diagram.transform);
        }
        Render.events();
    },
    enabled(name) {
        return State.enable[name] || false;
    },
    hyperbolicAngle() {
        return Math.asinh(this.transform._data[1]);
    },
    worldLines() {
        return State.worldLines;
    },
    /** @param {WorldLine} wl */
    centerWorldLine(wl) {
        if (Anim.ongoing) return;
        State.pickWorldLine(wl);
        const first = wl.segmentStart();
        const second = wl.segmentEnd();
        const segment = new Vec3(second[0] - first[0], second[1] - first[1], 0);
        segment.scale(1 / hdist(segment, Vec3.zero));
        segment.applyMat(Diagram.transform);
        const offsetAngle = -Math.asinh(segment.x);
        let t = 0;
        const oldTransform = Diagram.transform.clone();
        const offsetPos = State.enable.tracing ? Vec3.fromXY(...first) : Vec3.zero;
        offsetPos.applyMat(Diagram.transform);
        Anim.callback = () => {
            let res = true;
            if (t > 1) {
                t = 1;
                res = false;
            } else {
                t += 0.05;
            }
            const v = (t - 1) ** 3 + 1;
            const alpha = offsetAngle * v;
            const newTransform = oldTransform.clone();
            const a = Math.cosh(alpha);
            const b = Math.sinh(alpha);
            newTransform.transformBy(Mat3x3.translation(-offsetPos.x, -offsetPos.y));
            newTransform.transformBy(Mat3x3.linear(a, b, b, a));
            newTransform.transformBy(Mat3x3.translation(offsetPos.x * (1 - v), offsetPos.y * (1 - v)));
            this.transform = newTransform;
            return res;
        };
        Anim.start();
    },
    /** @param {WorldLine} wl */
    traceWorldLine(wl) {
        if (Anim.ongoing) return;
        if (Math.abs(wl.currentVelocity(Diagram.transform)) < 0.0001) State.pickWorldLine(wl);
        const first = wl.segmentStart();
        const second = wl.segmentEnd();
        const segment = new Vec3(second[0] - first[0], second[1] - first[1], 0);
        segment.applyMat(Diagram.transform);
        const duration = hdist(segment, Vec3.zero);
        const oldTransform = Diagram.transform.clone();
        let t = 0;
        Anim.callback = () => {
            let res = true;
            if (t > 1) {
                t = 1;
                wl._segment++;
                if (wl._segment + 1 >= wl._points.length) {
                    console.log("end reached")
                    wl._segment = -2;
                }
                res = false;
            }
            else {
                t += 0.05 / duration;
            }
            const v = t < 0.5 ? (2 * t * t) : (1 - 2 * (t - 1) ** 2);
            const y = v * segment.y;
            const newTransform = oldTransform.clone();
            newTransform.transformBy(Mat3x3.translation(0, -y));
            Diagram.transform = newTransform;
            return res;
        };
        Anim.start();
    },
    injectAnimHandler(handler) {
        Anim.injected.push(handler);
    },
    removeAnimHandler(handler) {
        const index = Anim.injected.indexOf(handler);
        if (index > -1) Anim.injected.splice(index, 1);
    },
    addWorldEvent(x, y) {
        State.worldEvents.push([x, y]);
    },
    clearWorldEvents() {
        State.worldEvents = [];
    },
    killAnim() {
        console.log("kill")
        Anim.killSignal = true;
    }
};

const gfx = new Gfx(document.createElement("canvas"));
gfx.attachTo(document.querySelector("#content"));
gfx.style({
    width: "100%",
    heigh: "100%",
});

gfx.on("wheel", (e) => {
    e.preventDefault();
});

gfx.on("click", (e) => {
    if (!State.enable.events) return;
    const x = e.offsetX * window.devicePixelRatio;
    const y = e.offsetY * window.devicePixelRatio;
    const pos = gfx.canonicalPos(x, y);
    const v = Vec3.fromXY(pos[0], pos[1]);
    const a = Diagram.transform._data[0];
    const b = -Diagram.transform._data[1];
    const dx = Diagram.transform._data[2];
    const dy = Diagram.transform._data[5];
    v.x -= dx;
    v.y -= dy;
    v.applyMat(Mat3x3.linear(a, b, b, a));
    Diagram.addWorldEvent(v.x, v.y);
    Diagram.draw();
});

function onResize() {
    gfx.refreshSize(window.innerWidth, window.innerHeight);
    Diagram.draw();
}

// let alpha = 0;

// const worldLine = new WorldLine([
//     [0, -10],
//     [0, 10],
// ], {
//     color: pastelColor(0),
//     ticks: false,
// });

// const worldLine2 = new WorldLine([
//     [1.1, -10],
//     [1.1, 10],
// ], {
//     color: pastelColor(90),
//     ticks: false,
// });

// const worldLines = [
//     //new WorldLine([[0, 0], [-1, 2]], { color: pastelColor(90) }),
//     worldLine,
//     worldLine2,
// ];
// const worldEvents = [];

// /** @param {WorldLine} wl */
// function centerWorldLine(wl) {
//     if (!animDone) return;
//     const first = wl._points[0];
//     const second = wl._points[1];
//     const segment = new Vec3(second[0] - first[0], second[1] - first[1], 0);
//     segment.scale(1 / hdist(segment, Vec3.zero));
//     const hAngle = Math.asinh(segment.x);
//     const begin = alpha;
//     const target = -hAngle;
//     let t = 0;
//     animCallback = () => {
//         if (t > 1) {
//             animDone = true;
//             alpha = target;
//         } else {
//             t += 0.05;
//             const v = (t - 1) ** 3 + 1;
//             alpha = begin * (1 - v) + target * v;
//         }
//         testInput.value = alpha * 10 + 50;
//         onTestInput();
//     };
//     animStart();
// }

// function draw() {
//     gfx.clear("#000000");

//     const transform = Mat3x3.linear(
//         Math.cosh(alpha),
//         Math.sinh(alpha),
//         Math.sinh(alpha),
//         Math.cosh(alpha),
//     );

//     for (let i = -10; i <= 10; i++) {
//         gfx.lineWidth = i === 0 ? 0.03 : 0.01;
//         gfx.stroke = `#ffffff80`;
//         const v = [
//             Vec3.fromXY(i, -10),
//             Vec3.fromXY(i, 10),
//             Vec3.fromXY(-10, i),
//             Vec3.fromXY(10, i),
//         ];
//         gfx.line(v[0].x, v[0].y, v[1].x, v[1].y);
//         gfx.line(v[2].x, v[2].y, v[3].x, v[3].y);
//     }

//     gfx._ctx.textBaseline = "top";
//     gfx.fontSize = 0.3;
//     gfx.fontFamily = "Symbola";
//     gfx.fill = "#ffffff80";
//     {
//         const message = "Displacement (light-seconds)";
//         const metrics = gfx._ctx.measureText(message);
//         gfx._ctx.fillText(
//             message,
//             gfx._canvas.width - metrics.width - gfx._fl(0.1),
//             gfx._f(0, 0)[1] + gfx._fl(0.1),
//         );
//     }
//     {
//         const message = "Time (seconds)";
//         //const metrics = gfx._ctx.measureText(message);
//         gfx._ctx.fillText(
//             message,
//             gfx._f(0, 0)[0] + gfx._fl(0.1),
//             gfx._fl(0.1),
//         );
//     }

//     drawFrontGrid(transform);

//     gfx.lineWidth = 0.035;
//     gfx.stroke = "hsl(60deg 100% 75% / 50%)";
//     gfx.line(-10, -10, 10, 10);
//     gfx.line(10, -10, -10, 10);

//     worldLines.forEach((wl) => wl.renderWith(gfx, transform));

//     const lw = [0.15, 0.08];
//     const sk = ["hsl(60deg 100% 65%)", "#000000"];

//     for (let i = 0; i < 2; i++) {
//         gfx.lineWidth = lw[i];
//         gfx.stroke = sk[i];
//         for (const p of worldEvents) {
//             const v = Vec3.fromXY(p[0], p[1]);
//             v.applyMat(transform);
//             gfx.line(
//                 v.x - eventSize,
//                 v.y - eventSize,
//                 v.x + eventSize,
//                 v.y + eventSize,
//             );
//             gfx.line(
//                 v.x + eventSize,
//                 v.y - eventSize,
//                 v.x - eventSize,
//                 v.y + eventSize,
//             );
//         }
//     }
// }

// let animDone = true;
// let animCallback = null;
// function anim() {
//     if (animDone) return;
//     Diagram.draw();
//     if (animCallback) animCallback();
//     requestAnimationFrame(anim);
// }
// function animStart() {
//     animDone = false;
//     anim();
// }

const Anim = {
    callback: null,
    injected: [],
    ongoing: false,
    killSignal: false,
    start() {
        if (!this.callback || this.ongoing) return;
        this.killSignal = false;
        this.ongoing = true;
        this.loop();        
    },
    loop() {
        if (this.killSignal) {
            this.killSignal = false;
            this.ongoing = false;
            console.log("nopoe")
            return;
        }
        if (!this.callback) return;
        const result = this.callback();
        Diagram.draw();
        for (const handler of this.injected) {
            handler();
        }
        if (result) {
            window.requestAnimationFrame(() => this.loop());
        } else {
            this.ongoing = false;
        }
    }
};

window.addEventListener("resize", onResize);
gfx.on("#fontload", onResize);

// console.log("what");
