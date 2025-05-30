import { Diagram } from "./modules/diagram.js";
import { Presets } from "./modules/presets.js";
import { initUI } from "./modules/ui.js";

Diagram.loadPreset(Presets.all()[0]);
initUI();