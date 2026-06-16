
import { getInstructionPage, landingPage, restPage, consentPage } from "./modules/html_templates.mjs";
import { getURLParams, createCode, shuffle } from "./modules/utils.mjs";
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
const FULL2 = 13 // Game 5 (moved after surveys)

// Whether the Perceptual Training (training2) phase uses the partial-reward
// build (src/game/training2PR) instead of the standard one (src/game/training2)
const TRAINING2_PARTIAL_REWARD = true;
// const CFI = 14;      // RETIRED — replaced by new battery (kept for reference)
// const CFS = 15;
// const CS_TASK = 18;  // Color-Shape Task — retired (kept for reference)
const CFI = 14;   // kept defined so retired cfiPage()/sendCfiData stay valid
const CFS = 15;   // kept defined so retired cfsPage()/sendCfsData stay valid
const CS_TASK = 18; // kept defined so retired csTaskPage() stays valid

// New survey/task battery phases
const NFC   = 19; // Need for Cognition
const CFQ   = 20; // Cognitive Failures Questionnaire
const OCIR  = 21; // Obsessive-Compulsive Inventory-Revised
const BFI2S = 22; // Big Five Inventory-2 Short form
const WCST  = 23; // Wisconsin Card Sorting Test (NOT YET IMPLEMENTED)

// OLD two-item CFI/CFS order — commented out, replaced by 4-item battery below
// const _storedOrder = localStorage.getItem('surveyOrder');
// const surveyOrder = _storedOrder
//     ? JSON.parse(_storedOrder)
//     : (Math.random() < 0.5 ? [CFI, CFS] : [CFS, CFI]);
// if (!_storedOrder) localStorage.setItem('surveyOrder', JSON.stringify(surveyOrder));

// Randomise battery order once per participant; persist through refreshes
const BATTERY = [NFC, CFQ, OCIR, BFI2S];
const BATTERY_NAMES = { [NFC]: 'NFC', [CFQ]: 'CFQ', [OCIR]: 'OCIR', [BFI2S]: 'BFI2S' };
const _storedOrder = localStorage.getItem('surveyOrder');
const surveyOrder = _storedOrder
    ? JSON.parse(_storedOrder)
    : shuffle([...BATTERY]);
if (!_storedOrder) localStorage.setItem('surveyOrder', JSON.stringify(surveyOrder));

// Comma-separated battery order (e.g. "NFC,CFQ,OCIR,BFI2S") sent alongside
// each survey's data so the order can be recovered without joins.
const surveyOrderNames = surveyOrder.map(n => BATTERY_NAMES[n]).join(',');

// Returns the next phase after the survey that just completed:
// the next survey in surveyOrder, or END once the battery is done.
// TODO: route to WCST instead of END once WCST is implemented (Part 5).
function nextInBattery(currentPhase) {
    const i = surveyOrder.indexOf(currentPhase);
    return (i >= 0 && i < surveyOrder.length - 1) ? surveyOrder[i + 1] : END;
}

// Returns the page-render function for a given battery phase constant.
function pageForBatteryPhase(phase) {
    switch (phase) {
        case NFC:   return nfcPage;
        case CFQ:   return cfqPage;
        case OCIR:  return ociRPage;
        case BFI2S: return bfi2sPage;
        default:    return null;
    }
}

// const SG = 13; // General Risk Survey (after DOSPERT)
const SURVEY = 16 // Post-game survey (after FULL2)
const END = 17
const CONV = 0.00002;
const GAME_NUMBER = 5;
const COMP_LINK = 'aHR0cHM6Ly9hcHAucHJvbGlmaWMuY29tL3N1Ym1pc3Npb25zL2NvbXBsZXRlP2NjPUNKRllaSlk3';

const clickBlockedTime = 300;
const SURVEY_PHP = 'php/insert_feedback.php';
const CFI_PHP = 'php/insert_cfi.php';
const CFS_PHP = 'php/insert_cfs.php';
const NFC_PHP   = 'php/insert_nfc.php';
const CFQ_PHP   = 'php/insert_cfq.php';
const OCIR_PHP  = 'php/insert_ocir.php';
const BFI2S_PHP = 'php/insert_bfi2s.php';
// const WCST_PHP  = 'php/insert_wcst.php'; // WCST not yet implemented

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
        document.querySelector('#skip').addEventListener('click', () => {
            console.log('=== SKIP BUTTON CLICKED ===');
            console.log('About to call skipCurrentStep');
            skipCurrentStep();
        });

    // DEBUG mode
    if (getURLParams('DEBUG') === '1') {
        document.getElementById('skip').style.display = '';
        document.getElementById('reload').style.display = '';

        // Map stepper step IDs to instNums
        const stepMap = {
            'introduction': 0,
            'training1':    RL_TRAINING_1,
            'training2':    PERCEPTUAL_TRAINING,
            'training3':    RL_TRAINING_2,
            'full':         FULL,
            'full2':        FULL2,
            'survey':       surveyOrder[0],
            // 'cs-task':   CS_TASK, // RETIRED — Color-Shape Task no longer in flow
            'end':          END,
        };
        Object.entries(stepMap).forEach(([id, num]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.cursor = 'pointer';
            el.title = `DEBUG: jump to step ${num}`;
            el.addEventListener('click', () => {
                instNum = num;
                setPageInstruction(instNum);
            });
        });
    }
    
   // Check for direct access via URL parameters
    const gotoParam = getURLParams('goto');
    if (gotoParam === 'survey') {
        // Direct access to risk assessment
        // set all steps done
        setCurrentStep('survey');
        setPreviousStepDone();
      
        // first survey is determined randomly (surveyOrder)
        // OLD two-item CFI/CFS dispatch — commented out, see new battery dispatch below
        // surveyOrder[0] === CFI ? cfiPage() : cfsPage();
        pageForBatteryPhase(surveyOrder[0])();
        setPageInstruction(surveyOrder[0]);
        return;
    }
    if (getURLParams('end') === '1') {
        lastPage();
        return;
    }
    if (end) {
        if (instNum >= END) {
            lastPage();
        } else {
            window.endFull2();
        }
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
    startUnityGame('all_or_none');
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
    startUnityGame('partial_reward');
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
    startUnityGame(TRAINING2_PARTIAL_REWARD ? 'training2PR' : 'training2');
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
    const fromURL = getURLParams('prolificID');
    if (fromURL) {
        window.subID = fromURL;
        localStorage.setItem('subID', fromURL);
    } else {
        window.subID = localStorage.getItem('subID') || 'random-' + createCode(5);
        localStorage.setItem('subID', window.subID);
    }
    document.querySelector('.subID').innerHTML = 'id: ' + window.subID;
}

