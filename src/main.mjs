import { getInstructionPage, landingPage, restPage, consentPage } from "./modules/html_templates.mjs";
import { getURLParams, createCode } from "./modules/utils.mjs";
import { startUnityGame, quitUnityGame } from "./modules/game.mjs";

// globals
// -----------------------------//
// constants
const REST = [6, 8, 10, 12]
const TUTORIAL = 3;
const RL_TRAINING_1 = 5
const PERCEPTUAL_TRAINING = 7
const RL_TRAINING_2 = 9
const FULL = 11
const FULL2 = 13
const END = 14
const CONV = 0.00002;
const GAME_NUMBER = 5;

const COMP_LINK = 'aHR0cHM6Ly9hcHAucHJvbGlmaWMuY29tL3N1Ym1pc3Npb25zL2NvbXBsZXRlP2NjPUNKRllaSlk3';

const clickBlockedTime = 300;
const PHP = 'php/insert_feedback.php';

// global variables mutable
var clickBlocked = false;
var inst = [];
var end = localStorage.getItem('end') == 'true';
var instNum = parseInt(localStorage.getItem('instNum')) || 0;


// window variables
window.instNum = instNum;
window.session = parseInt(localStorage.getItem('session')) || 0;
window.subID = 'not_set';
// -----------------------------//
//
const loadScore = () => {
    let score = localStorage.getItem('score');
    if (score) {
        return JSON.parse(score);
    } else {
        return [];
    }
}

window.reload = () => {
    document.querySelector('#modal-reload').showModal();
    document.querySelector('#modal-confirm').addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    })
    document.querySelector('#modal-cancel').addEventListener('click', () => {
        document.querySelector('#modal-reload').close();
    })
}


function main() {

    window.score = loadScore();
    setSubID();

    // attach event listeners to buttons
    const nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', next);
    const prevButton = document.getElementById('prev-button');
    prevButton.addEventListener('click', prev); 
    // if buttons exist 
    if (document.querySelector('#reload'))
        document.querySelector('#reload').addEventListener('click', reload);
    if (document.querySelector('#skip'))
        document.querySelector('#skip').addEventListener('click', skipCurrentStep);

    if (end) {
        window.endFull2();
        return;
    }

    if (instNum != 0) {
        setPageInstruction(instNum);
    }
}
// ------------------------------ Start Games  ------------------------------ //
const startFull = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // set step
    setCurrentStep('full');
    setStepDone('introduction');
    setStepDone('training2');
    setStepDone('training1');
    startUnityGame('full');
}

const startFull2 = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // set step
    setCurrentStep('full2');
    setStepDone('introduction');
    setStepDone('training2');
    setStepDone('training1');
    setStepDone('full');
    startUnityGame('full2');
}

const startTrainingPerceptual = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // set step
    setCurrentStep('training2');
    setStepDone('introduction');
    // range from 1 to idx set done
    setPreviousStepDone();
    startUnityGame('training2');
}

const startTrainingRL = (sess) => {
    // hide instructions
    hidePanel();
    hideButton()
    // insert progress circle beer css
    // set step
    setCurrentStep('training'+sess);
    if (sess > 1)
        setStepDone('training'+sess);
    setStepDone('introduction');
    startUnityGame('training'+sess);
}

const startTutorial = () => {
    hidePanel()
    hideButton()
    setCurrentStep('introduction');
    startUnityGame('tutorial');
    setCurrentStep('introduction');
}


// ------------------------------ Utils ------------------------------ //

const setSubID = () => {
    window.subID = getURLParams('prolificID') || 'random-' + createCode(5);
    document.querySelector('.subID').innerHTML = 'id: ' + window.subID;
}

// ------------------------------ UI Managment ------------------------------ //
const setPreviousStepDone = () => {
    setStepDone('introduction');
    let steps = ['training1', 'training2', 'full'];
    [...Array(window.session).keys()].forEach((i) => {
        try {
            setStepDone(steps[i]);
        } catch (e) {
            console.log(e);
        }
    })
}

const setCurrentStep = (step) => {
    // check if step is already active
    if (document.querySelector('#' + step).classList.contains('active-step')) return;
    if (document.querySelector('#' + step).classList.contains('done-step')) 
        unsetStep(step);
    document.querySelector('#' + step).classList.add('active-step');
}

