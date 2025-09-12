
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
const SURVEY = 14
const RISK = 15
const END = 16
const CONV = 0.00002;
const GAME_NUMBER = 5;

const COMP_LINK = 'aHR0cHM6Ly9hcHAucHJvbGlmaWMuY29tL3N1Ym1pc3Npb25zL2NvbXBsZXRlP2NjPUNKRllaSlk3';

const clickBlockedTime = 300;
const SURVEY_PHP = 'php/insert_feedback.php';
const RISK_PHP = 'php/insert_risk.php';
const RISK_TRIAL_PHP = 'php/insert_risk_trial.php';

// global variables mutable
var clickBlocked = false;
var blockingTimeout = null; // Track the timeout to clear it if needed
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

    // Check for direct access via URL parameters
    const gotoParam = getURLParams('goto');
    if (gotoParam === 'risk') {
        // Direct access to risk assessment
        // set all steps done
        setCurrentStep('end');
        setPreviousStepDone();
      
        // first step is risk assessment
        // go to general risk survey
        generalRiskSurveyPage();

        return;
    }

    // attach event listeners to buttons
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    
    // Set up initial handlers
    currentNextHandler = next;
    currentPrevHandler = prev;
    
    safelyReplaceEventListener(nextButton, 'click', null, currentNextHandler);
    safelyReplaceEventListener(prevButton, 'click', null, currentPrevHandler); 
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
    let steps = ['introduction', 'training1', 'training2', 'training3', 'full', 'full2', 'survey', 'sg', 'si', 'dospert', 'risk', 'end'];
    // get current step
    let currentStep = getCurrentStep();
    console.log(currentStep);
    
    // If no current step is found, don't proceed
    if (!currentStep) {
        console.log('No active step found, skipping setPreviousStepDone');
        return;
    }
    
    // set all steps before current step done
    steps.forEach((step) => {
        // check idx of step in steps
        let idx = steps.indexOf(step);
        console.log(idx, steps.indexOf(currentStep));
        if (idx < steps.indexOf(currentStep)) {
            setStepDone(step);
        }
    })
}

const getCurrentStep = () => {
    const activeStep = document.querySelector('.active-step');
    return activeStep ? activeStep.id : null;
}

const setCurrentStep = (step) => {
    const stepElement = document.querySelector('#' + step);
    if (!stepElement) {
        console.log(`Step element #${step} not found, skipping setCurrentStep`);
        return;
    }
    
    unsetAllSteps();
    // check if step is already active
    if (stepElement.classList.contains('active-step')) return;
    if (stepElement.classList.contains('done-step')) 
        unsetStep(step);
    stepElement.classList.add('active-step');
    setPreviousStepDone();
}
// unset all steps
const unsetAllSteps = () => {
    let steps = ['introduction', 'training1', 'training2', 'training3', 'full', 'full2', 'survey', 'sg', 'si', 'dospert', 'risk', 'end'];
    steps.forEach((step) => {
        unsetStep(step);
    })
}

const unsetStep = (step) => {
    const stepElement = document.querySelector('#' + step);
    if (stepElement) {
        stepElement.classList.remove('active-step');
        stepElement.classList.remove('done-step');
    }
}


const setStepDone = (step) => {
    const stepElement = document.querySelector('#' + step);
    if (!stepElement) return;
    
    if (stepElement.classList.contains('done-step')) return;
    if (stepElement.classList.contains('active-step')) 
        unsetStep(step);
    stepElement.classList.add('done-step');
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

const skipCurrentStep = async () => {
    try {
        if (instNum <= 2) {
            instNum = TUTORIAL;
            await setPageInstruction(instNum);
        } else if ([TUTORIAL, PERCEPTUAL_TRAINING, RL_TRAINING_1, RL_TRAINING_2,
             FULL, FULL2, SURVEY, RISK].includes(instNum)) {
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
                case SURVEY:
                    // Skip survey, go to risk assessment
                    setStepDone('survey');
                    instNum = RISK;
                    await setPageInstruction(instNum);
                    break;
                case RISK:
                    // Skip risk assessment, go to end
                    setStepDone('risk');
                    // Create dummy risk data for skip
                    window.riskData = {
                        prolificID: window.subID,
                        expName: 'FullPilot12_2',
                        choice_0: 0, choice_1: 0, choice_2: 0, choice_3: 0, choice_4: 0,
                        choice_5: 0, choice_6: 0, choice_7: 0, choice_8: 0, choice_9: 0,
                        selected: 0,
                        amount: 0
                    };
                    instNum = END;
                    await setPageInstruction(instNum);
                    break;
            }

        } else if (REST.includes(instNum)) {
            // alert('InstNum: '+instNum + '\n' + 'Session: '+window.session + '\n')
            instNum++;
            await setPageInstruction(instNum);
        }
    } catch (error) {
        console.error('Error in skipCurrentStep():', error);
        // Ensure clicks are not permanently blocked
        unblockClick();
    }
}

window.skip = skipCurrentStep;


const hidePanel = () => {
    document.querySelector('#panel').style.display = 'none';
}

// function used to naviguate between instructions pages as markdown
// using zero-md library
const next = async () => {
    if (clickBlocked) return;
    blockClick();
    
    try {
        instNum++;
        await setPageInstruction(instNum);
    } catch (error) {
        console.error('Error in next():', error);
        // Restore previous state and unblock clicks
        instNum--;
        unblockClick();
    }
}

const prev = async () => {
    if (clickBlocked) return;
    blockClick();
    
    try {
        instNum--;
        await setPageInstruction(instNum);
    } catch (error) {
        console.error('Error in prev():', error);
        // Restore previous state and unblock clicks
        instNum++;
        unblockClick();
    }
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
    // Clear any existing timeout to prevent conflicts
    if (blockingTimeout) {
        clearTimeout(blockingTimeout);
    }
    
    clickBlocked = true;
    blockingTimeout = setTimeout(() => { 
        clickBlocked = false;
        blockingTimeout = null;
    }, clickBlockedTime);
}

