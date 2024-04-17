import { getInstructionPage, landingPage, restPage, consentPage } from "./modules/html_templates.mjs";
import {getURLParams, createCode} from "./modules/utils.mjs";
import {startUnityGame, quitUnityGame} from "./modules/game.mjs";

// globals
// -----------------------------//
var instNum = parseInt(localStorage.getItem('instNum')) || 0;
window.instNum = instNum;
// instNum coding
const REST = [6, 8]
const PERCEPTUAL_TRAINING = 5;
const RL_TRAINING = 7;
const FULL = 9;
const END = 10;
const CONV = 0.0035;

var clickBlocked = false;
var end = localStorage.getItem('end') == 'true';
const clickBlockedTime = 300;
var inst = [];
window.subID = 'not_set';
window.session = parseInt(localStorage.getItem('session')) || 0;
const COMP_LINK = 'aHR0cHM6Ly9hcHAucHJvbGlmaWMuY29tL3N1Ym1pc3Npb25zL2NvbXBsZXRlP2NjPUNKRllaSlk3';
const php = 'php/insert_feedback.php';
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
    // document.querySelector('#modal').style.display = 'block';
    document.querySelector('#modal-reload').showModal();
    // document.querySelector('body').classList.add('overlay');
    // document.querySelector('body').classList.add('blur');
    document.querySelector('#modal-confirm').addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    })
    document.querySelector('#modal-cancel').addEventListener('click', () => {
        document.querySelector('#modal-reload').close();
        // document.querySelector('body').classList.remove('overlay blur');
        // document.querySelector('body').classList.remove('overlay');
        // document.querySelector('body').classList.remove('blur');
    })
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
    if (instNum<=4) {
        instNum = PERCEPTUAL_TRAINING;
        setPageInstruction(instNum);
    } else if (instNum == PERCEPTUAL_TRAINING || instNum == RL_TRAINING || instNum == FULL) {
        alert('InstNum: '+instNum + '\n' + 'Session: '+window.session + '\n')
        switch (instNum) {
            case PERCEPTUAL_TRAINING:
                window.endTrainingPerceptual();
                // alert('endTrainingPerceptual')
                // window.startTrainingRL();
                break;
            case RL_TRAINING:
                // alert('endTrainingRL')
                window.endTrainingRL();
                break;
            case FULL:
                window.endGame();
                break;
        }
            
    } else if (REST.includes(instNum)) {
        // alert('InstNum: '+instNum + '\n' + 'Session: '+window.session + '\n')
        instNum++;
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
    setCurrentStep('full');
    setStepDone('introduction');
    setStepDone('training2');
    setStepDone('training1');
    document.querySelector('#game').style.display = 'block';
    startUnityGame('full');
}

const startTrainingPerceptual = () => {
    // hide instructions
    hidePanel();
    hideButton()
    // set step
    setCurrentStep('training1');
    setStepDone('introduction');
    // range from 1 to idx set done
    setPreviousStepDone();
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
        document.querySelector('#next-button').addEventListener('click', () => {

            document.querySelectorAll('input').forEach(element => element.reportValidity());
            // if all checked
             if (document.querySelectorAll('input:checked').length == 4) {
                document.querySelector('#next-button').addEventListener('click', next);
                next()
             }
        })
        document.querySelector('#game').style.display = 'none';
    } else if (PERCEPTUAL_TRAINING == instNum || RL_TRAINING == instNum || FULL == instNum) {
        setPreviousStepDone()
        switch (instNum) {
            case PERCEPTUAL_TRAINING:
                setCurrentStep('training1');
                // alert('startTrainingPerceptual')
                startTrainingPerceptual();
                break;
            case RL_TRAINING:
                setCurrentStep('training2');
                // alert('startTrainingRL')
                startTrainingRL();
                break;
            case FULL:
                setCurrentStep('full');
                // alert('startGame')
                startGame();
                break;
        }
    }  else if (instNum==END) {
        window.endGame();

    }
        else {
        setPreviousStepDone()
        document.querySelector('#game').style.display = 'none';
        quitUnityGame();
        document.querySelector('#panel').innerHTML = '<progress style="width:35%; margin: auto"></progress>';
        document.querySelector('#panel').style.display = 'flex';
        document.querySelector('#panel').innerHTML = await getInstructionPage(`src/instructions/inst_${instNum-1}.md`) // inst[instNum];
        showButton();
        if ((instNum == 0 ||instNum-1 == PERCEPTUAL_TRAINING || instNum-1 == RL_TRAINING || instNum-1 == FULL)) {
                hidePrevButton();
        }
        if (instNum < PERCEPTUAL_TRAINING) {
            setCurrentStep('introduction');
        }
    } 
}