// ------------------------------ UI Managment ------------------------------ //
const setPreviousStepDone = () => {
    let steps = ['introduction', 'training1', 'training2', 'training3', 'full', 'survey', 'full2', 'cs-task', 'end'];
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
    let steps = ['introduction', 'training1', 'training2', 'training3', 'full', 'survey', 'full2', 'cs-task', 'end'];
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
    console.log('=== SKIP FUNCTION CALLED ===');
    console.log('Current instNum:', instNum);
    console.log('Current step element:', getCurrentStep());
    try {
        if (instNum <= 2) {
            instNum = TUTORIAL;
            await setPageInstruction(instNum);
        } else if ([TUTORIAL, PERCEPTUAL_TRAINING, RL_TRAINING_1, RL_TRAINING_2,
             FULL, FULL2, SURVEY, NFC, CFQ, OCIR, BFI2S].includes(instNum)) {
             // CFI, CFS, CS_TASK — RETIRED, removed from this list
                console.log('=== ENTERING GAME/SURVEY SKIP SECTION ===');
                console.log('instNum value:', instNum);
                console.log('SURVEY constant value:', SURVEY);
                console.log('instNum === SURVEY:', instNum === SURVEY);
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
                    // Skip FULL game, go to instruction page before FULL2
                    // setStepDone('full');
                    // instNum = REST[REST.length - 1]; // 12, shows inst_11.md
                    // await setPageInstruction(instNum);
                    break;
                case FULL2:
                    window.endFull2();
                    // Skip FULL2 game, go to instruction page before SURVEY
                    // setStepDone('full2');
                    // instNum = SURVEY;
                    // await setPageInstruction(instNum);
                    break;
                case SURVEY:
                    // Skip post-game survey, go to end
                    console.log('Skipping from SURVEY to END, instNum:', instNum);
                    setStepDone('final-survey');
                    instNum = END;
                    console.log('About to call setPageInstruction with END:', END);
                    await setPageInstruction(instNum);
                    break;
                // case CFI: // RETIRED
                //     setStepDone('survey');
                //     instNum = surveyOrder.indexOf(CFI) === 0 ? CFS : CS_TASK;
                //     await setPageInstruction(instNum);
                //     break;
                // case CFS: // RETIRED
                //     setStepDone('survey');
                //     instNum = surveyOrder.indexOf(CFS) === 0 ? CFI : CS_TASK;
                //     await setPageInstruction(instNum);
                //     break;
                // case CS_TASK: // RETIRED
                //     setStepDone('cs-task');
                //     instNum = END;
                //     await setPageInstruction(instNum);
                //     break;
                case NFC:
                case CFQ:
                case OCIR:
                case BFI2S:
                    setStepDone('survey');
                    instNum = nextInBattery(instNum);
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

// OLD two-item CFI/CFS debug helpers — commented out, see new battery versions below
// window.surveyOrderInfo = () => {
//     const names = { [CFI]: 'CFI', [CFS]: 'CFS' };
//     console.log(
//         `%cSurvey order: ${surveyOrder.map(n => names[n]).join(' → ')} → CS_TASK`,
//         'color: cyan; font-weight: bold'
//     );
//     console.log('surveyOrder array:', surveyOrder);
//     console.log('localStorage surveyOrder:', localStorage.getItem('surveyOrder'));
// };
//
// window.setSurveyOrder = (order) => {
//     const next = order === 'CFS_FIRST' ? [CFS, CFI] : [CFI, CFS];
//     localStorage.setItem('surveyOrder', JSON.stringify(next));
//     console.log(`surveyOrder set to ${next.map(n => ({[CFI]:'CFI',[CFS]:'CFS'}[n])).join(' → ')}. Reload to apply.`);
// };

/**
 * window.surveyOrderInfo()  — log the current battery order to the console
 * window.setSurveyOrder([NFC, CFQ, OCIR, BFI2S])  — force an order for testing
 */
window.surveyOrderInfo = () => {
    console.log(
        `%cBattery order: ${surveyOrder.map(n => BATTERY_NAMES[n]).join(' → ')}`,
        'color: cyan; font-weight: bold'
    );
    console.log('surveyOrder array:', surveyOrder);
    console.log('localStorage surveyOrder:', localStorage.getItem('surveyOrder'));
};

window.setSurveyOrder = (order) => {
    localStorage.setItem('surveyOrder', JSON.stringify(order));
    console.log(`surveyOrder set to ${JSON.stringify(order)}. Reload to apply.`);
};

window.fill = () => {
    const surveys = [
        { formId: 'cfi-form',     responseKey: 'cfiResponses',     minScale: 1, maxScale: 7, errorId: 'cfi-error' },
        { formId: 'cfs-form',     responseKey: 'cfsResponses',     minScale: 1, maxScale: 6, errorId: 'cfs-error' },
        { formId: 'dospert-form', responseKey: 'dospertResponses', minScale: 1, maxScale: 7, errorId: 'dospert-error' },
        { formId: 'nfc-form',     responseKey: 'nfcResponses',     minScale: 1, maxScale: 5, errorId: 'nfc-error' },
        { formId: 'cfq-form',     responseKey: 'cfqResponses',     minScale: 0, maxScale: 4, errorId: 'cfq-error' },
        { formId: 'ocir-form',    responseKey: 'ociRResponses',    minScale: 0, maxScale: 4, errorId: 'ocir-error' },
        { formId: 'bfi2s-form',   responseKey: 'bfi2sResponses',   minScale: 1, maxScale: 5, errorId: 'bfi2s-error' },
    ];

    const active = surveys.find(s => document.getElementById(s.formId));
    if (!active) { console.warn('No survey form found on page.'); return; }

    document.querySelectorAll('.scale-button').forEach(btn => btn.classList.remove('fill-selected'));
    if (!window[active.responseKey]) window[active.responseKey] = {};

    const groups = document.querySelectorAll('.question-scale');
    groups.forEach(group => {
        const questionIndex = group.getAttribute('data-question');
        const randomValue = active.minScale + Math.floor(Math.random() * (active.maxScale - active.minScale + 1));
        window[active.responseKey][`q${questionIndex}`] = randomValue;
        const button = group.querySelector(`[data-value="${randomValue}"]`);
        if (button) button.classList.add('fill-selected');
    });

    const errorEl = document.getElementById(active.errorId);
    if (errorEl) {
        errorEl.style.color = 'var(--primary)';
        errorEl.textContent = 'All questions filled with random values for testing!';
        setTimeout(() => {
            errorEl.style.color = 'var(--error)';
            errorEl.textContent = '';
        }, 2000);
    }
};


const hidePanel = () => {
    document.querySelector('#panel').style.display = 'none';
}

// function used to naviguate between instructions pages as markdown
// using zero-md library
const next = async () => {
    if (clickBlocked) return;
    blockClick();
    
    try {
        // If there's a page-specific action, use it; otherwise use default navigation
        if (currentAction && typeof currentAction === 'function') {
            await currentAction();
        } else {
            // Default navigation behavior
            instNum++;
            await setPageInstruction(instNum);
        }
    } catch (error) {
        console.error('Error in next():', error);
        // Restore previous state and unblock clicks
        if (!currentAction) {
            instNum--;
        }
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

// Global action function for page-specific next button behavior
let currentAction = null;

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
    // Reset any page-specific action when changing pages
    currentAction = null;
    
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
        SURVEY == instNum ||
        // CFI == instNum || CFS == instNum || CS_TASK == instNum || // RETIRED
        NFC == instNum || CFQ == instNum ||
        OCIR == instNum || BFI2S == instNum) {

    switch (instNum) {
            case TUTORIAL:
                // alert('tutorial')
                setPreviousStepDone()
                setCurrentStep('introduction');
                startTutorial();
                break;
            case PERCEPTUAL_TRAINING:
                setPreviousStepDone()
                setCurrentStep('training2');
                // alert('startTrainingPerceptual')
                startTrainingPerceptual();
                break;
            case RL_TRAINING_1:
                setPreviousStepDone()
                setCurrentStep('training1');
                // alert('startTrainingRL')
                startTrainingRL(1);
                break;
            case RL_TRAINING_2:
                setPreviousStepDone()
                setCurrentStep('training3');
                startTrainingRL(3);
                break;
            case FULL:
                setPreviousStepDone()
                setCurrentStep('full');
                // alert('startGame')
                startFull();
                break;
            case FULL2:
                setPreviousStepDone()
                setCurrentStep('full2');
                // alert('startGame')
                startFull2();
                break;
            case SURVEY:
                setPreviousStepDone()
                setCurrentStep('final-survey');
                surveyPage();
                break;
            // case SG:
            //     setPreviousStepDone()
            //     setCurrentStep('survey');
            //     generalRiskSurveyPage();
            //     break;
            // case SI:
            //     hypotheticalInvestmentPage();
            //     break;
            // case CFI: // RETIRED
            //     setPreviousStepDone();
            //     setCurrentStep('survey');
            //     cfiPage();
            //     break;
            // case CFS: // RETIRED
            //     setPreviousStepDone();
            //     setCurrentStep('survey');
            //     cfsPage();
            //     break;
            // case CS_TASK: // RETIRED
            //     setPreviousStepDone();
            //     setCurrentStep('cs-task');
            //     csTaskPage();
            //     break;
            case NFC:
            case CFQ:
            case OCIR:
            case BFI2S:
                setPreviousStepDone();
                setCurrentStep('survey');
                pageForBatteryPhase(instNum)();
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
        
        // Special handling for inst_11 (instNum = 12): next should go to FULL2
        // if (instNum == 12) {
        //     currentAction = () => {
        //         instNum = FULL2;
        //         setPageInstruction(instNum);
        //     };
        // }
    }
}

// ------------------------------ END ------------------------------ //
// --- New Behavioral Tasks --- //
// SG and DOSPERT constants moved to main constants section above
// const SI = 18; // Hypothetical Investment
// const CS = 19; // Choice Set (Choice Overload) - DISABLED

// General Risk Survey (SG) - COMMENTED OUT
/*
function generalRiskSurveyPage() {
    hideButton();
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
    
    // Set page-specific action
    currentAction = () => {
        if (window.sgSelectedValue === undefined) {
            document.getElementById('sg-error').textContent = 'Please select a value on the scale.';
            unblockClick();
            return;
        }
        document.getElementById('sg-error').textContent = '';
        window.sgResult = window.sgSelectedValue;
        
        // Prepare data for sending
        const generalRiskData = {
            prolificID: window.subID,
            expName: 'Within',
            riskScore: window.sgSelectedValue,
            timestamp: new Date().toISOString()
        };
        
        // Send data to server
        sendGeneralRiskData(generalRiskData);
        
        setStepDone('survey');
        instNum = RISK; // Go to Risk Assessment next
        setPageInstruction(instNum);
    };
}
*/

// Hypothetical Investment (SI) - COMMENTED OUT
/*
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
        
        // COMMENTED OUT - Don't show lottery outcome
        // Simulate coin flip
        // const win = Math.random() < 0.5;
        // const result = win ? invest * 3 : 0;
        // const total = keep + result;
        // window.siResult = { invest, win, result, total };
        
        // const resultColor = win ? 'var(--primary)' : 'var(--error)';
        // const outcomeText = win ? 'WON' : 'LOST';
        
        // document.getElementById('si-result').innerHTML = `
        //     <div style="background-color: var(--surface-container); padding: 25px; border-radius: 12px; text-align: center;">
        //         <h3 style="color: ${resultColor}; margin-top: 0;">You ${outcomeText} the gamble!</h3>
        //         <div style="display: flex; justify-content: space-around; margin: 20px 0; flex-wrap: wrap;">
        //             <div style="margin: 10px; min-width: 120px;">
        //                 <div style="font-size: 0.9em; opacity: 0.8;">Invested</div>
        //                 <div style="font-size: 1.2em; font-weight: bold;">$${invest} → ${win ? '<span style="color: var(--primary)">$' + (invest*3) + '</span>' : '<span style="color: var(--error)">$0</span>'}</div>
        //             </div>
        //             <div style="margin: 10px; min-width: 120px;">
        //                 <div style="font-size: 0.9em; opacity: 0.8;">Kept Safe</div>
        //                 <div style="font-size: 1.2em; font-weight: bold; color: var(--primary);">$${keep}</div>
        //             </div>
        //             <div style="margin: 10px; min-width: 120px;">
        //                 <div style="font-size: 0.9em; opacity: 0.8;">Total Payoff</div>
        //                 <div style="font-size: 1.4em; font-weight: bold; color: var(--primary);">$${total}</div>
        //             </div>
        //         </div>
        //         <button id='si-continue' class='center-align medium-elevate' style="margin-top: 15px;">
        //             <span>Continue</span>
        //         </button>
        //     </div>`;
        
        // nextButton.style.display = 'none';
        // document.getElementById('si-continue').onclick = () => {
        //     setStepDone('si');
        //     instNum = RISK; // Skip CS, go directly to RISK
        //     setPageInstruction(instNum);
        // };
        
        
        // Go directly to next step without showing outcome
        setStepDone('si');
        instNum = DOSPERT; // Go to DOSPERT scale
        setPageInstruction(instNum);
    };
    currentNextHandler = handler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, handler);
}
*/

// CFI Page (Cognitive Flexibility Inventory — 20 items, 7-point scale)
function cfiPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';

    const cfiQuestions = [
        'I am good at "sizing up" situations.',
        "I have a hard time making decisions when faced with difficult situations.",
        "I consider multiple options before making a decision.",
        "When I encounter difficult situations, I feel like I am losing control.",
        "I like to look at difficult situations from many different angles.",
        "I seek additional information not immediately available before attributing causes to behavior.",
        "When encountering difficult situations, I become so stressed that I can not think of a way to resolve the situation.",
        "I try to think about things from another person's point of view.",
        "I find it troublesome that there are so many different ways to deal with difficult situations.",
        "I am good at putting myself in others' shoes.",
        "When I encounter difficult situations, I just don't know what to do.",
        "It is important to look at difficult situations from many angles.",
        "When in difficult situations, I consider multiple options before deciding how to behave.",
        "I often look at a situation from different viewpoints.",
        "I am capable of overcoming the difficulties in life that I face.",
        "I consider all the available facts and information when attributing causes to behavior.",
        "I feel I have no power to change things in difficult situations.",
        "When I encounter difficult situations, I stop and try to think of several ways to resolve it.",
        "I can think of more than one way to resolve a difficult situation I'm confronted with.",
        "I consider multiple options before responding to difficult situations."
    ];

    // 0-indexed positions that are reverse-scored: items 2,4,7,9,11,17 (1-indexed)
    const reverseItems = [1, 3, 6, 8, 10, 16];

    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 1; i <= 7; i++) {
        const roundClass = i === 1 ? 'left-round' : i === 7 ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;

    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>1</b> = Strongly Disagree</span>
            <span><b>4</b> = Neutral</span>
            <span><b>7</b> = Strongly Agree</span>
        </div>`;

    let content = `
        <div style="display: flex; flex-direction: column; height: 130vh; max-width: 90%; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">${surveyOrder.indexOf(CFI) === 0 ? 'Survey 1' : 'Survey 2'}</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    Please use the scale below to indicate the extent to which you agree or disagree with the following statements.
                </p>
                ${scaleLabels}
            </div>
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="cfi-form" style="padding: 0;">`;

    cfiQuestions.forEach((question, index) => {
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
                <div id="cfi-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            button.classList.add('fill-selected');
            if (!window.cfiResponses) window.cfiResponses = {};
            window.cfiResponses[`q${questionIndex}`] = parseInt(value);
            document.getElementById('cfi-error').textContent = '';
        });
    });

    showButton();
    hidePrevButton();

    const submitHandler = () => {
        if (!window.cfiResponses || Object.keys(window.cfiResponses).length < cfiQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < cfiQuestions.length; i++) {
                if (!window.cfiResponses || window.cfiResponses[`q${i}`] === undefined) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('cfi-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            unblockClick();
            return;
        }
        document.getElementById('cfi-error').textContent = '';

        let score = 0;
        for (let i = 0; i < cfiQuestions.length; i++) {
            const raw = window.cfiResponses[`q${i}`];
            score += reverseItems.includes(i) ? 8 - raw : raw;
        }

        const cfiData = {
            prolificID: window.subID,
            expName: 'Within',
            timestamp: new Date().toISOString(),
            ...window.cfiResponses            
        };
        sendCfiData(cfiData);

        instNum = surveyOrder.indexOf(CFI) === 0 ? CFS : CS_TASK;
        setPageInstruction(instNum);
    };
    currentAction = submitHandler;
}

// CFS Page (Cognitive Flexibility Scale — 12 items, 6-point scale)
function cfsPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';

    const cfsQuestions = [
        "I can communicate an idea in many different ways.",
        "I avoid new and unusual situations.",
        "I feel like I never get to make decisions.",
        "I can find workable solutions to seemingly unsolvable problems.",
        "I seldom have choices when deciding how to behave.",
        "I am willing to work at creative solutions to problems.",
        "In any given situation, I am able to act appropriately.",
        "My behavior is a result of conscious decisions that I make.",
        "I have many possible ways of behaving in any given situation.",
        "I have difficulty using my knowledge on a given topic in real life situations.",
        "I am willing to listen and consider alternatives for handling a problem.",
        "I have the self-confidence necessary to try different ways of behaving."
    ];

    // 0-indexed positions that are reverse-scored: items 2,3,5,10 (1-indexed)
    const reverseItems = [1, 2, 4, 9];

    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 1; i <= 6; i++) {
        const roundClass = i === 1 ? 'left-round' : i === 6 ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;

    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>1</b> = Strongly Disagree</span>
            <span><b>6</b> = Strongly Agree</span>
        </div>`;

    let content = `
        <div style="display: flex; flex-direction: column; height: 130vh; max-width: 90%; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">${surveyOrder.indexOf(CFS) === 0 ? 'Survey 1' : 'Survey 2'}</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    The following statements deal with your beliefs and feelings about your own behavior. Read each statement and respond by selecting the number that best represents your agreement with each statement.
                </p>
                ${scaleLabels}
            </div>
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="cfs-form" style="padding: 0;">`;

    cfsQuestions.forEach((question, index) => {
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
                <div id="cfs-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            button.classList.add('fill-selected');
            if (!window.cfsResponses) window.cfsResponses = {};
            window.cfsResponses[`q${questionIndex}`] = parseInt(value);
            document.getElementById('cfs-error').textContent = '';
        });
    });

    showButton();
    hidePrevButton();

    const submitHandler = () => {
        if (!window.cfsResponses || Object.keys(window.cfsResponses).length < cfsQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < cfsQuestions.length; i++) {
                if (!window.cfsResponses || window.cfsResponses[`q${i}`] === undefined) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('cfs-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            unblockClick();
            return;
        }
        document.getElementById('cfs-error').textContent = '';

        let score = 0;
        for (let i = 0; i < cfsQuestions.length; i++) {
            const raw = window.cfsResponses[`q${i}`];
            score += reverseItems.includes(i) ? 7 - raw : raw;
        }

        const cfsData = {
            prolificID: window.subID,
            expName: 'Within',
            timestamp: new Date().toISOString(),
            first: surveyOrder[0] === CFS ? 1 : 0,
            ...window.cfsResponses
        };
        sendCfsData(cfsData);

        instNum = surveyOrder.indexOf(CFS) === 0 ? CFI : CS_TASK;
        setPageInstruction(instNum);
    };
    currentAction = submitHandler;
}

// NfC Page (Need for Cognition — 18 items, 5-point scale)
function nfcPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';

    const nfcQuestions = [
        "I would prefer complex to simple problems.",
        "I like to have the responsibility of handling a situation that requires a lot of thinking.",
        "Thinking is not my idea of fun.",
        "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.",
        "I try to anticipate and avoid situations where there is a likely chance I will have to think in depth about something.",
        "I find satisfaction in deliberating hard and for long hours.",
        "I only think as hard as I have to.",
        "I prefer to think about small, daily projects rather than long-term ones.",
        "I like tasks that require little thought once I've learned them.",
        "The idea of relying on thought to make my way to the top appeals to me.",
        "I really enjoy a task that involves coming up with new solutions to problems.",
        "Learning new ways to think doesn't excite me very much.",
        "I prefer my life to be filled with puzzles that I must solve.",
        "The notion of thinking abstractly appeals to me.",
        "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.",
        "I feel relief rather than satisfaction after completing a task that required a lot of mental effort.",
        "It's enough for me that something gets the job done; I don't care how or why it works.",
        "I usually end up deliberating about issues even when they do not affect me personally."
    ];

    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 1; i <= 5; i++) {
        const roundClass = i === 1 ? 'left-round' : i === 5 ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;

    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>1</b> = Extremely uncharacteristic of me</span>
            <span><b>3</b> = Uncertain</span>
            <span><b>5</b> = Extremely characteristic of me</span>
        </div>`;

    let content = `
        <div style="display: flex; flex-direction: column; height: 130vh; max-width: 90%; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">Survey ${surveyOrder.indexOf(NFC) + 1} of ${surveyOrder.length}</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    For each of the statements below, please indicate to what extent the statement is characteristic of you, using the scale provided.
                </p>
                ${scaleLabels}
            </div>
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="nfc-form" style="padding: 0;">`;

    nfcQuestions.forEach((question, index) => {
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
                <div id="nfc-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            button.classList.add('fill-selected');
            if (!window.nfcResponses) window.nfcResponses = {};
            window.nfcResponses[`q${questionIndex}`] = parseInt(value);
            document.getElementById('nfc-error').textContent = '';
        });
    });

    showButton();
    hidePrevButton();

    const submitHandler = () => {
        if (!window.nfcResponses || Object.keys(window.nfcResponses).length < nfcQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < nfcQuestions.length; i++) {
                if (!window.nfcResponses || window.nfcResponses[`q${i}`] === undefined) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('nfc-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            unblockClick();
            return;
        }
        document.getElementById('nfc-error').textContent = '';

        // Raw responses only — reverse-scoring and totals are computed at
        // analysis time (see surveys/NfC.md for the reverse-item key).
        const nfcData = {
            prolificID: window.subID,
            expName: 'Within',
            timestamp: new Date().toISOString(),
            surveyOrder: surveyOrderNames,
            ...window.nfcResponses
        };
        sendNfcData(nfcData);

        instNum = nextInBattery(NFC);
        setPageInstruction(instNum);
    };
    currentAction = submitHandler;
}

// CFQ Page (Cognitive Failures Questionnaire — 25 items, 0-4 scale)
function cfqPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';

    const cfqQuestions = [
        "Do you read something and find you haven't been thinking about it and must read it again?",
        "Do you find you forget why you went from one part of the house to another?",
        "Do you fail to notice signposts on the road?",
        "Do you find you confuse right and left when giving directions?",
        "Do you bump into people?",
        "Do you find you forget whether you've turned off a light, a fire, or locked the door?",
        "Do you fail to listen to people's names when you are meeting them?",
        "Do you say something and realize afterwards that it might be taken as insulting?",
        "Do you fail to hear people speaking to you when you are doing something else?",
        "Do you lose your temper and regret it?",
        "Do you leave important letters unanswered for days?",
        "Do you find you forget which way to turn on a road you know well but rarely use?",
        "Do you fail to see what you want in a supermarket (although it's there)?",
        "Do you find yourself suddenly wondering whether you've used a word correctly?",
        "Do you have trouble making up your mind?",
        "Do you find you forget appointments?",
        "Do you forget where you put things like a newspaper or a book?",
        "Do you find you accidentally throw away the thing you want and keep what you meant to throw away?",
        "Do you daydream when you ought to be listening to something?",
        "Do you find you forget people's names?",
        "Do you start doing one thing at home and get distracted into doing something else (unintentionally)?",
        "Do you find you can't quite remember a word although it's \"on the tip of your tongue\"?",
        "Do you find you forget what you came to the shop to buy?",
        "Do you drop things?",
        "Do you find you can't think of anything to say?"
    ];

    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 0; i <= 4; i++) {
        const roundClass = i === 0 ? 'left-round' : i === 4 ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;

    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>0</b> = Never</span>
            <span><b>2</b> = Occasionally</span>
            <span><b>4</b> = Very often</span>
        </div>`;

    let content = `
        <div style="display: flex; flex-direction: column; height: 130vh; max-width: 90%; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">Survey ${surveyOrder.indexOf(CFQ) + 1} of ${surveyOrder.length}</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    The questions below refer to minor mistakes which everyone makes from time to time, but some of which happen more often than others. We want to know how often these things have happened to you in the past 6 months. Please indicate how often.
                </p>
                ${scaleLabels}
            </div>
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="cfq-form" style="padding: 0;">`;

    cfqQuestions.forEach((question, index) => {
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
                <div id="cfq-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            button.classList.add('fill-selected');
            if (!window.cfqResponses) window.cfqResponses = {};
            window.cfqResponses[`q${questionIndex}`] = parseInt(value);
            document.getElementById('cfq-error').textContent = '';
        });
    });

    showButton();
    hidePrevButton();

    const submitHandler = () => {
        if (!window.cfqResponses || Object.keys(window.cfqResponses).length < cfqQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < cfqQuestions.length; i++) {
                if (!window.cfqResponses || window.cfqResponses[`q${i}`] === undefined) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('cfq-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            unblockClick();
            return;
        }
        document.getElementById('cfq-error').textContent = '';

        // Raw responses only — totals are computed at analysis time
        // (see surveys/CFQ.md).
        const cfqData = {
            prolificID: window.subID,
            expName: 'Within',
            timestamp: new Date().toISOString(),
            surveyOrder: surveyOrderNames,
            ...window.cfqResponses
        };
        sendCfqData(cfqData);

        instNum = nextInBattery(CFQ);
        setPageInstruction(instNum);
    };
    currentAction = submitHandler;
}