// Add function to manually unblock clicks in case of errors
const unblockClick = () => {
    if (blockingTimeout) {
        clearTimeout(blockingTimeout);
        blockingTimeout = null;
    }
    clickBlocked = false;
}

// Safe event listener management
const safelyReplaceEventListener = (element, eventType, oldHandler, newHandler) => {
    try {
        if (oldHandler) {
            element.removeEventListener(eventType, oldHandler);
        }
        if (newHandler) {
            element.addEventListener(eventType, newHandler);
        }
    } catch (error) {
        console.error('Error managing event listener:', error);
    }
}

// Keep track of current button handlers to avoid conflicts
let currentNextHandler = null;
let currentPrevHandler = null;

const checkConsent = () => {
    document.querySelectorAll('input').forEach(element => element.reportValidity());
    // if all checked
    if (document.querySelectorAll('input:checked').length == 4) {
        const nextButton = document.querySelector('#next-button');
        currentNextHandler = next;
        safelyReplaceEventListener(nextButton, 'click', checkConsent, currentNextHandler);
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
        const nextButton = document.querySelector('#next-button');
        currentNextHandler = next;
        safelyReplaceEventListener(nextButton, 'click', currentNextHandler, next);
    } else if (instNum == 1) {
        setCurrentStep('introduction');
        document.querySelector('#panel').innerHTML = consentPage;
        document.querySelector('#panel').style.display = 'block';
        // document.querySelector('#prev-button').style.display = 'none';
        showButton();
        const nextButton = document.querySelector('#next-button');
        currentNextHandler = checkConsent;
        safelyReplaceEventListener(nextButton, 'click', next, currentNextHandler);
        document.querySelector('#game').style.display = 'none';

    } else if (TUTORIAL == instNum ||
        PERCEPTUAL_TRAINING == instNum ||
        RL_TRAINING_1 == instNum || RL_TRAINING_2 == instNum ||
        FULL == instNum || FULL2 == instNum ||
        SURVEY == instNum || RISK == instNum ||
        SG == instNum || SI == instNum || DOSPERT == instNum) {

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
            case SURVEY:
                surveyPage();
                break;
            case SG:
                generalRiskSurveyPage();
                break;
            case SI:
                hypotheticalInvestmentPage();
                break;
            case DOSPERT:
                dospertScalePage();
                break;
            // case CS:
            //     choiceSetPage();
            //     break;
            case RISK:
                riskAssessmentPage();
                break;
        }
    } else if (instNum == END) {
        lastPage();

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
// --- New Behavioral Tasks --- //
const SG = 17; // General Risk Survey
const SI = 18; // Hypothetical Investment
const DOSPERT = 19; // DOSPERT Risk Scale
// const CS = 19; // Choice Set (Choice Overload) - DISABLED

// General Risk Survey (SG)
function generalRiskSurveyPage() {
    hideButton();
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    // Create a styled scale from 0 to 10
    let scale = `<nav class="no-space" style="margin: 20px 0;">`;
    for (let i = 0; i <= 10; i++) {
        const isFirst = i === 0;
        const isLast = i === 10;
        const roundClass = isFirst ? 'left-round' : isLast ? 'right-round' : 'no-round';
        scale += `
            <button id="sg-scale-${i}" class="scale border ${roundClass} max vertical small" data-value="${i}">
                <span>${i}</span>
            </button>`;
    }
    scale += `</nav>`;
    
    document.querySelector('#panel').innerHTML = `
        <div style="max-width: 800px; margin: auto;">
            <h2>General Risk Survey</h2>
            <div style="margin: 30px 0;">
                <p style="font-size: 1.1em; line-height: 1.6;">
                    How do you see yourself: are you generally a person who is <b style="color: var(--primary)">fully prepared to take risks</b> 
                    or do you <b style="color: var(--primary)">try to avoid taking risks</b>?
                </p>
                <p style="margin: 20px 0; text-align: center;">
                    Please select a number on the scale below:
                </p>
                <div style="display: flex; justify-content: space-between; margin: 10px 0 5px 0; font-size: 0.9em;">
                    <span><b>0</b> = Not at all willing to take risks</span>
                    <span><b>10</b> = Very willing to take risks</span>
                </div>
                ${scale}
                <div id="sg-error" style="color: var(--error); margin-top: 15px; text-align: center; font-weight: bold;"></div>
            </div>
        </div>
    `;
    
    // Add click handlers for scale buttons
    document.querySelectorAll('.scale[data-value]').forEach(button => {
        button.addEventListener('click', () => {
            // Remove selection from all buttons
            document.querySelectorAll('.scale[data-value]').forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            // Add selection to clicked button
            button.classList.add('fill-selected');
            window.sgSelectedValue = parseInt(button.getAttribute('data-value'));
            document.getElementById('sg-error').textContent = '';
        });
    });
    
    showButton();
    hidePrevButton();
    const nextButton = document.querySelector('#next-button');
    const handler = () => {
        if (window.sgSelectedValue === undefined) {
            document.getElementById('sg-error').textContent = 'Please select a value on the scale.';
            return;
        }
        document.getElementById('sg-error').textContent = '';
        window.sgResult = window.sgSelectedValue;
        setStepDone('sg');
        instNum = SI;
        setPageInstruction(instNum);
    };
    currentNextHandler = handler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, handler);
}