const unsetStep = (step) => {
    document.querySelector('#' + step).classList.remove('active-step');
    document.querySelector('#' + step).classList.remove('done-step');
}


const setStepDone = (step) => {
    if (document.querySelector('#' + step).classList.contains('done-step')) return;
    if (document.querySelector('#' + step).classList.contains('active-step')) 
        unsetStep(step);
    document.querySelector('#' + step).classList.add('done-step');
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
    if (instNum <= 2) {
        instNum = TUTORIAL;
        setPageInstruction(instNum);
    } else if ([TUTORIAL, PERCEPTUAL_TRAINING, RL_TRAINING_1, RL_TRAINING_2,
         FULL, FULL2].includes(instNum)) {
            switch (instNum) {
            case TUTORIAL:
                window.endTutorial();
                break;
            case PERCEPTUAL_TRAINING:
                window.endTrainingPerceptual();
                // alert('endTrainingPerceptual')
                // window.startTrainingRL();
                break;
            case RL_TRAINING_1:
                // alert('endTrainingRL')
                window.endTrainingRL(0);
                break;
            case RL_TRAINING_2:
                window.endTrainingRL(2);
                break;  
            case FULL:
                window.endFull(3);
                break;
            case FULL2:
                window.endFull2();
                break;
        }

    } else if (REST.includes(instNum)) {
        // alert('InstNum: '+instNum + '\n' + 'Session: '+window.session + '\n')
        instNum++;
        setPageInstruction(instNum);
    }
}

window.skip = skipCurrentStep;


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
    setTimeout(() => { clickBlocked = false }, clickBlockedTime);
}

const checkConsent = () => {
    document.querySelectorAll('input').forEach(element => element.reportValidity());
    // if all checked
    if (document.querySelectorAll('input:checked').length == 4) {
        document.querySelector('#next-button').addEventListener('click', next);
        document.querySelector('#next-button').removeEventListener('click', checkConsent)
        next()
    }
}

const setPageInstruction = async (instNum) => {
    // alert('Setting page instruction: '+instNum);
    instNum = parseInt(instNum);
    localStorage.setItem('instNum', instNum);
    if (instNum == 0) {
        setCurrentStep('introduction');
        document.querySelector('#panel').innerHTML = landingPage;
        document.querySelector('#panel').style.display = 'flex';
        document.querySelector('#prev-button').style.display = 'none';
        document.querySelector('#game').style.display = 'none';
        document.querySelector('#next-button').addEventListener('click', next)
    } else if (instNum == 1) {
        setCurrentStep('introduction');
        document.querySelector('#panel').innerHTML = consentPage;
        document.querySelector('#panel').style.display = 'block';
        // document.querySelector('#prev-button').style.display = 'none';
        showButton();
        document.querySelector('#next-button').removeEventListener('click', next)
        document.querySelector('#next-button').addEventListener('click', checkConsent)
        document.querySelector('#game').style.display = 'none';
    } else if (TUTORIAL == instNum ||
        PERCEPTUAL_TRAINING == instNum ||
        RL_TRAINING_1 == instNum || RL_TRAINING_2 == instNum ||
        FULL == instNum || FULL2 == instNum) {

        setPreviousStepDone()
        switch (instNum) {
            case TUTORIAL:
                // alert('tutorial')
                setCurrentStep('introduction');
                startTutorial();
                break;
            case PERCEPTUAL_TRAINING:
                setCurrentStep('training2');
                // alert('startTrainingPerceptual')
                startTrainingPerceptual();
                break;
            case RL_TRAINING_1:
                setCurrentStep('training1');
                // alert('startTrainingRL')
                startTrainingRL(1);
                break;
            case RL_TRAINING_2:
                setCurrentStep('training3');
                startTrainingRL(3);
                break;
            case FULL:
                setCurrentStep('full');
                // alert('startGame')
                startFull();
                break;
            case FULL2:
                setCurrentStep('full2');
                // alert('startGame')
                startFull2();
                break;
        }
    } else if (instNum == END) {
        window.endFull2();

    }
    else {
        if (instNum > RL_TRAINING_1) {
            setPreviousStepDone()
        }
        document.querySelector('#game').style.display = 'none';
        quitUnityGame();
        document.querySelector('#panel').innerHTML = '<progress style="width:35%; margin: auto"></progress>';
        document.querySelector('#panel').style.display = 'flex';
        document.querySelector('#panel').innerHTML = await getInstructionPage(`src/instructions/inst_${instNum - 1}.md`) // inst[instNum];
        showButton();
        if ([PERCEPTUAL_TRAINING, RL_TRAINING_1, RL_TRAINING_2, FULL, FULL2].includes(instNum - 1)) {
            hidePrevButton();
        }
        if (instNum < RL_TRAINING_1) {
            setCurrentStep('introduction');
        }
    }
}

