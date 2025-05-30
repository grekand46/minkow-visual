import TimeDilation from "./sets/1.js";
import LengthContraction from "./sets/2.js";
import SymmetryOfTD from "./sets/3.js";
import TwinParadox from "./sets/4.js";
import LadderParadox from "./sets/5.js";
import RelOfSimult from "./sets/6.js";
import AddingVelocities from "./sets/7.js";
import Intro from "./sets/8.js";

const list = Object.freeze([
    Intro,
    AddingVelocities,
    TimeDilation,
    LengthContraction,
    SymmetryOfTD,
    RelOfSimult,
    TwinParadox,
    LadderParadox
]);

const map = {};
for (const preset of list) {
    map[preset.id] = preset;
}

export const Presets = {
    all() {
        return list;
    },
    get(name) {
        return map[name];
    }
};