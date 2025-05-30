import { Diagram } from "./diagram.js";
import { Presets } from "./presets.js";
import { Mat3x3 } from "./linalg.js";

// Preset Switch
//===============//
const presetSwitch = document.querySelector("#preset-switch");
for (const preset of Presets.all()) {
    const option = document.createElement("option");
    console.log(preset);
    option.textContent = preset.id;
    presetSwitch.appendChild(option);
}
presetSwitch.addEventListener("input", () => {
    const option = presetSwitch.value;
    Diagram.loadPreset(Presets.get(option));
    Diagram.draw();
    for (const listener of wlListners) {
        Diagram.removeAnimHandler(listener);
    }
    wlListners = [];
    onPresetSwitch();
    Diagram.killAnim();
});

// Slider & Velocity Display
//===========================//
/** @type {HTMLElement} */
const fgControl = document.querySelector("#fg-control");
const testInput = document.querySelector("#test-input");
const refSpeed = document.querySelector("#ref-speed");
const updateVelocity = () => {
    const v = Math.tanh(Diagram.hyperbolicAngle());
    refSpeed.innerHTML = `v = ${Math.round(v * 10000) / 10000}<i>c</i>`;
};
updateVelocity();
// testInput.value = (Diagram.hyperbolicAngle() * 10) + 50;
const onTestInput = () => {
    const value = testInput.value;
    const alpha = (value - 50) / 10;
    
    const a = Math.cosh(alpha);
    const b = Math.sinh(alpha);
    Diagram.transform = Mat3x3.linear(a, b, b, a);
    updateVelocity();
    Diagram.draw();
    for (const listener of wlListners) {
        listener();
    }
};
testInput.addEventListener("input", onTestInput);
Diagram.injectAnimHandler(() => {
    testInput.value = Diagram.hyperbolicAngle() * 10 + 50;
    updateVelocity();
});

// World Lines
//=============//
const wlContainer = document.querySelector("#world-lines");
let wlListners = [];
const buttonText = (wl) => {
    return Diagram.enabled("tracing") ? 
        wl._segment === -2 ? "Reset" 
        : Math.abs(wl.currentVelocity(Diagram.transform)) < 0.0001 ? 
            "Trace" 
            : wl._segment === -1 ? "Start" : "Continue"
    : "Select";
};
const formatVelocity = (wl) => {
    const v = wl.currentVelocity(Diagram.transform);
    return v === null ? "v = NA" : `v = ${Math.round(v * 10000) / 10000}<i>c</i>`;
};
const calcGamma = (v) => 1 / Math.sqrt(1 - v ** 2);
const formatGamma = (wl) => {
    const v = wl.currentVelocity(Diagram.transform);
    let padding = "";
    for (let i = 0; i < 17; i++) padding += "&nbsp;";
    return padding + (v === null ? "γ = NA" : `γ = ${Math.round(calcGamma(v) * 10000) / 10000}`);
}
const onPresetSwitch = () => {
    fgControl.style.display = Diagram.enabled("frontGrid") ? "block" : "none";
    evControl.style.display = Diagram.enabled("events") ? "block" : "none";
    testInput.value = (Diagram.hyperbolicAngle() * 10) + 50;
    updateVelocity();
    wlContainer.textContent = "";
    for (const wl of Diagram.worldLines()) {
        
        const item = document.createElement("p");
        item.innerHTML =
            `<span class="wl-icon" style="background-color:${wl._color}"></span>
                    <button class="wl-action">${buttonText(wl)}</button>
                    <span class="wl-vel">${formatVelocity(wl)}</span><br>
                    ${wl._ticks ? `<span class="wl-gamma">${formatGamma(wl)}</span>` : ""}`;
        const button = item.querySelector("button");
        button.addEventListener(
            "click",
            () => {
                const v = wl.currentVelocity(Diagram.transform);
                if (!Diagram.enabled("tracing")) {
                    Diagram.centerWorldLine(wl);
                }
                else if (wl._segment === -2) {
                    wl._segment = -1;
                    Diagram.transform = Mat3x3.ident();
                    Diagram.draw();
                    for (const [i, button] of wlContainer.querySelectorAll(".wl-action").entries()) {
                        button.textContent = buttonText(Diagram.worldLines()[i]);
                    }
                }
                else if (Math.abs(v) < 0.0001) {
                    Diagram.traceWorldLine(wl);
                }
                else Diagram.centerWorldLine(wl);
            },
        );
        wlContainer.appendChild(item);

        const velocity = item.querySelector(".wl-vel");
        const gamma = item.querySelector(".wl-gamma");
        const listener = () => {
            velocity.innerHTML = formatVelocity(wl);
            if (wl._ticks) gamma.innerHTML = formatGamma(wl);
            button.textContent = buttonText(wl);
        };
        wlListners.push(listener);
        Diagram.injectAnimHandler(listener);
    }
};
// onPresetSwitch();

// World Events
//==============//
const evControl = document.querySelector("#ev-control");
const clearEvents = document.querySelector("#clear-ev");
clearEvents.addEventListener("click", () => {
    Diagram.clearWorldEvents();
    Diagram.draw();
});
export function initUI() {
    onPresetSwitch();
}