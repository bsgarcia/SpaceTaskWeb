import { getInstructionPage, landingPage } from "./modules/html_templates.mjs";
import {getURLParams, createCode} from "./modules/utils.mjs";

// globals
// -----------------------------//
var instNum = localStorage.getItem('instNum') || 0;
var maxInstNum = 3;
var clickBlocked = false;
var end = localStorage.getItem('end');
const clickBlockedTime = 300;
window.subID = 'not_set';
// -----------------------------//


function main() {
    setSubID();
    
    // attach event listeners to buttons
    const nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', next);
    const prevButton = document.getElementById('prev-button');
    prevButton.addEventListener('click', prev);
    
    if (end) {
        window.gameEnded();
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
    document.querySelector('#panel').style.display = 'none';
    // set step
    setCurrentStep('experiment');
    setStepDone('introduction');
    document.querySelector('#game').style.display = 'block';
}

const setSubID = () => {
    window.subID = getURLParams('prolificID') || 'random-'+createCode(5);
    document.querySelector('.subID').innerHTML = 'id: ' + window.subID;
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

const blockClick = () => {
    clickBlocked = true;
    setTimeout(() => {clickBlocked = false}, clickBlockedTime);
}

const setPageInstruction = async (instNum) => {
    localStorage.setItem('instNum', instNum);
    if (instNum == 0) {
        document.querySelector('#panel').innerHTML = landingPage;
        document.querySelector('#prev-button').style.display = 'none';
    } else if (instNum > maxInstNum) {
        startGame();
        hideButton();
    } else {    
        document.querySelector('#panel').innerHTML = await getInstructionPage(`./instructions/inst_${instNum}.md`)
        document.querySelector('#prev-button').style.display = 'inline-flex';
    }
}

window.gameEnded = () => {
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

// ------------------------------ RUN ------------------------------ //
// When the page is fully loaded, the main function will be called
if (document.readyState !== 'loading') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}


