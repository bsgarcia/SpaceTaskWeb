import { getInstructionPage, landingPage } from "./modules/html_templates.mjs";
import {getURLParams, createCode} from "./modules/utils.mjs";

var instNum = 0;
var maxInstNum = 3;

function main() {
    setSubID();
    
    // attach event listeners to buttons
    const nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', next);
    const prevButton = document.getElementById('prev-button');
    prevButton.addEventListener('click', prev);
    
}

const startGame = () => {
    // hide instructions
    document.querySelector('#panel').style.display = 'none';
    
    
    
}

const setSubID = () => {
    window.subID = getURLParams('prolificID');
    document.querySelector('.subID').innerHTML = 'id: ' + window.subID;
}

// function used to naviguate between instructions pages as markdown
// using zero-md library
const next = () => {
    instNum++;
    setPageInstruction(instNum);
}
const prev = () => {
    instNum--;
    setPageInstruction(instNum);
}

const setPageInstruction = async (instNum) => {
    if (instNum == 0) {
        document.querySelector('#panel').innerHTML = landingPage;
        document.querySelector('#prev-button').style.display = 'none';
    } else if (instNum > maxInstNum) {
        startGame();
    } else {    
        document.querySelector('#panel').innerHTML = await getInstructionPage(`./instructions/inst_${instNum}.md`)
        document.querySelector('#prev-button').style.display = 'inline-flex';
    }
}

// ------------------------------ RUN ------------------------------ //
// When the page is fully loaded, the main function will be called
if (document.readyState !== 'loading') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}


