import { getInstructionPage, landingPage, restPage } from "./modules/html_templates.mjs";
import {getURLParams, createCode} from "./modules/utils.mjs";
import {startUnityGame, quitUnityGame} from "./modules/game.mjs";

// globals
// -----------------------------//
var instNum = parseInt(localStorage.getItem('instNum')) || 0;
// instNum coding
const BLOCKS = [3, 5, 7, 9, 11, 13, 15];
const REST = [4, 6, 8, 10, 12, 14];
// session coding
const END = 6;
const CONV = 0.004;
var clickBlocked = false;
var end = localStorage.getItem('end');
const clickBlockedTime = 300;
var inst = [];
window.subID = 'not_set';
window.session = parseInt(localStorage.getItem('session')) || 0;
// -----------------------------//
const loadScore = () => {
    let score = localStorage.getItem('score');
    if (score) {
        return JSON.parse(score);
    } else {
        return [];
    }
}
const reload = () => {
    localStorage.clear();
    window.location.reload();
}

const loadInstructions = async () => {
    [1, 2, 3, 4, 5, 6].forEach(async (instNum) => {
        inst[instNum] = await getInstructionPage(`src/instructions/inst_${instNum}.md`);
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

const skipCurrentStep = () => {
    if (instNum<=2) {
        instNum = BLOCKS[0];
        setPageInstruction(instNum);
    } else if (BLOCKS.includes(instNum)) {
        // alert('InstNum: '+instNum + '\n' + 'Session: '+window.session + '\n' + 'Block: '+BLOCKS.indexOf(instNum))
        window.endTrainingPerceptual();
    } else if (REST.includes(instNum)) {
        // alert('InstNum: '+instNum + '\n' + 'Session: '+window.session + '\n' + 'Block: '+BLOCKS.indexOf(instNum))
        instNum = BLOCKS[REST.indexOf(instNum)+1]
        setPageInstruction(instNum);
    }
}

// const start = async () => {  
    // loading()
    // await loadInstructions()
    // stopLoading()
    // main()
// }

function main() {

    window.score = loadScore();
    setSubID();
    
    // attach event listeners to buttons
    const nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', next);
    const prevButton = document.getElementById('prev-button');
    prevButton.addEventListener('click', prev);
    document.querySelector('#reload').addEventListener('click', reload);
    document.querySelector('#skip').addEventListener('click', skipCurrentStep);
    
    if (end) {
        window.endGame();
        return;
    }

    if (instNum != 0) {
        setPageInstruction(instNum);
    }
}

const setPreviousStepDone = () => {
    setStepDone('introduction');
    [...Array(window.session).keys()].forEach((i) => {
        try {
            setStepDone('block'+(i+1));
        } catch (e) {
            console.log(e);
        }
    })
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
    // set step
    setCurrentStep('block'+(window.session+1));
    setStepDone('introduction');
    // range from 1 to idx set done
    setPreviousStepDone();
    startUnityGame('block');
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
    } else if (BLOCKS.includes(instNum)) {
        setPreviousStepDone()
        startTrainingPerceptual();
    }  else if (REST.includes(instNum)) {
        setPreviousStepDone()
        document.querySelector('#panel').innerHTML = restPage.replace('{block_nb}', ''+(window.session));
        document.querySelector('#panel').style.display = 'flex';
        hidePrevButton();
        document.querySelector('#game').style.display = 'none';
        // setCurrentStep('block'+window.session);
        setCurrentStep('block'+(window.session+1));
    }
    else if (instNum<=2) {
        document.querySelector('#panel').innerHTML = '<progress style="width:35%; margin: auto"></progress>';
        document.querySelector('#panel').style.display = 'flex';
        document.querySelector('#panel').innerHTML = await getInstructionPage(`src/instructions/inst_${instNum}.md`) // inst[instNum];
        showButton();
        if ((instNum == 0) ||
             BLOCKS.includes(instNum-1)) {
                hidePrevButton();
        }
    } else {    
        window.endGame();

    }
}

window.endGame = () => {
    quitUnityGame();
    localStorage.setItem('end', true);
    hideButton();
    setPreviousStepDone();
    setCurrentStep('end')
    let points = (window.score.reduce((a, b) => a + b, 0)).toFixed(3);
    let pounds = (points*CONV).toFixed(3);
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
            <div class="center-align" style="margin: auto">
            <h1 style="display: block">🚀Thank you!🚀</h1>
            <br>
            <br>
            <p>Thank you for participating in our experiment!</p>
            <p>🪙 You earned <b>${points}</b> points = <b>${pounds} pounds! 🪙</p>
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

const saveScore = (score) => {
    let strscore = JSON.stringify(score);
    localStorage.setItem('score', strscore);
}


window.endTrainingPerceptual = () => {
    quitUnityGame();
    // localStorage.setItem('score', window.score);
    saveScore(window.score);
    window.session++;
    localStorage.setItem('session', window.session);
    
    setPreviousStepDone(); 

    if (window.session == END) {
        hideButton();
        window.endGame();
        return;
    }
    
    showButton();
    instNum = REST[window.session];
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


