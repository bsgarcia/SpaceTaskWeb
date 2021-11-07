import {GUI} from './gui.js';
import {sendToDB} from "./request.js";


export class Game {

    constructor(exp) {
        this.exp = exp;
    }

    run(nextFunc, nextParams) {
        GUI.initGameStageDiv();
        GUI.InsertGame();
        window.unityInstance = UnityLoader.instantiate(
            "unityContainer", "game/Build/spaceRLHighSchool.json", {onProgress: UnityProgress});

        // set next function to window in order to access it from unity js plugin
        window.nextFunc = nextFunc;
        window.nextParams = nextParams;
        // GUI.setActiveCurrentStep('experiment');

    }
}