// Hypothetical Investment (SI)
function hypotheticalInvestmentPage() {
    hideButton();
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    document.querySelector('#panel').innerHTML = `
        <div style="max-width: 800px; margin: auto;">
            <h2>Hypothetical Investment</h2>
            <div style="margin: 30px 0;">
                <p style="font-size: 1.1em; line-height: 1.6;">
                    You are given a hypothetical endowment of <b style="color: var(--primary)">$100</b>. 
                    You may invest any amount (from $0 to $100) in a risky asset.
                </p>
                
                <div style="background-color: var(--surface-container); padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <h4 style="color: var(--primary); margin-top: 0;">The Investment Gamble:</h4>
                    <ul style="line-height: 1.8; margin: 0;">
                        <li>There is a <b>50% chance</b> your invested amount will be <b style="color: var(--primary)">tripled (3x)</b></li>
                        <li>There is a <b>50% chance</b> your invested amount will be <b style="color: var(--error)">lost completely ($0)</b></li>
                        <li>The amount <b>not invested is kept</b> regardless of the outcome</li>
                    </ul>
                </div>
                
                <div style="margin: 30px 0; text-align: center;">
                    <div class="field input label border large" style="max-width: 300px; margin: auto;">
                        <input id="si-invest" type="number" min="0" max="100" step="1" required>
                        <label>Investment amount ($)</label>
                    </div>
                    <div id="si-error" style="color: var(--error); margin-top: 15px; font-weight: bold;"></div>
                </div>
                
                <div id="si-result" style="margin-top: 30px;"></div>
            </div>
        </div>
    `;
    
    showButton();
    hidePrevButton();
    const nextButton = document.querySelector('#next-button');
    const handler = () => {
        const val = document.getElementById('si-invest').value;
        if (!/^\d+$/.test(val) || val < 0 || val > 100) {
            document.getElementById('si-error').textContent = 'Please enter a whole number from 0 to 100.';
            return;
        }
        document.getElementById('si-error').textContent = '';
        const invest = parseInt(val);
        const keep = 100 - invest;
        
        // Store investment data without showing outcome
        window.siResult = { invest, keep };
        
        /* COMMENTED OUT - Don't show lottery outcome
        // Simulate coin flip
        const win = Math.random() < 0.5;
        const result = win ? invest * 3 : 0;
        const total = keep + result;
        window.siResult = { invest, win, result, total };
        
        const resultColor = win ? 'var(--primary)' : 'var(--error)';
        const outcomeText = win ? 'WON' : 'LOST';
        
        document.getElementById('si-result').innerHTML = `
            <div style="background-color: var(--surface-container); padding: 25px; border-radius: 12px; text-align: center;">
                <h3 style="color: ${resultColor}; margin-top: 0;">You ${outcomeText} the gamble!</h3>
                <div style="display: flex; justify-content: space-around; margin: 20px 0; flex-wrap: wrap;">
                    <div style="margin: 10px; min-width: 120px;">
                        <div style="font-size: 0.9em; opacity: 0.8;">Invested</div>
                        <div style="font-size: 1.2em; font-weight: bold;">$${invest} → ${win ? '<span style="color: var(--primary)">$' + (invest*3) + '</span>' : '<span style="color: var(--error)">$0</span>'}</div>
                    </div>
                    <div style="margin: 10px; min-width: 120px;">
                        <div style="font-size: 0.9em; opacity: 0.8;">Kept Safe</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: var(--primary);">$${keep}</div>
                    </div>
                    <div style="margin: 10px; min-width: 120px;">
                        <div style="font-size: 0.9em; opacity: 0.8;">Total Payoff</div>
                        <div style="font-size: 1.4em; font-weight: bold; color: var(--primary);">$${total}</div>
                    </div>
                </div>
                <button id='si-continue' class='center-align medium-elevate' style="margin-top: 15px;">
                    <span>Continue</span>
                </button>
            </div>`;
        
        nextButton.style.display = 'none';
        document.getElementById('si-continue').onclick = () => {
            setStepDone('si');
            instNum = RISK; // Skip CS, go directly to RISK
            setPageInstruction(instNum);
        };
        */
        
        // Go directly to next step without showing outcome
        setStepDone('si');
        instNum = DOSPERT; // Go to DOSPERT scale
        setPageInstruction(instNum);
    };
    currentNextHandler = handler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, handler);
}