// OCI-R Page (Obsessive-Compulsive Inventory-Revised — 18 items, 0-4 scale)
function ociRPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';

    const ociRQuestions = [
        "I have saved up so many things that they get in the way.",
        "I check things more often than necessary.",
        "I get upset if objects are not arranged properly.",
        "I feel compelled to count while I am doing things.",
        "I find it difficult to touch an object when I know it has been touched by strangers or certain people.",
        "I find it difficult to control my own thoughts.",
        "I collect things I don't need.",
        "I repeatedly check doors, windows, drawers, etc.",
        "I get upset if others change the way I have arranged things.",
        "I feel I have to repeat certain numbers.",
        "I sometimes have to wash or clean myself simply because I feel contaminated.",
        "I am upset by unpleasant thoughts that come into my mind against my will.",
        "I avoid throwing things away because I am afraid I might need them later.",
        "I repeatedly check gas and water taps and light switches after turning them off.",
        "I need things to be arranged in a particular way.",
        "I feel that there are good and bad numbers.",
        "I wash my hands more often and longer than necessary.",
        "I frequently get nasty thoughts and have difficulty in getting rid of them."
    ];

    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 0; i <= 4; i++) {
        const roundClass = i === 0 ? 'left-round' : i === 4 ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;

    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>0</b> = Not at all</span>
            <span><b>2</b> = Moderately</span>
            <span><b>4</b> = Extremely</span>
        </div>`;

    let content = `
        <div style="display: flex; flex-direction: column; height: 130vh; max-width: 90%; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">Survey ${surveyOrder.indexOf(OCIR) + 1} of ${surveyOrder.length}</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    The following statements refer to experiences that many people have in their everyday lives. Please indicate the number that best describes HOW MUCH that experience has DISTRESSED or BOTHERED you during the PAST MONTH.
                </p>
                ${scaleLabels}
            </div>
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="ocir-form" style="padding: 0;">`;

    ociRQuestions.forEach((question, index) => {
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
                <div id="ocir-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            button.classList.add('fill-selected');
            if (!window.ociRResponses) window.ociRResponses = {};
            window.ociRResponses[`q${questionIndex}`] = parseInt(value);
            document.getElementById('ocir-error').textContent = '';
        });
    });

    showButton();
    hidePrevButton();

    const submitHandler = () => {
        if (!window.ociRResponses || Object.keys(window.ociRResponses).length < ociRQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < ociRQuestions.length; i++) {
                if (!window.ociRResponses || window.ociRResponses[`q${i}`] === undefined) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('ocir-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            unblockClick();
            return;
        }
        document.getElementById('ocir-error').textContent = '';

        // Raw responses only — total and subscale scores are computed at
        // analysis time (see surveys/OCI-R.md).
        const ociRData = {
            prolificID: window.subID,
            expName: 'Within',
            timestamp: new Date().toISOString(),
            surveyOrder: surveyOrderNames,
            ...window.ociRResponses
        };
        sendOciRData(ociRData);

        instNum = nextInBattery(OCIR);
        setPageInstruction(instNum);
    };
    currentAction = submitHandler;
}

// BFI-2-S Page (Big Five Inventory-2 Short Form — 30 items, 5-point scale)
function bfi2sPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';

    const bfi2sQuestions = [
        "...tends to be quiet.",
        "...is compassionate, has a soft heart.",
        "...tends to be disorganized.",
        "...worries a lot.",
        "...is fascinated by art, music, or literature.",
        "...is dominant, acts as a leader.",
        "...is sometimes rude to others.",
        "...has difficulty getting started on tasks.",
        "...tends to feel depressed, blue.",
        "...has little interest in abstract ideas.",
        "...is full of energy.",
        "...assumes the best about people.",
        "...is reliable, can always be counted on.",
        "...is emotionally stable, not easily upset.",
        "...is original, comes up with new ideas.",
        "...is outgoing, sociable.",
        "...can be cold and uncaring.",
        "...keeps things neat and tidy.",
        "...is relaxed, handles stress well.",
        "...has few artistic interests.",
        "...prefers to have others take charge.",
        "...is respectful, treats others with respect.",
        "...is persistent, works until the task is finished.",
        "...feels secure, comfortable with self.",
        "...is complex, a deep thinker.",
        "...is less active than other people.",
        "...tends to find fault with others.",
        "...can be somewhat careless.",
        "...is temperamental, gets emotional easily.",
        "...has little creativity."
    ];

    let scale = `<nav class="no-space" style="margin: 15px 0;">`;
    for (let i = 1; i <= 5; i++) {
        const roundClass = i === 1 ? 'left-round' : i === 5 ? 'right-round' : 'no-round';
        scale += `
            <button type="button" class="scale-button border ${roundClass} max vertical small" data-value="${i}" style="min-width: 60px; padding: 8px 4px;">
                <span style="font-size: 0.8em;">${i}</span>
            </button>`;
    }
    scale += `</nav>`;

    const scaleLabels = `
        <div style="display: flex; justify-content: space-between; margin: 5px 0 20px 0; font-size: 0.8em; opacity: 0.8;">
            <span><b>1</b> = Disagree strongly</span>
            <span><b>3</b> = Neutral; no opinion</span>
            <span><b>5</b> = Agree strongly</span>
        </div>`;

    let content = `
        <div style="display: flex; flex-direction: column; height: 130vh; max-width: 90%; margin: auto;">
            <div style="text-align: center; flex-shrink: 0;">
                <h2 style="margin-bottom: 5px;">Survey ${surveyOrder.indexOf(BFI2S) + 1} of ${surveyOrder.length}</h2>
                <p style="font-size: 1.1em; margin-bottom: 20px; line-height: 1.6;">
                    Here are a number of characteristics that may or may not apply to you. Please indicate the extent to which you agree or disagree with each statement, completing the stem <b>"I am someone who…"</b>
                </p>
                ${scaleLabels}
            </div>
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="bfi2s-form" style="padding: 0;">`;

    bfi2sQuestions.forEach((question, index) => {
        content += `
            <div style="border: 2px solid var(--outline-variant); border-radius: 12px; padding: 20px; margin: 15px 0; background-color: var(--surface-container-low);">
                <div style="margin-bottom: 15px;">
                    <p style="font-size: 1em; line-height: 1.4; margin: 0;">
                        <b>Q${index + 1}:</b> I am someone who ${question.replace(/^\.\.\./, '')}
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
                <div id="bfi2s-error" style="color: var(--error); text-align: center; font-weight: bold; min-height: 20px;"></div>
            </div>
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    document.querySelectorAll('.scale-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const questionIndex = button.getAttribute('data-question');
            const value = button.getAttribute('data-value');
            document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(btn => {
                btn.classList.remove('fill-selected');
            });
            button.classList.add('fill-selected');
            if (!window.bfi2sResponses) window.bfi2sResponses = {};
            window.bfi2sResponses[`q${questionIndex}`] = parseInt(value);
            document.getElementById('bfi2s-error').textContent = '';
        });
    });

    showButton();
    hidePrevButton();

    const submitHandler = () => {
        if (!window.bfi2sResponses || Object.keys(window.bfi2sResponses).length < bfi2sQuestions.length) {
            const unanswered = [];
            for (let i = 0; i < bfi2sQuestions.length; i++) {
                if (!window.bfi2sResponses || window.bfi2sResponses[`q${i}`] === undefined) {
                    unanswered.push(i + 1);
                }
            }
            document.getElementById('bfi2s-error').textContent = `Please answer all questions. Missing: Q${unanswered.join(', Q')}`;
            unblockClick();
            return;
        }
        document.getElementById('bfi2s-error').textContent = '';

        // Raw responses only — reverse-scoring and domain scores are computed
        // at analysis time (see surveys/BFI-2-S.md for the domain/reverse key).
        const bfi2sData = {
            prolificID: window.subID,
            expName: 'Within',
            timestamp: new Date().toISOString(),
            surveyOrder: surveyOrderNames,
            ...window.bfi2sResponses
        };
        sendBfi2sData(bfi2sData);

        instNum = nextInBattery(BFI2S);
        setPageInstruction(instNum);
    };
    currentAction = submitHandler;
}