// ------------------------------ END ------------------------------ //
const lastPage = () => {
    hideButton();
    setPreviousStepDone();
    setStepDone('full');
    setCurrentStep('end')
    let points = window.score.reduce((a, b) => a + b, 0);
    // let points = window.score[window.score.length-1];
    let pounds = (points * CONV).toFixed(3);
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Thank you!🚀</h1>
             <br>
             <p>Thank you for participating in our experiment!</p>
             <p>Please click the button below to complete your submission.</p>
             <br>
             <button id="submit-button" class="btn btn-primary">Complete</button>
             </div>
     `;
    document.querySelector('#submit-button').addEventListener('click', () => {
        window.location.href = atob(COMP_LINK);
    })
}

const rewardPage = () => {
    showButton();
    hidePrevButton()
    setPreviousStepDone();
    setStepDone('full2');
    setCurrentStep('end')
    let points = window.score.reduce((a, b) => a + b, 0);
    // let points = window.score[window.score.length-1];
    let pounds = (points * CONV).toFixed(3);
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Congrats! 🚀</h1>
             <h3>💰 You earned ${points} points = ${pounds} pounds! 💰</h3>
             <br>
             <br>
             <p>Please click the next button and answer a short survey to complete your submission.</p>
             </div>
     `;
    document.querySelector('#next-button').removeEventListener('click', next);
    document.querySelector('#next-button').addEventListener('click', surveyPage);
}


const sendFeedback = async (data, call = 0) => {
    let response = await fetch(PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send feedback');
            return;
        }
        // try again after 500ms
        setTimeout(() => {
            sendFeedback(data, call + 1);
        }, 500);
    }
}


const checkSurvey = () => {
    document.querySelectorAll('input').forEach(element => element.reportValidity());
    return document.querySelectorAll('input:valid').length == GAME_NUMBER &&
        document.querySelectorAll('button.fill-selected').length == GAME_NUMBER;
}

