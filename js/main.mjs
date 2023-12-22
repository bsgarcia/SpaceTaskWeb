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

const setStep = (step) => {
    document.querySelector('#'+step).classList.add('active');
    const stepList = ['introduction', 'experiment', 'survey'];
    stepList.forEach(s => {
        if (s != step) {
            document.querySelector('#'+s).classList.remove('active');
        }
    })
}

const startGame = () => {
    // hide instructions
    document.querySelector('#panel').style.display = 'none';
    // set step
    setStep('experiment');
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
    setStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    document.querySelector('#panel').innerHTML = `
            <h1>Thank you!</h1>
            <p>Thank you for participating in our experiment!</p>
            <p>Please click the button below to submit your results.</p>
            <button id="submit-button" class="btn btn-primary">Submit</button>
    `;
}

// ------------------------------ RUN ------------------------------ //
// When the page is fully loaded, the main function will be called
if (document.readyState !== 'loading') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}