// Color-Shape Task interstitial page
function csTaskPage() {
    hideButton();
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';

    const taskURL = `https://mili2nd.co/lbmc?subjectid=${encodeURIComponent(window.subID)}`;

    document.querySelector('#panel').innerHTML = `
        <div style="margin: auto; max-width: 650px; padding: 48px 32px; text-align: center;">
            <h2 style="margin-bottom: 24px; margin-left: 10%;">Color-Shape Task</h2>

            <p style="font-size: 1.05em; line-height: 1.8; margin-bottom: 16px;">
                You've completed the surveys — well done!
            </p>
            <p style="font-size: 1.05em; line-height: 1.8; margin-bottom: 24px;">
                Before finishing, please complete a 10min <b>Color-Shape Task</b>.<br>
                If you feel cognitively tired, feel free to take a short break before starting it.
            </p>

            <a href="${taskURL}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <button style="font-size: 1.1em; padding: 16px 36px; border-radius: 50px; cursor: pointer;">
                    Open Color-Shape Task &nbsp;&#8599;
                </button>
            </a>

            <p style="font-size: 0.9em; margin-top: 36px; opacity: 0.7; line-height: 1.6;">
                The task will open in a new tab.<br>
                You will be automatically redirected back here when you are done.
            </p>
        </div>
    `;
}