const surveyPage = () => {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    let scale = `<nav class="no-space">
        <button id="" class="scale border left-round max vertical small">
          <span>Strongly Disagree</span>
        </button>
        <button id="" class="scale border no-round max vertical small">
          <span>Disagree<span>
        </button>
        <button id="" class="scale border no-round max vertical small">
          <span>Neutral<span>
        </button>
        <button id="" class="scale border no-round max vertical small">
          <span>Agree<span>
        </button>
        <button id="" class="scale border right-round max vertical small">
          <span>Strongly Agree</span>
        </button>
      </nav>`;

    let question1 = `In the <b style="color: var(--primary)">game 1</b>
     phase it was easy to tell which <b style="color: var(--primary)">spaceship</b> was the best`;
    let question2 = `In the <b style="color: var(--primary)">game 2</b>
     phase it was easy to tell which <b style="color: var(--primary)">forcefield</b> was the best`;
    let question3 = `In the <b style="color: var(--primary)">game 3</b>
     phase it was easy to tell which <b style="color: var(--primary)">spaceship</b> was the best`;
    let question4 = `In the <b style="color: var(--primary)">game 4</b>
     phase it was easy to tell which <b style="color: var(--primary)">spaceship x forcefield</b> was the best`;
     let question5 = `In the <b style="color: var(--primary)">game 5</b>
     phase it was easy to tell which <b style="color: var(--primary)">spaceship x forcefield</b> was the best`;
    let questions = [question1, question2, question3, question4, question5];

    let content = '<h2>Survey</h2><div class="scroll-div-survey" style="">';
    // document.querySelector('#panel').innerHTML = '<h2>Survey</h2><div class="scroll-div">'
    document.querySelector('#panel').style.display = 'block';

    questions.forEach((question, idx) => {
        let box = '<div style="margin-top:2.5%; padding:.5%">'
        let q = box + question + '<br>' + scale.replace(/id=""/g, `id="q${idx}"`) + '';
        // document.querySelector('#panel').innerHTML += q;   
        content += q + `<div class="field input label border" style="height: 5%">
                                                        <input minlength="10" class="open" id="open_q${idx}" required></input>
                                                        <label>Open feedback on game ${idx + 1}</label>
                                                        </div></div>`
    })

    content += '</div>';
    document.querySelector('#panel').innerHTML = content;

    let dataToSend = { 'prolificID': window.subID };

    // wait .5s first for dom to be updated

    // remove event listeners on keypress that were put by unity
    document.querySelectorAll('.open').forEach((open, idx) => {

        open.addEventListener('input', () => {
            dataToSend[open.id] = open.value;
        })
    })

    document.querySelectorAll('.scale').forEach((button, idx) => {
        button.addEventListener('click', () => {
            let id = button.id;
            // get all buttons in the same row
            let buttons = document.querySelectorAll(`#${id}`);
            buttons.forEach((b) => {
                b.classList.remove('fill-selected');
            })
            button.classList.add('fill-selected');

            dataToSend[id] = button.innerText;

            // show next button if all questions are answered
            // if (document.querySelectorAll('button.fill-selected').length == questions.length) {
                // showButton();
                // hidePrevButton();
            // }

        })
    })

    showButton();
    hidePrevButton();

    
    document.querySelector('#next-button').removeEventListener('click', surveyPage);
    document.querySelector('#next-button').removeEventListener('click', next)
    document.querySelector('#next-button').addEventListener('click', () => {
        if (checkSurvey()) {
            document.querySelector('#next-button').removeEventListener('click', checkSurvey);
            sendFeedback(dataToSend);
            lastPage();
        }
    });

}

window.endTutorial = () => {
    quitUnityGame();
    instNum = 4;
    setPageInstruction(instNum);
    showButton();
    hidePrevButton();


}

window.endTrainingRL = (sess) => {
    console.log('endTrainingRL, session='+sess);
    quitUnityGame();
    localStorage.setItem('score', JSON.stringify(window.score));

    setPreviousStepDone();

    if (sess == 2) {
        setCurrentStep('full');
    } else {
        setCurrentStep('training2');
    }

    hidePrevButton();
    showButton();
    instNum = REST[window.session];
    window.session++;
    localStorage.setItem('session', window.session);
    setPageInstruction(instNum);
    hidePrevButton();

}

window.endFull = (sess) => {
    // alert('session='+session);
    if (sess == 3) {
        window.endGame();
    } else {
        window.endFull2();
    }
}

window.endFull2 = () => {
    quitUnityGame();
    localStorage.setItem('end', true);
    localStorage.setItem('score', JSON.stringify(window.score));
    setPreviousStepDone();
    setStepDone('full2');
    setCurrentStep('end')
    rewardPage();
}

window.endGame = () => {
    // alert('endGame')
    try {
        quitUnityGame();
    } catch {
        console.log('quitUnityGame error: no game running');
    }
    localStorage.setItem('score', JSON.stringify(window.score));
    setPreviousStepDone();
    setStepDone('full');
    setCurrentStep('full2')
    instNum = REST[REST.length - 1];
    setPageInstruction(instNum);
}



window.endTrainingPerceptual = (sess) => {
    // alert('endTrainingPerceptual, session='+sess);
    console.log('endTrainingPerceptual, session='+sess);
    quitUnityGame();
    localStorage.setItem('score', JSON.stringify(window.score));
    // window.session++;

    setPreviousStepDone();
    setCurrentStep('training3');

    if (instNum == END) {
        hideButton();
        window.endFull();
        return;
    }

    showButton();
    instNum = REST[window.session];
    window.session++;
    localStorage.setItem('session', window.session);
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


