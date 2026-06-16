
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