// --- DOSPERT Scale Page (deprecated — replaced by CFI/CFS above) ---
function dospertScalePage() {
    hideButton();
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
              
            </div>
            
            <div style="height: 38%; overflow-y: auto; padding: 20px; border: 2px solid #666666; border-radius: 12px; margin: 0 20px; background-color: var(--surface-container-lowest);">
                <form id="dospert-form" style="padding: 0;">`;
    //  <button type="button" id="fill-all-dospert" class="border small" style="margin-bottom: 15px; background-color: var(--surface-container); color: var(--on-surface); border: 1px solid var(--outline);">
    //                <span>Fill All (Testing Feature)</span>
    //            </button>
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
            unblockClick();
            return;
        }
        
        document.getElementById('dospert-error').textContent = '';
        
        // Prepare data for storage
        const dospertData = {
            prolificID: window.subID,
            expName: 'Within',
            ...window.dospertResponses,
            timestamp: new Date().toISOString()
        };
        
        // Store globally
        window.dospertData = dospertData;
        
        // Send data to server
        sendDospertData(dospertData);
        
        setStepDone('survey');
        instNum = RISK; // Go to Risk Assessment next (skip SG)
        setPageInstruction(instNum);
    };
    
    // Set as current action instead of replacing handler
    currentAction = submitHandler;
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
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    const lotteries = [
        { probHigh: 1, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 2, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 3, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 4, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 5, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 6, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 7, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 8, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 9, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 10, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } }
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
                    Please choose one option from each gamble pair below. At the end, one gamble will be randomly selected and played for real, i.e. you will earn the amount as bonus.
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
                unblockClick();
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
            'expName': 'FullPilotW',
            'selected': selectedGambleIndex,
            'amount': amount
        };
        
        // Store all choices
        selectedGambles.forEach((choice, index) => {
            riskData[`choice_${index}`] = choice;
        });
        
        // Store globally for end page
        riskData.finalAmount = amount;
        window.riskData = riskData;
        localStorage.setItem('finalAmount', JSON.stringify(riskData.finalAmount));
        
        // Send risk data
        sendRiskData(riskData);
        
        setStepDone('survey');
        instNum = SURVEY;
        setPageInstruction(instNum);
    };
    
    // Set as current action instead of replacing handler
    currentAction = submitHandler;
};

const riskAssessmentPage2 = () => {
    hideButton();
    setCurrentStep('survey');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    const lotteries = [
        { probHigh: 1, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 2, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 3, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 4, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 5, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 6, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 7, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 8, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 9, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } },
        { probHigh: 10, optionA: { high: 1.32, low: 1.06 }, optionB: { high: 2.54, low: 0.07 } }
    ];    // Holt and Laury 2002 risk assessment data
    let test=false;
    // Initialize trial state
    let currentTrial = 0;
    let totalScore = 0;
    let riskData = { 'prolificID': window.subID, 'expName': 'FullPilotW' };
    
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
            expName: 'Within',
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
        
        setStepDone('survey');
        instNum = FULL2; // Go to game 5 after completing risk assessment
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
    setStepDone('full2');
    setStepDone('cs-task');
    setCurrentStep('end')
    
    // Safely get score with fallback
    let points = 0;
    try {
        if (window.score && Array.isArray(window.score)) {
            points = window.score.reduce((a, b) => a + b, 0);
        }
    } catch (error) {
        console.warn('Error calculating score, using 0:', error);
        points = 0;
    }
    
    // let points = window.score[window.score.length-1];
    let pounds = 0;
    try {
        pounds = (points * CONV).toFixed(3);
    } catch (error) {
        console.warn('Error calculating pounds, using 0:', error);
        pounds = 0;
    }
    
    // now add the risk assessment amount to the points
    // convert both to float
    let riskAmount = 0;
    try {
        riskAmount = window.riskData.finalAmount;
    } catch (error) {
        riskAmount = parseFloat(localStorage.getItem('finalAmount')) || 0;
        console.warn('Error getting risk amount, using from localStorage or 0:', error);
    }
    // let riskAmount = 0;
    let total = 0;
    try {
        total = parseFloat(pounds) + parseFloat(riskAmount);
        // round to 2 decimal places
        total = total.toFixed(2);
    } catch (error) {
        console.warn('Error calculating total, using 0:', error);
        total = 0;
    }


    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Thank you!🚀</h1>
             <br>
             <h3>💰 You earned ${pounds} pounds from the space shooter game!💰</h3>
             <h3>💰 You earned ${total} pounds in total! 💰</h3>
             <br>
             <h4>Thank you for participating in our experiment!</h4>
             <h4>Please click the button below to complete your submission.</h4>
             <br>
             <button id="submit-button" class="btn btn-primary">Complete</button>
             </div>
     `;
                //   <h3>💰 You also earned ${riskAmount.toFixed(2)} pounds in the survey phase! 💰</h3>
// 
    document.querySelector('#submit-button').addEventListener('click', () => {
        window.location.href = atob(COMP_LINK);
    })
}

