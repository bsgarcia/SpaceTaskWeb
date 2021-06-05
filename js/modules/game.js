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
            "unityContainer", "game/Build/game.json", {onProgress: UnityProgress});

        window.nextFunc = nextFunc;
        window.nextParams = nextParams;
        GUI.setActiveCurrentStep('experiment');

    }
}