// DOSPERT Scale Page
function dospertScalePage() {
    hideButton();
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    const dospertQuestions = [
        "Admitting that your tastes are different from those of a friend.",
        "Going camping in the wilderness.",
        "Betting a day's income at the horse races.",
        "Investing 10% of your annual income in a moderate growth diversified fund.",
        "Drinking heavily at a social function.",
        "Taking some questionable deductions on your income tax return.",
        "Disagreeing with an authority figure on a major issue.",
        "Betting a day's income at a high-stake poker game.",
        "Having an affair with a married man/woman.",
        "Passing off somebody else's work as your own.",
        "Going down a ski run that is beyond your ability.",
        "Investing 5% of your annual income in a very speculative stock.",
        "Going whitewater rafting at high water in the spring.",
        "Betting a day's income on the outcome of a sporting event.",
        "Engaging in unprotected sex.",
        "Revealing a friend's secret to someone else.",
        "Driving a car without wearing a seat belt.",
        "Investing 10% of your annual income in a new business venture.",
        "Taking a skydiving class.",
        "Riding a motorcycle without a helmet.",
        "Choosing a career that you truly enjoy over a more secure one.",
        "Speaking your mind about an unpopular issue in a meeting at work.",
        "Sunbathing without sunscreen.",
        "Bungee jumping off a tall bridge.",
        "Piloting a small plane.",
        "Walking home alone at night in an unsafe area of town.",
        "Moving to a city far away from your extended family.",
        "Starting a new career in your mid-thirties.",
        "Leaving your young children alone at home while running an errand.",
        "Not returning a wallet you found that contains $200."
    ];
    
    // Create scale for each question
    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 1; i <= 7; i++) {
        const isFirst = i === 1;
        const isLast = i === 7;
        const roundClass = isFirst ? 'left-round' : isLast ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;
    
    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>1</b> = Extremely Unlikely</span>
            <span><b>4</b> = Not Sure</span>
            <span><b>7</b> = Extremely Likely</span>
        </div>`;
    
    let content = `
        <div style="display: flex; flex-direction: column; height: 100vh; max-width: 900px; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">DOSPERT Risk Scale</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    For each of the following statements, please indicate the likelihood that you would engage in the described activity or behavior if you were to find yourself in that situation.
                </p>
                <p style="font-size: 1em; margin-bottom: 20px;">
                    Provide a rating from <b>Extremely Unlikely</b> to <b>Extremely Likely</b>, using the following scale:
                </p>
                ${scaleLabels}
                <button type="button" id="fill-all-dospert" class="border small" style="margin-bottom: 15px; background-color: var(--surface-container); color: var(--on-surface); border: 1px solid var(--outline);">
                    <span>Fill All (Testing Feature)</span>
                </button>
            </div>
            
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="dospert-form" style="padding: 0;">`;
    
    // Add all questions
    dospertQuestions.forEach((question, index) => {
        content += `
            <div style="border: 2px solid var(--outline-variant); border-radius: 12px; padding: 20px; margin: 15px 0; background-color: var(--surface-container-low);">
                <div style="margin-bottom: 15px;">
                    <p style="font-size: 1em; line-height: 1.4; margin: 0;">
                        <b>Q${index + 1}:</b> ${question}
                    </p>
                </div>
                <div class="question-scale" data-question="${index}">
                    ${scale.replace(/data-value="/g, `data-question="${index}" data-value="`)}
                </div>
            </div>`;
    });
    
    content += `
                </form>
            </div>
            
            <div style="padding: 15px 20px; flex-shrink: 0; border-top: 1px solid var(--outline-variant); background-color: var(--surface-container);">
                <div id="dospert-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;
    
    document.querySelector('#panel').innerHTML = content;
    
    // Add click handlers for scale buttons
    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent form submission
            event.stopPropagation(); // Stop event bubbling
            
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            
            // Remove selection from all buttons in the same question
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            
            // Add selection to clicked button
            button.classList.add('fill-selected');
            
            // Store the response
            if (!window.dospertResponses) window.dospertResponses = {};
            window.dospertResponses[`q${questionIndex}`] = parseInt(value);
            
            // Clear error message
            document.getElementById('dospert-error').textContent = '';
        });
    });
    
    // Add click handler for "fill all" testing button
    document.getElementById('fill-all-dospert').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Clear all previous selections
        document.querySelectorAll('.scale-button').forEach(btn => {
            btn.classList.remove('fill-selected');
        });
        
        // Initialize responses object
        if (!window.dospertResponses) window.dospertResponses = {};
        
        // Fill all questions with random values between 1-7
        for (let questionIndex = 0; questionIndex < dospertQuestions.length; questionIndex++) {
            const randomValue = Math.floor(Math.random() * 7) + 1; // Random value 1-7
            
            // Store the response
            window.dospertResponses[`q${questionIndex}`] = randomValue;
            
            // Visually select the button
            const button = document.querySelector(`[data-question="${questionIndex}"][data-value="${randomValue}"]`);
            if (button) {
                button.classList.add('fill-selected');
            }
        }
        
        // Clear any error messages
        document.getElementById('dospert-error').textContent = '';
        
        // Show confirmation message briefly
        const originalText = document.getElementById('dospert-error').textContent;
        document.getElementById('dospert-error').style.color = 'var(--primary)';
        document.getElementById('dospert-error').textContent = 'All questions filled with random values for testing!';
        setTimeout(() => {
            document.getElementById('dospert-error').style.color = 'var(--error)';
            document.getElementById('dospert-error').textContent = originalText;
        }, 2000);
    });
    
    showButton();
    hidePrevButton();
    
    const nextButton = document.querySelector('#next-button');
    const submitHandler = () => {
        // Check if all questions have been answered
        if (!window.dospertResponses || Object.keys(window.dospertResponses).length < dospertQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < dospertQuestions.length; i++) {
                if (!window.dospertResponses || !window.dospertResponses[`q${i}`]) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('dospert-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            return;
        }
        
        document.getElementById('dospert-error').textContent = '';
        
        // Prepare data for storage
        const dospertData = {
            prolificID: window.subID,
            expName: 'FullPilot12_2',
            ...window.dospertResponses,
            timestamp: new Date().toISOString()
        };
        
        // Store globally
        window.dospertData = dospertData;
        
        // TODO: Send data to server if needed
        // sendDospertData(dospertData);
        
        setStepDone('dospert');
        instNum = RISK;
        setPageInstruction(instNum);
    };
    
    currentNextHandler = submitHandler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, submitHandler);
}

// Choice Set (CS) - Choice Overload - DISABLED
/*
function choiceSetPage() {
    hideButton();
    setCurrentStep('cs');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    // Randomly assign condition
    if (!window.csCondition) window.csCondition = Math.random() < 0.5 ? 1 : 2;
    const cond = window.csCondition;
    const options = cond === 1 ? [
        { key: 'A', label: 'Basic Plan: Standard Definition, 1 screen' },
        { key: 'B', label: 'Family Plan: High Definition, 4 screens' },
        { key: 'C', label: 'Premium Plan: Ultra HD / 4K, 4 screens, offline downloads' },
    ] : [
        { key: 'A', label: 'Basic Plan: Standard Definition, 1 screen' },
        { key: 'B', label: 'Basic+ Plan: Standard Definition, 2 screens' },
        { key: 'C', label: 'Ad-Free Basic: Standard Definition, 1 screen, no ads' },
        { key: 'D', label: 'Family Plan: High Definition, 4 screens' },
        { key: 'E', label: 'HD Plus Plan: High Definition, 2 screens, offline downloads' },
        { key: 'F', label: 'Mobile Plan: High Definition, 1 screen (mobile only)' },
        { key: 'G', label: 'Premium Plan: Ultra HD / 4K, 4 screens, offline downloads' },
        { key: 'H', label: 'International Plan: Ultra HD, 4 screens, includes international content' },
        { key: 'I', label: 'Annual Basic: Discounted yearly rate for Basic Plan' },
        { key: 'J', label: 'Annual Premium: Discounted yearly rate for Premium Plan' },
    ];
    
    const conditionText = cond === 1 ? 'Limited Choice (3 options)' : 'Extensive Choice (10 options)';
    const conditionColor = cond === 1 ? 'var(--primary)' : 'var(--tertiary)';
    
    let html = `
        <div style="max-width: 700px; margin: auto;">
            <h2>Streaming Service Choice</h2>
            <div style="margin: 30px 0;">
                <p style="font-size: 1.1em; line-height: 1.6;">
                    You are choosing a subscription to a <b style="color: var(--primary)">hypothetical streaming service</b>.
                </p>
                
                <div style="background-color: var(--surface-container); padding: 15px; border-radius: 12px; margin: 20px 0; text-align: center;">
                    <span style="font-size: 1.1em; font-weight: bold; color: ${conditionColor};">
                        Condition: ${conditionText}
                    </span>
                </div>
                
                <p style="margin: 20px 0;">Please select <b>one option</b> from the choices below:</p>
                
                <form id='cs-form'>
                    <div style="display: grid; gap: 12px; margin: 20px 0;">`;
    
    options.forEach(opt => {
        html += `
            <label class="choice-option" style="display: flex; align-items: center; padding: 12px; border: 2px solid var(--outline-variant); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                <input type='radio' name='cs-choice' value='${opt.key}' style="margin-right: 12px; transform: scale(1.2);">
                <span style="font-weight: 500;">
                    <span style="color: var(--primary); font-weight: bold;">${opt.key})</span> ${opt.label}
                </span>
            </label>`;
    });
    
    html += `
                        <label class="choice-option" style="display: flex; align-items: center; padding: 12px; border: 2px solid var(--outline-variant); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; margin-top: 20px; background-color: var(--surface-container-low);">
                            <input type='radio' name='cs-choice' value='none' style="margin-right: 12px; transform: scale(1.2);">
                            <span style="font-weight: 500; color: var(--error);">
                                <b>Make no choice</b>
                            </span>
                        </label>
                    </div>
                </form>
                
                <div id='cs-error' style='color: var(--error); margin-top: 15px; text-align: center; font-weight: bold;'></div>
            </div>
        </div>`;
    
    document.querySelector('#panel').innerHTML = html;
    
    // Add hover and selection effects to choice options
    document.querySelectorAll('.choice-option').forEach(label => {
        const input = label.querySelector('input');
        
        label.addEventListener('mouseenter', () => {
            if (!input.checked) {
                label.style.borderColor = 'var(--primary)';
                label.style.backgroundColor = 'var(--surface-bright)';
            }
        });
        
        label.addEventListener('mouseleave', () => {
            if (!input.checked) {
                label.style.borderColor = 'var(--outline-variant)';
                label.style.backgroundColor = 'transparent';
            }
        });
        
        input.addEventListener('change', () => {
            // Reset all labels
            document.querySelectorAll('.choice-option').forEach(lbl => {
                lbl.style.borderColor = 'var(--outline-variant)';
                lbl.style.backgroundColor = 'transparent';
            });
            
            // Highlight selected label
            if (input.checked) {
                label.style.borderColor = 'var(--primary)';
                label.style.backgroundColor = 'var(--surface-bright)';
            }
            
            document.getElementById('cs-error').textContent = '';
        });
    });
    
    showButton();
    hidePrevButton();
    const nextButton = document.querySelector('#next-button');
    const handler = () => {
        const val = document.querySelector('input[name="cs-choice"]:checked');
        if (!val) {
            document.getElementById('cs-error').textContent = 'Please select an option or "make no choice".';
            return;
        }
        document.getElementById('cs-error').textContent = '';
        window.csResult = { condition: cond, choice: val.value };
        setStepDone('cs');
        instNum = RISK;
        setPageInstruction(instNum);
    };
    currentNextHandler = handler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, handler);
}
*/

const riskAssessmentPage = () => {
    hideButton();
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    const lotteries = [
        { probHigh: 1, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 2, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 3, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 4, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 5, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 6, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 7, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 8, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 9, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 10, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } }
    ];
    
    function describePieSlice(cx, cy, r, startAngle, endAngle) {
        // Convert angles to radians
        const start = (Math.PI / 180) * startAngle;
        const end = (Math.PI / 180) * endAngle;
        // Start and end points
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        // Large arc flag
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        // Calculate center point of the slice for text positioning
        const middleAngle = (start + end) / 2;
        const textRadius = r * 0.6; // Position text at 60% of radius from center
        const textX = cx + textRadius * Math.cos(middleAngle);
        const textY = cy + textRadius * Math.sin(middleAngle);
        
        // Path
        const path = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        return {
            path: path,
            textX: textX,
            textY: textY
        };
    }
    
    const generateLotteryPair = (lottery, index) => {
        const probLow = 10 - lottery.probHigh;
        const highAngle = (lottery.probHigh / 10) * 360;
        
        return `
            <div style="border: 2px solid var(--outline-variant); border-radius: 12px; padding: 25px; margin: 20px 0; background-color: var(--surface-container-low); min-height: 200px;">
                <h4 style="text-align: center; margin-bottom: 25px; color: var(--primary); font-size: 1.2em;">Gamble ${index + 1}</h4>
                
                <div style="display: flex; justify-content: space-around; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <label class="lottery-choice" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 20px; border: 2px solid transparent; border-radius: 12px; transition: all 0.3s; min-width: 180px; flex: 1; max-width: 220px;">
                        <input type="radio" name="gamble_${index}" value="A" style="margin-bottom: 15px; transform: scale(1.4);">
                        <h5 style="margin: 10px 0; font-size: 1.1em;">Option A</h5>
                        <div style="position: relative; width: 120px; height: 120px; margin: 15px auto;">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="55" fill="none" stroke="white" stroke-width="2"></circle>
                                <path d="${describePieSlice(60, 60, 55, 0, highAngle).path}" fill="#1c1616"></path>
                                <path d="${describePieSlice(60, 60, 55, highAngle, 360).path}" fill="#908997"></path>
                                ${lottery.probHigh > 0 ? `<text x="${describePieSlice(60, 60, 55, 0, highAngle).textX}" y="${describePieSlice(60, 60, 55, 0, highAngle).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionA.high}</text>` : ''}
                                ${probLow > 0 ? `<text x="${describePieSlice(60, 60, 55, highAngle, 360).textX}" y="${describePieSlice(60, 60, 55, highAngle, 360).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionA.low}</text>` : ''}
                            </svg>
                        </div>
                    </label>
                    
                    <div style="text-align: center; padding: 20px;">
                        <strong style="color: var(--primary); font-size: 1.4em; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">OR</strong>
                    </div>
                    
                    <label class="lottery-choice" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 20px; border: 2px solid transparent; border-radius: 12px; transition: all 0.3s; min-width: 180px; flex: 1; max-width: 220px;">
                        <input type="radio" name="gamble_${index}" value="B" style="margin-bottom: 15px; transform: scale(1.4);">
                        <h5 style="margin: 10px 0; font-size: 1.1em;">Option B</h5>
                        <div style="position: relative; width: 120px; height: 120px; margin: 15px auto;">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="55" fill="none" stroke="white" stroke-width="2"></circle>
                                <path d="${describePieSlice(60, 60, 55, 0, highAngle).path}" fill="#1c1616"></path>
                                <path d="${describePieSlice(60, 60, 55, highAngle, 360).path}" fill="#908997"></path>
                                ${lottery.probHigh > 0 ? `<text x="${describePieSlice(60, 60, 55, 0, highAngle).textX}" y="${describePieSlice(60, 60, 55, 0, highAngle).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionB.high}</text>` : ''}
                                ${probLow > 0 ? `<text x="${describePieSlice(60, 60, 55, highAngle, 360).textX}" y="${describePieSlice(60, 60, 55, highAngle, 360).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionB.low}</text>` : ''}
                            </svg>
                        </div>
                    </label>
                </div>
            </div>`;
    };
    
    // Generate content for all lottery pairs
    let content = `
        <div style="display: flex; flex-direction: column; height: 100vh; max-width: 900px; margin: auto;">
            <div style="padding: 20px; text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 15px;">Lotteries</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px;">
                    Please choose one option from each gamble pair below. At the end, one gamble will be randomly selected and played for real.
                </p>
                
                <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 20px; height: 15px; background-color: #1c1616; margin-right: 8px; border: 1px solid white; border-radius: 2px;"></div>
                        <span style="font-size: 0.9em;">Probability of higher amount</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 20px; height: 15px; background-color: #908997; margin-right: 8px; border: 1px solid white; border-radius: 2px;"></div>
                        <span style="font-size: 0.9em;">Probability of lower amount</span>
                    </div>
                </div>
            </div>
            
            <div style="height: 45%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="risk-form" style="padding: 0;">`;
    
    // Add all lottery pairs
    lotteries.forEach((lottery, index) => {
        content += generateLotteryPair(lottery, index);
    });
    
    content += `
                </form>
            </div>
            
            <div style="padding: 15px 20px; flex-shrink: 0; border-top: 1px solid var(--outline-variant); background-color: var(--surface-container);">
                <div id="risk-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;
    
    document.querySelector('#panel').innerHTML = content;
    
    // Add hover and selection effects
    document.querySelectorAll('.lottery-choice').forEach(label => {
        const input = label.querySelector('input');
        
        label.addEventListener('mouseenter', () => {
            if (!input.checked) {
                label.style.borderColor = 'var(--primary)';
                label.style.backgroundColor = 'var(--surface-bright)';
            }
        });
        
        label.addEventListener('mouseleave', () => {
            if (!input.checked) {
                label.style.borderColor = 'transparent';
                label.style.backgroundColor = 'transparent';
            }
        });
        
        input.addEventListener('change', () => {
            // Reset all labels in the same gamble
            const gambleName = input.name;
            document.querySelectorAll(`input[name="${gambleName}"]`).forEach(otherInput => {
                const otherLabel = otherInput.closest('.lottery-choice');
                otherLabel.style.borderColor = 'transparent';
                otherLabel.style.backgroundColor = 'transparent';
            });
            
            // Highlight selected label
            if (input.checked) {
                label.style.borderColor = 'var(--primary)';
                label.style.backgroundColor = 'var(--surface-bright)';
            }
            
            document.getElementById('risk-error').textContent = '';
        });
    });
    
    showButton();
    hidePrevButton();
    
    const nextButton = document.querySelector('#next-button');
    const submitHandler = () => {
        // Check if all gambles have been selected
        const totalGambles = lotteries.length;
        const selectedGambles = [];
        
        for (let i = 0; i < totalGambles; i++) {
            const selected = document.querySelector(`input[name="gamble_${i}"]:checked`);
            if (!selected) {
                document.getElementById('risk-error').textContent = `Please select an option for Gamble ${i + 1}.`;
                return;
            }
            selectedGambles.push(selected.value === 'A' ? 0 : 1);
        }
        
        document.getElementById('risk-error').textContent = '';
        
        // Randomly select one gamble to play
        const selectedGambleIndex = Math.floor(Math.random() * totalGambles);
        const selectedChoice = selectedGambles[selectedGambleIndex];
        const selectedLottery = lotteries[selectedGambleIndex];
        
        // Play the selected gamble
        const probHigh = selectedLottery.probHigh / 10;
        const randomDraw = Math.random();
        
        let outcome, amount;
        if (selectedChoice === 0) { // Option A
            if (randomDraw < probHigh) {
                outcome = 'high';
                amount = selectedLottery.optionA.high;
            } else {
                outcome = 'low';
                amount = selectedLottery.optionA.low;
            }
        } else { // Option B
            if (randomDraw < probHigh) {
                outcome = 'high';
                amount = selectedLottery.optionB.high;
            } else {
                outcome = 'low';
                amount = selectedLottery.optionB.low;
            }
        }
        
        // Prepare risk data
        let riskData = { 
            'prolificID': window.subID, 
            'expName': 'FullPilot12_2',
            'selected': selectedGambleIndex,
            'amount': amount
        };
        
        // Store all choices
        selectedGambles.forEach((choice, index) => {
            riskData[`choice_${index}`] = choice;
        });
        
        // Store globally for end page
        window.riskData = riskData;
        
        // Send risk data
        sendRiskData(riskData);
        
        setStepDone('risk');
        instNum = END;
        setPageInstruction(instNum);
    };
    
    currentNextHandler = submitHandler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, submitHandler);
};

const riskAssessmentPage2 = () => {
    hideButton();
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    const lotteries = [
        { probHigh: 1, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 2, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 3, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 4, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 5, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 6, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 7, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 8, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 9, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } },
        { probHigh: 10, optionA: { high: 1.46, low: 1.17 }, optionB: { high: 2.81, low: 0.07 } }
    ];    // Holt and Laury 2002 risk assessment data
    
    // Initialize trial state
    let currentTrial = 0;
    let totalScore = 0;
    let riskData = { 'prolificID': window.subID, 'expName': 'FullPilot12_2' };
    
    function describePieSlice(cx, cy, r, startAngle, endAngle) {
        // Convert angles to radians
        const start = (Math.PI / 180) * startAngle;
        const end = (Math.PI / 180) * endAngle;
        // Start and end points
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        // Large arc flag
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        // Calculate center point of the slice for text positioning
        const middleAngle = (start + end) / 2;
        const textRadius = r * 0.6; // Position text at 60% of radius from center
        const textX = cx + textRadius * Math.cos(middleAngle);
        const textY = cy + textRadius * Math.sin(middleAngle);
        
        // Path
        const path = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        return {
            path: path,
            textX: textX,
            textY: textY
        };
    }
    
    const showTrial = (trialIndex) => {
        if (trialIndex >= lotteries.length) {
            // All trials completed
            finishRiskAssessment();
            return;
        }
        
        const lottery = lotteries[trialIndex];
        const probLow = 10 - lottery.probHigh;
        const highAngle = (lottery.probHigh / 10) * 360;
        
        let content = `
            <div style="max-width: 700px; margin: auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="background-color: #2a2a2a; padding: 10px; border-radius: 8px; margin: 10px 0;
                     display: flex; justify-content: space-between; align-items: center;">
                        <span>Total Score: £${totalScore.toFixed(2)}</span>
                        <span>Trial ${trialIndex + 1} of ${lotteries.length}</span>
                    </div>
                </div>
                
                <p style="text-align: center; margin-bottom: 30px;">
                    Choose one of the two lotteries below. Your choice will be played automatically and added to your score.
                </p>
                
                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-right: 20px;">
                        <div style="width: 20px; height: 15px; background-color: #1c1616; margin-right: 5px;
                        border: 1px solid white"></div>
                        <span>Probability of higher amount</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="width: 20px; height: 15px; background-color: #908997; margin-right: 5px;
                        border: 1px solid white"></div>
                        <span>Probability of lower amount</span>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-around; margin: 40px 0;">
                    <div class="lottery-option" data-option="A" style="text-align: center; cursor: pointer; padding: 20px; border: 2px solid transparent; border-radius: 10px; transition: all 0.3s;">
                        <h4>Option A</h4>
                        <div style="position: relative; width: 150px; height: 150px; margin: 0 auto;">
                            <svg width="150" height="150" viewBox="0 0 150 150">
                                <circle cx="75" cy="75" r="70" fill="none" stroke="white" stroke-width="2"></circle>
                                <path d="${describePieSlice(75, 75, 70, 0, highAngle).path}" fill="#1c1616"></path>
                                <path d="${describePieSlice(75, 75, 70, highAngle, 360).path}" fill="#908997"></path>
                                ${lottery.probHigh > 0 ? `<text x="${describePieSlice(75, 75, 70, 0, highAngle).textX}" y="${describePieSlice(75, 75, 70, 0, highAngle).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="14" font-weight="bold">£${lottery.optionA.high}</text>` : ''}
                                ${probLow > 0 ? `<text x="${describePieSlice(75, 75, 70, highAngle, 360).textX}" y="${describePieSlice(75, 75, 70, highAngle, 360).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="14" font-weight="bold">£${lottery.optionA.low}</text>` : ''}
                            </svg>
                        </div>
                    </div>
                    
                    <div class="lottery-option" data-option="B" style="text-align: center; cursor: pointer; padding: 20px; border: 2px solid transparent; border-radius: 10px; transition: all 0.3s;">
                        <h4>Option B</h4>
                        <div style="position: relative; width: 150px; height: 150px; margin: 0 auto;">
                            <svg width="150" height="150" viewBox="0 0 150 150">
                                <circle cx="75" cy="75" r="70" fill="none" stroke="white" stroke-width="2"></circle>
                                <path d="${describePieSlice(75, 75, 70, 0, highAngle).path}" fill="#1c1616"></path>
                                <path d="${describePieSlice(75, 75, 70, highAngle, 360).path}" fill="#908997"></path>
                                ${lottery.probHigh > 0 ? `<text x="${describePieSlice(75, 75, 70, 0, highAngle).textX}" y="${describePieSlice(75, 75, 70, 0, highAngle).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="14" font-weight="bold">£${lottery.optionB.high}</text>` : ''}
                                ${probLow > 0 ? `<text x="${describePieSlice(75, 75, 70, highAngle, 360).textX}" y="${describePieSlice(75, 75, 70, highAngle, 360).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="14" font-weight="bold">£${lottery.optionB.low}</text>` : ''}
                            </svg>
                        </div>
                    </div>
                </div>
            </div>`;

        document.querySelector('#panel').innerHTML = content;
        
        // Add click handlers for this trial
        document.querySelectorAll('.lottery-option').forEach(option => {
            option.addEventListener('mouseenter', () => {
                option.style.borderColor = 'var(--primary)';
                option.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            });
            
            option.addEventListener('mouseleave', () => {
                option.style.borderColor = 'transparent';
                option.style.backgroundColor = 'transparent';
            });
            
            option.addEventListener('click', () => {
                const selectedOption = option.getAttribute('data-option');
                playTrial(trialIndex, selectedOption);
            });
        });
    };
    
    const playTrial = async (trialIndex, selectedOption) => {
        const lottery = lotteries[trialIndex];
        const choice = selectedOption === 'A' ? 0 : 1;
        const probHigh = lottery.probHigh / 10; // Convert to decimal probability
        const randomDraw = Math.random();
        
        // Determine outcome
        let outcome, amount;
        if (choice === 0) { // Option A
            if (randomDraw < probHigh) {
                outcome = 'high';
                amount = lottery.optionA.high;
            } else {
                outcome = 'low';
                amount = lottery.optionA.low;
            }
        } else { // Option B
            if (randomDraw < probHigh) {
                outcome = 'high';
                amount = lottery.optionB.high;
            } else {
                outcome = 'low';
                amount = lottery.optionB.low;
            }
        }
        
        // Add to total score
        totalScore += amount;
        
        // Prepare trial data
        const trialData = {
            prolificID: window.subID,
            expName: 'FullPilot12_2',
            trial: trialIndex + 1,
            probHigh: lottery.probHigh,
            optionA_high: lottery.optionA.high,
            optionA_low: lottery.optionA.low,
            optionB_high: lottery.optionB.high,
            optionB_low: lottery.optionB.low,
            choice: choice, // 0=A, 1=B
            outcome: outcome, // 'high' or 'low'
            amount: amount,
            randomDraw: randomDraw,
            totalScore: totalScore,
            timestamp: new Date().toISOString()
        };
        
        // Store choice for summary
        riskData[`choice_${trialIndex}`] = choice;
        
        // Send trial data
        await sendRiskTrialData(trialData);
        
        // Show brief processing message
        document.querySelector('#panel').innerHTML = `
            <div style="text-align: center; margin: auto;">
                <h3>Processing...</h3>
                <div style="margin: 20px 0;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-radius: 50%; border-top: 4px solid #3498db; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>`;

        // Move to next trial after short delay
        setTimeout(() => {
            currentTrial++;
            showTrial(currentTrial);
        }, 1000);
    };
    
    const finishRiskAssessment = () => {
        // Add final data to riskData
        riskData.totalScore = totalScore;
        riskData.finalAmount = totalScore; // For final compensation
        
        // Store globally for end page
        window.riskData = riskData;
        
        // Send final summary data
        sendRiskData(riskData);
        
        setStepDone('risk');
        instNum = END;
        setPageInstruction(instNum);
    };
    
    // Start the first trial
    showTrial(currentTrial);
    hidePrevButton();
};

