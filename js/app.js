import {ExperimentParameters} from "./modules/exp.js";
import {Instructions} from "./modules/inst.js";
import {Questionnaire} from "./modules/quest.js";
import {Game} from "./modules/game.js";


// When the page is fully loaded, the main function will be called
$(document).ready(main);


function main() {
    /*
    Main function where
    we instantiate experiment parameters, in order to maintain
    their attributes throught the whole experiment scope
    TODO:
        * ???
        * Init dictionnaries instead of arrays
     */

    // initGameStageDiv main parameters
    /* ============================================================================= */
    // these three variables indicate what
    // has to be run in the state machine (i.e. current state of the experiment)
    // initial values are:
    // let sessionNum = -1;
    // let phaseNum = 1;
    // let instructionNum = 0;
    // let questNum = 0;
    let sessionNum = -1;
    let phaseNum = 1;
    let instructionNum = 1;
    let questNum = 0;

    window.gameEnded = false;

    // instantiate experiment parameters
    let exp = new ExperimentParameters(
        {
            online: false,   // send network requests
            isTesting: false, // isTesting==in development vs in production
            expName: 'spaceRL', // experience name
            completeFeedback: true, // display feedback of both options
            maxPoints: undefined, // max points cumulated all along the experiment
                                 // if undefined or 0, will be computed automatically
            maxCompensation: 250, // in pence (in addition of the initial endowment)
            feedbackDuration: 1400, // how many milliseconds we present the outcome
            beforeFeedbackDuration: 900, // how many milliseconds before the outcome
            maxTrainingNum: -2, // if sessionNum == maxTrainingNum
                                // do not allow for new training sessions
            nTrialPerConditionTraining: 5,
            nTrialPerCondition: 60,
            nSession: 1,
            nCond: 2,
            imgPath: 'images/cards_gif/',
            compLink: 'https://app.prolific.ac/submissions/complete?cc=RNFS5HP5' // prolific completion link
                                                                                // will be displayed at the end
        }
    );
    
    // Run experiment!!
    stateMachine({instructionNum, sessionNum, phaseNum, questNum, exp});
}


function stateMachine({instructionNum, sessionNum, phaseNum, questNum, exp} = {}) {
    
    let inst = new Instructions(exp);
    let quest = new Questionnaire(exp);

    /* ============================ Instructions Management ========================== */

    // if sessionNum < 0, then it is a training session
    // here training sessionNum is in {-1, -2}
    let isTraining = +(sessionNum < 0);
    let isLastSession = +(sessionNum === (exp.nSession-1));

    switch (instructionNum) {
        case 0:
            inst.goFullscreen(
                // what will be executed next
                stateMachine,
                {
                    instructionNum: 1, exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;

        case 1:
            inst.setUserID(
                // what will be executed next
                stateMachine,
                {
                    instructionNum: 2, exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;

        case 2:
            inst.displayConsent(
                // what will be executed next
                stateMachine,
                {
                    instructionNum: 3, exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;

        case 3:
            inst.displayInitialInstruction(
                {pageNum: 1},
                // what will be executed next
                stateMachine,
                {
                    instructionNum: 'end', exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;

        case 4:

            inst.endExperiment(
                {pageNum: 1},
                // what will be executed next
                stateMachine,
                {
                    instructionNum: 'end', exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;
        case 'end':
        case undefined:
            break;

        default:
            window.error('Instructions: non-expected state');
    }



    /* ============================ Test Management ================================ */
    switch (phaseNum) {

        case 1:
            // select stimuli depending on sessionNum;
            // Using arrays allows to avoid multiple if statements
            let game = new Game(exp);
            game.run(stateMachine,
                {
                    instructionNum: 4, exp: exp, sessionNum: sessionNum, phaseNum: 1
                });

            return;

            case 'end':
        case undefined:
            break;

        default:
            error('Test: non-expected state');
    }

    /* ============================ Questionnaire Management ====================== */

    switch (questNum) {
        case 0:
            quest.runCRT(
                {questNum: 1},
                stateMachine,
                {
                    instructionNum: 'end', exp: exp, sessionNum: 0, phaseNum: 'end', questNum: 1
                }
            );
            return;
        case 1:
            quest.runSES(
                {questNum: 1},
                stateMachine,
                {
                    instructionNum: 8, exp: exp, sessionNum: 0, phaseNum: 'end', questNum: 'end'
                }
            );
            return;

        case 'end':
        case undefined:
            break;

        default:
            error('Questionnaire: non-expected state');

    }

}
