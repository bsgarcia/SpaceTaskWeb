import { getInstructionPage, landingPage } from "./modules/html_templates.mjs";
import {getURLParams, createCode} from "./modules/utils.mjs";
import {startUnityGame, quitUnityGame} from "./modules/game.mjs";

// globals
// -----------------------------//
var instNum = parseInt(localStorage.getItem('instNum')) || 0;
const PERCEPTUAL_TRAINING = 4;
const RL_TRAINING = 6;
const EXPERIMENT = 8;
var clickBlocked = false;
var end = localStorage.getItem('end');
const clickBlockedTime = 300;
var inst = [];
window.subID = 'not_set';
// -----------------------------//

const reload = () => {
    localStorage.clear();
    window.location.reload();
}

const loadInstructions = async () => {
    [1, 2, 3, 4, 5, 6].forEach(async (instNum) => {
        inst[instNum] = await getInstructionPage(`./instructions/inst_${instNum}.md`);
    })
    
}

const loading = () => {
    hideButton();
    document.querySelector('#panel').style.display = 'none';
    document.querySelector('#game').style.display = 'none';
    document.querySelector('progress').style.display = 'block';
}   

const stopLoading = () => {
    showButton();
    document.querySelector('progress').style.display = 'none';
}

// const start = async () => {  
    // loading()
    // await loadInstructions()
    // stopLoading()
    // main()
// }

function main() {
    setSubID();
    
    // attach event listeners to buttons
    const nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', next);
    const prevButton = document.getElementById('prev-button');
    prevButton.addEventListener('click', prev);
    document.querySelector('#reload').addEventListener('click', reload);
    
    if (end) {
        window.endGame();
        return;
    }

    if (instNum != 0) {
        setPageInstruction(instNum);
    }
}

const setCurrentStep = (step) => {
    document.querySelector('#'+step).classList.add('active-step');
}

const unsetStep = (step) => {
    document.querySelector('#'+step).classList.remove('active-step');
}

const setStepDone = (step) => {
    document.querySelector('#'+step).classList.add('done-step');
}

const startGame = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // set step
    setCurrentStep('experiment');
    setStepDone('introduction');
    setStepDone('training1');
    setStepDone('training2');
    document.querySelector('#game').style.display = 'block';
    startUnityGame('main');
}

const startTrainingPerceptual = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // insert progress circle beer css
    // set step
    setCurrentStep('training1');
    setStepDone('introduction');
    startUnityGame('training1');
}

const startTrainingRL = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // insert progress circle beer css
    // set step
    setCurrentStep('training2');
    setStepDone('training1');
    setStepDone('introduction');
    startUnityGame('training2');
}



const setSubID = () => {
    window.subID = getURLParams('prolificID') || 'random-'+createCode(5);
    document.querySelector('.subID').innerHTML = 'id: ' + window.subID;
}

const hidePanel = () => {
    document.querySelector('#panel').style.display = 'none';
}

// function used to naviguate between instructions pages as markdown
// using zero-md library
const next = () => {
    if (clickBlocked) return;
    blockClick();
    instNum++;
    setPageInstruction(instNum);
}
const prev = () => {
    if (clickBlocked) return;
    blockClick();
    instNum--;
    setPageInstruction(instNum);
}

const hideButton = () => {
    document.querySelector('#next-button').style.display = 'none';
    document.querySelector('#prev-button').style.display = 'none';
}
const showButton = () => {
    document.querySelector('#next-button').style.display = 'inline-flex';
    document.querySelector('#prev-button').style.display = 'inline-flex';
}

const hidePrevButton = () => {
    document.querySelector('#prev-button').style.display = 'none';
}

const blockClick = () => {
    clickBlocked = true;
    setTimeout(() => {clickBlocked = false}, clickBlockedTime);
}

const setPageInstruction = async (instNum) => {
    instNum = parseInt(instNum);
    localStorage.setItem('instNum', instNum);
    if (instNum == 0) {
        document.querySelector('#panel').innerHTML = landingPage;
        document.querySelector('#panel').style.display = 'flex';
        document.querySelector('#prev-button').style.display = 'none';
        document.querySelector('#game').style.display = 'none';
    } else if (instNum == PERCEPTUAL_TRAINING) {
        startTrainingPerceptual();
    } else if (instNum == RL_TRAINING) {
        startTrainingRL();
    } else if (instNum == EXPERIMENT) {
        startGame();
    } else {    

        document.querySelector('#panel').innerHTML = '<progress style="width:35%; margin: auto"></progress>';
        document.querySelector('#panel').innerHTML = await getInstructionPage(`./instructions/inst_${instNum}.md`) // inst[instNum];
        showButton();
        if ((instNum == 0) ||
         [PERCEPTUAL_TRAINING, RL_TRAINING, EXPERIMENT].includes(instNum-1)) {
                hidePrevButton();
        }
    }
}

window.endGame = () => {
    quitUnityGame();
    localStorage.setItem('end', true);
    hideButton();
    setStepDone('introduction');    
    setStepDone('experiment');
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
            <div class="center-align" style="margin: auto">
            <h1 style="display: block">🚀Thank you!🚀</h1>
            <br>
            <br>
            <p>Thank you for participating in our experiment!</p>
            <p>Please click the button below and answer a few questions to complete your submission.</p>
            <br>
            <button id="submit-button" class="btn btn-primary">Survey</button>
            </div>
    `;
}

window.endTrainingRL = () => {
    quitUnityGame();
    setStepDone('introduction');    
    setStepDone('training1');
    setStepDone('training2');
    setCurrentStep('experiment');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    showButton();
    instNum = 7;
    setPageInstruction(instNum);
    hidePrevButton();
}

window.endTrainingPerceptual = () => {
    quitUnityGame();
    setStepDone('introduction');    
    setStepDone('training1');
    setCurrentStep('training2');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    showButton();
    instNum = 5;
    setPageInstruction(instNum);
    hidePrevButton();
}

// ------------------------------ RUN ------------------------------ //
// When the page is fully loaded, the main function will be called
if (document.readyState !== 'loading') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}


