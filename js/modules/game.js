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
        // GUI.panelInsertButton({value:'Next', id:'next',
        //     clickArgs: {obj: this},
        //     clickFunc: function (event) {
        //         if (window.gameEnded) {
        //             nextFunc(nextParams);
        //         } else {
        //             window.unityInstance.SendMessage('PauseController', 'PauseGame');
        //
        //             GUI.displayModalWindow('Error',
        //                 'You must finish the game first!', 'error');
        //         }
        //     }});
        GUI.setActiveCurrentStep('experiment');

    }
}
