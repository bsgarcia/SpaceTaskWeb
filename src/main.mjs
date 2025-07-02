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
      
        riskAssessmentPage();
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
    let steps = ['introduction', 'training1', 'training2', 'training3', 'full', 'full2', 'survey', 'risk', 'end'];
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
    let steps = ['introduction', 'training1', 'training2', 'training3', 'full', 'full2', 'survey', 'risk', 'end'];
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
        SURVEY == instNum || RISK == instNum) {

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
const riskAssessmentPage = () => {
    hideButton();
    setCurrentStep('risk');
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'block';
    
    const lotteries = [
        { probHigh: 1, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 2, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 3, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 4, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 5, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 6, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 7, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 8, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 9, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } },
        { probHigh: 10, optionA: { high: 2.61, low: 2.09 }, optionB: { high: 5.02, low: 0.13 } }
    ];    // Holt and Laury 2002 risk assessment data 

    let content = `
        <div style="max-width: 900px; margin: auto;">
            <h2>Risk Assessment Task</h2>
            <p>Please make choices between the following lottery pairs. For each row, choose either Option A or Option B. 
            The colored bars show the probability of winning each amount.</p>
            <p>
            After you complete the 10 lottery pairs, one row will be randomly selected and played 
            for real money. A 10-sided die will determine which choice is selected, and then
             another die roll will determine your actual winnings based on your the amounts and probabilities of the selected lottery.
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
                         <div class="scroll-div-survey" style="max-height: 400px; overflow-y: auto;">
                
                 <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                     <thead>
                         <tr style="background-color: #191c1b;">
                             <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Number</th>
                             <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Option A</th>
                             <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Option B</th>
                         </tr>
                     </thead>
                     <tbody>`;

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

    lotteries.forEach((lottery, idx) => {
        const probLow = 10 - lottery.probHigh;
        const probHighPercent = (lottery.probHigh / 10) * 100;
        const probLowPercent = (probLow / 10) * 100;

        const highAngle = (lottery.probHigh / 10) * 360;
        const lowAngle = 360 - highAngle;

        const highSlice = describePieSlice(40, 40, 35, 0, highAngle);
        const lowSlice = describePieSlice(40, 40, 35, highAngle, 360);

        content += `
             <tr style="border-bottom: 1px solid #ddd;">
                 <td style="padding: 15px; text-align: center; font-weight: bold;">${idx + 1}</td>
                 <td class="lottery-option" data-choice="${idx}" data-option="A" style="padding: 15px; text-align: center;">
                                 <div style="position: relative; width: 120px; height: 120px; margin: 0 auto;">
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="55" fill="none" stroke="white" stroke-width="2"></circle>
                    <path d="${describePieSlice(60, 60, 55, 0, highAngle).path}" fill="#1c1616"></path>
                    <path d="${describePieSlice(60, 60, 55, highAngle, 360).path}" fill="#908997"></path>
                                                 ${lottery.probHigh > 0 ? `<text x="${describePieSlice(60, 60, 55, 0, highAngle).textX}" y="${describePieSlice(60, 60, 55, 0, highAngle).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionA.high}</text>` : ''}
                             ${probLow > 0 ? `<text x="${describePieSlice(60, 60, 55, highAngle, 360).textX}" y="${describePieSlice(60, 60, 55, highAngle, 360).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionA.low}</text>` : ''}
                </svg>
            </div>
                 </td>
                 <td class="lottery-option" data-choice="${idx}" data-option="B" style="padding: 15px; text-align: center;">
                     <div style="position: relative; width: 120px; height: 120px; margin: 0 auto;">
                         <svg width="120" height="120" viewBox="0 0 120 120">
                             <circle cx="60" cy="60" r="55" fill="none" stroke="white" stroke-width="2"></circle>
                             <path d="${describePieSlice(60, 60, 55, 0, highAngle).path}" fill="#1c1616"></path>
                             <path d="${describePieSlice(60, 60, 55, highAngle, 360).path}" fill="#908997"></path>
                                                           ${lottery.probHigh > 0 ? `<text x="${describePieSlice(60, 60, 55, 0, highAngle).textX}" y="${describePieSlice(60, 60, 55, 0, highAngle).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionB.high}</text>` : ''}
                              ${probLow > 0 ? `<text x="${describePieSlice(60, 60, 55, highAngle, 360).textX}" y="${describePieSlice(60, 60, 55, highAngle, 360).textY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="12" font-weight="bold">£${lottery.optionB.low}</text>` : ''}
                         </svg>
                     </div>
                 </td>
             </tr>`;
    });

    content += `
                    </tbody>
                </table>
            </div>
     
        </div>`;

    document.querySelector('#panel').innerHTML = content;

    let riskData = { 'prolificID': window.subID };
    // riskData must be global

    // Add event listeners for clickable lottery options
    document.querySelectorAll('.lottery-option').forEach(option => {
        option.addEventListener('click', () => {
            const choiceIndex = option.getAttribute('data-choice');
            const selectedOption = option.getAttribute('data-option');
            
            // Remove selected class from all options in this row
            document.querySelectorAll(`[data-choice="${choiceIndex}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Store the choice (A=0, B=1)
            riskData[`choice_${choiceIndex}`] = selectedOption === 'A' ? 0 : 1;
            
            // Check if all choices are made
            const totalChoices = lotteries.length;
            const madeChoices = Object.keys(riskData).filter(key => key.startsWith('choice_')).length;
            
            if (madeChoices === totalChoices) {
                showButton();
                hidePrevButton();

            }
        });
    });

    hidePrevButton();

    const nextButton = document.querySelector('#next-button');
    const riskSubmitHandler = () => {
        const totalChoices = lotteries.length;
        const madeChoices = Object.keys(riskData).filter(key => key.startsWith('choice_')).length;
        
        if (madeChoices === totalChoices) {
            // Add experiment name to risk data
            riskData.expName = 'FullPilot12_2';
            
            // Implement compensation algorithm
            // Step 1: Randomly select one of the 10 lottery pairs (0-9)
            const selectedLottery = Math.floor(Math.random() * 10);
            riskData.selected = selectedLottery;
            
            // Step 2: Get participant's choice for the selected lottery
            const participantChoice = riskData[`choice_${selectedLottery}`]; // 0=A, 1=B
            
            // Step 3: Get lottery parameters for the selected lottery
            const selectedLotteryData = lotteries[selectedLottery];
            const probHigh = selectedLotteryData.probHigh / 10; // Convert to decimal probability
            
            // Step 4: Determine payoff based on choice and random draw
            let payoff;
            const randomDraw = Math.random(); // Random number between 0 and 1
            
            if (participantChoice === 0) { // Chose Option A
                if (randomDraw < probHigh) {
                    payoff = selectedLotteryData.optionA.high; // £1.46
                } else {
                    payoff = selectedLotteryData.optionA.low;  // £1.17
                }
            } else { // Chose Option B
                if (randomDraw < probHigh) {
                    payoff = selectedLotteryData.optionB.high; // £2.81
                } else {
                    payoff = selectedLotteryData.optionB.low;  // £0.07
                }
            }
            
            riskData.amount = payoff;
            window.riskData = riskData;

            // Send risk assessment data to dedicated endpoint
            sendRiskData(riskData);
            setStepDone('risk');
            instNum = END;
            setPageInstruction(instNum);
            
        } else {
            alert('Please make a choice for all lottery pairs before continuing.');
            //use modal to show message
            
        }
    };
    
    currentNextHandler = riskSubmitHandler;
    safelyReplaceEventListener(nextButton, 'click', currentNextHandler, riskSubmitHandler);
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
    // now add the compensation amount to the points
    // convert both to float
    let total = parseFloat(pounds) + parseFloat(window.riskData.amount);
    // round to 2 decimal places
    total = total.toFixed(2);


    document.querySelector('#game').style.display = 'none';
    document.querySelector('#panel').style.display = 'flex';
    document.querySelector('#panel').innerHTML = `
             <div class="center-align" style="margin: auto">
             <h1 style="display: block">🚀Thank you!🚀</h1>
             <br>
             <h3>💰 You earned ${pounds} pounds from the space shooter game!💰</h3>
             <h3>💰 You also earned ${window.riskData.amount} pounds from the risk assessment! 💰</h3>
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
            instNum = RISK;
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