window.endGame = () => {
    alert('endGame')
    try {
        quitUnityGame();
    } catch {
        console.log('quitUnityGame error: no game running');
    }
    localStorage.setItem('end', true);
    hideButton();
    setPreviousStepDone();
    setStepDone('full');
    setCurrentStep('end')
    addSurvey()
}

const lastPage = () => {
    hideButton();
    setPreviousStepDone();
    setStepDone('full');
    setCurrentStep('end')
    let points = window.score.reduce((a, b) => a + b, 0);
    let pounds = (points*CONV).toFixed(3);
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Thank you!🚀</h1>
             <h3>💰 You earned ${points} points = ${pounds} pounds! 💰</h3>
             <br>
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


const sendFeedback = async (data, call=0) => {
    let response = await fetch(php, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    if (response.ok) {
        return response.json();
    } else {
        // try again after 500ms
        setTimeout(() => {
            insertFeedback(data, call+1);
        }, 500 );
    }
}

const addSurvey = () => {
    document.querySelector('#game').style.display = 'none';
    let scale = `<nav class="no-space">
        <button id="" class="border left-round max vertical small">
          <span>Strongly Disagree</span>
        </button>
        <button id="" class="border no-round max vertical small">
          <span>Disagree<span>
        </button>
        <button id="" class="border no-round max vertical small">
          <span>Neutral<span>
        </button>
        <button id="" class="border no-round max vertical small">
          <span>Agree<span>
        </button>
        <button id="" class="border right-round max vertical small">
          <span>Strongly Agree</span>
        </button>
      </nav>`;
    
    let question1 = `In the <b style="color: var(--primary)">training 1</b> phase it was easy to tell which forcefield was the best`;
    let question2 = `In the <b style="color: var(--primary)">training 2</b> phase it was easy to tell which spaceship was the best`;
    let question3 = `In the <b style="color: var(--primary)">experiment</b> phase it was easy to tell which spaceship x forcefield was the best`;
    let questions = [question1, question2, question3];
    
    document.querySelector('#panel').innerHTML = '<h1>Survey</h1>';
    document.querySelector('#panel').style.display = 'block';
    
    questions.forEach((question, idx) => {
        let q = '<br><br>' + question + '<br>' + scale.replace(/id=""/g, `id="q${idx}"`) + '<br><br>';
        document.querySelector('#panel').innerHTML += q;   
    })
    
    document.querySelector('#panel').innerHTML += `Open feedback:<div class="field textarea border fill round">
    <textarea id="open"></textarea>
    <span class="helper">if you have any general remarks, put it here</span>
  </div>`
    
    document.querySelectorAll('nav button').forEach((button, idx) => {
        button.addEventListener('click', () => {
            let id = button.id;
            // get all buttons in the same row
            let buttons = document.querySelectorAll(`#${id}`);
            buttons.forEach((b) => {
                    b.classList.remove('fill-selected');
            })
            button.classList.add('fill-selected');
            // show next button if all questions are answered
            if (document.querySelectorAll('button.fill-selected').length == questions.length) {
                showButton();
                hidePrevButton();
            }

        })
    })
    
    // showButton();
    // hidePrevButton();
    // 
    document.querySelector('#next-button').removeEventListener('click', next);
   
    document.querySelector('#next-button').addEventListener('click', () => {
        // get all selected buttons
        let buttons = document.querySelectorAll('.fill-selected');
        let data = {
            'prolificID': window.subID,
            'open': document.querySelector('#open').innerText
        }
        
        buttons.forEach((button) => {
            data[button.id] = button.innerText;
        })
        
        // alert(JSON.stringify(data));

        sendFeedback(data);
        lastPage();
    })
    
}
    
window.endTrainingRL = () => {
    quitUnityGame();
    localStorage.setItem('score', JSON.stringify(window.score));
    
    setPreviousStepDone(); 
    setCurrentStep('full');

    hidePrevButton();
    showButton();
    instNum = REST[window.session];
    window.session++;
    localStorage.setItem('session', window.session);
    setPageInstruction(instNum);
    hidePrevButton();

}


window.endTrainingPerceptual = () => {
    quitUnityGame();
    localStorage.setItem('score', JSON.stringify(window.score));
    // window.session++;
    
    setPreviousStepDone(); 
    setCurrentStep('training2');

    if (instNum == END) {
        hideButton();
        window.endGame();
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