const rewardPage = () => {
    showButton();
    hidePrevButton()
    setPreviousStepDone();
    setStepDone('full2');
    setCurrentStep('final-survey')
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
             <p>Please click the next button and complete a short final survey to finish your submission.</p>
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

// Final reward page (after surveys have been completed)
const finalRewardPage = () => {
    showButton();
    hidePrevButton()
    setPreviousStepDone();
    setStepDone('full2');
    setCurrentStep('end')
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
             <p>Thank you for completing all tasks and surveys! Click next to finish.</p>
             </div>
     `;
    const nextButton = document.querySelector('#next-button');
    const finalNextHandler = () => {
        instNum = END;
        setPageInstruction(instNum);
    };
    
    currentNextHandler = finalNextHandler;
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

const sendCfiData = async (data, call = 0) => {
    let response = await fetch(CFI_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('CFI data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send CFI data');
            return;
        }
        setTimeout(() => {
            sendCfiData(data, call + 1);
        }, 500);
    }
}

const sendCfsData = async (data, call = 0) => {
    let response = await fetch(CFS_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('CFS data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send CFS data');
            return;
        }
        setTimeout(() => {
            sendCfsData(data, call + 1);
        }, 500);
    }
}

const sendNfcData = async (data, call = 0) => {
    let response = await fetch(NFC_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('NfC data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send NfC data');
            return;
        }
        setTimeout(() => {
            sendNfcData(data, call + 1);
        }, 500);
    }
}

const sendCfqData = async (data, call = 0) => {
    let response = await fetch(CFQ_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('CFQ data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send CFQ data');
            return;
        }
        setTimeout(() => {
            sendCfqData(data, call + 1);
        }, 500);
    }
}

const sendOciRData = async (data, call = 0) => {
    let response = await fetch(OCIR_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('OCI-R data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send OCI-R data');
            return;
        }
        setTimeout(() => {
            sendOciRData(data, call + 1);
        }, 500);
    }
}

const sendBfi2sData = async (data, call = 0) => {
    let response = await fetch(BFI2S_PHP, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log('BFI-2-S data sent successfully');
        return response.json();
    } else {
        if (call > 3) {
            console.log('Failed to send BFI-2-S data');
            return;
        }
        setTimeout(() => {
            sendBfi2sData(data, call + 1);
        }, 500);
    }
}


const checkSurvey = () => {
    document.querySelectorAll('input').forEach(element => element.reportValidity());
    return document.querySelectorAll('input:valid').length == 3 &&
        document.querySelectorAll('button.fill-selected').length == 3;
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

    let question1 = `In the <b style="color: var(--primary)">game 1 and 3 (spaceships only)</b>
     phase it was easy to tell which <b style="color: var(--primary)">spaceship</b> was the best`;
    let question2 = `In the <b style="color: var(--primary)">game 2 (shields only)</b>
     phase it was easy to tell which <b style="color: var(--primary)">shield</b> was the best`;
    let question3 = `In the <b style="color: var(--primary)">game 4 and 5 (shields and ships combined)</b>
     phase it was easy to tell which <b style="color: var(--primary)">combination</b> was the best`;
    // let question4 = `In the <b style="color: var(--primary)">game 4</b>
    //  phase it was easy to tell which <b style="color: var(--primary)">spaceship x shield</b> was the best`;
    //  let question5 = `In the <b style="color: var(--primary)">game 5</b>
    //  phase it was easy to tell which <b style="color: var(--primary)">spaceship x shield</b> was the best`;
    let questions = [question1, question2, question3];

    let content = '<h2>Survey</h2><div class="scroll-div-survey" style="">';
    // document.querySelector('#panel').innerHTML = '<h2>Survey</h2><div class="scroll-div">'
    document.querySelector('#panel').style.display = 'block';

    questions.forEach((question, idx) => {
        let box = '<div style="margin-top:2.5%; padding:.5%">'
        let q = box + question + '<br>' + scale.replace(/id=""/g, `id="q${idx}"`) + '';
        // document.querySelector('#panel').innerHTML += q;   
        content += q + `<div class="field input label border" style="height: 5%">
                                                        <input minlength="10" class="open" id="open_q${idx}" required></input>
                                                        <label>What strategy did you use?</label>
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
            instNum = END; // Go to final end page after post-game survey
            setPageInstruction(instNum);
        } else {
            unblockClick();
        }
    };
    
    // Set as current action instead of replacing handler
    currentAction = surveySubmitHandler;

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
    if (sess == 3) {
        // After game 4 (FULL), show instruction page before game 5 (FULL2)
        quitUnityGame();
        localStorage.setItem('score', JSON.stringify(window.score));
        setPreviousStepDone();
        setStepDone('full');
        // Go to instruction page 11 (instNum = 12, which loads inst_11.md)
        instNum = FULL2-1;
        setPageInstruction(instNum);
    } else {
        window.endFull2();
    }
}

window.endFull2 = () => {
    try {
        quitUnityGame();
    } catch {
        console.log('quitUnityGame error: no game running');
    }
    localStorage.setItem('end', true);
    localStorage.setItem('score', JSON.stringify(window.score));
    setPreviousStepDone();
    setStepDone('full2');
    setCurrentStep('survey')
    instNum = surveyOrder[0];
    setPageInstruction(instNum);
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