const lastPage = () => {
    hideButton();
    setPreviousStepDone();
    setStepDone('full');
    setStepDone('survey');
    setStepDone('risk');
    setCurrentStep('end')
    let points = window.score.reduce((a, b) => a + b, 0);
    // let points = window.score[window.score.length-1];
    let pounds = (points * CONV).toFixed(3);
    // now add the risk assessment amount to the points
    // convert both to float
    let riskAmount = window.riskData.finalAmount || window.riskData.totalScore || 0;
    let total = parseFloat(pounds) + parseFloat(riskAmount);
    // round to 2 decimal places
    total = total.toFixed(2);


    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Thank you!🚀</h1>
             <br>
             <h3>💰 You earned ${pounds} pounds from the space shooter game!💰</h3>
             <h3>💰 You also earned ${riskAmount.toFixed(2)} pounds in the survey phase! 💰</h3>
             <h3>💰 You earned ${total} pounds in total! 💰</h3>
             <br>
             <h4>Thank you for participating in our experiment!</h4>
             <h4>Please click the button below to complete your submission.</h4>
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
    setCurrentStep('survey')
    let points = window.score.reduce((a, b) => a + b, 0);
    // let points = window.score[window.score.length-1];
    let pounds = (points * CONV).toFixed(3);
    // now add the compensation amount to the points
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Congrats! 🚀</h1>
             <h3>💰 You earned ${points} points = ${pounds} pounds! 💰</h3>
             <br>
             <br>
             <p>Please click the next button and complete a short survey and risk assessment to finish your submission.</p>
             </div>
     `;
    const nextButton = document.querySelector('#next-button');
    const rewardNextHandler = () => {
        instNum = SURVEY;
        setPageInstruction(instNum);
    };
    
    currentNextHandler = rewardNextHandler;
    safelyReplaceEventListener(nextButton, 'click', next, currentNextHandler);
}


const sendFeedback = async (data, call = 0) => {
    let response = await fetch(SURVEY_PHP, {
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

const sendRiskData = async (data, call = 0) => {
    let response = await fetch(RISK_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('Risk assessment data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send risk assessment data');
            return;
        }
        // try again after 500ms
        setTimeout(() => {
            sendRiskData(data, call + 1);
        }, 500);
    }
}

const sendRiskTrialData = async (data, call = 0) => {
    let response = await fetch(RISK_TRIAL_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('Risk trial data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send risk trial data');
            return;
        }
        // try again after 500ms
        setTimeout(() => {
            sendRiskTrialData(data, call + 1);
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
    setCurrentStep('survey');
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

    
    const nextButton = document.querySelector('#next-button');
    const surveySubmitHandler = () => {
        if (checkSurvey()) {
            sendFeedback(dataToSend);
            setStepDone('survey');
            instNum = SG;
            setPageInstruction(instNum);
        }
    };
    
    currentNextHandler = surveySubmitHandler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, surveySubmitHandler);

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


