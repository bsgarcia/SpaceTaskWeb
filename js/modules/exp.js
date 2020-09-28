import {range, shuffle, getOS, getBrowser, createCode} from './utils.js';


export class ExperimentParameters {
    /***

     Experiment initializer
     All the parameters for
     the experiment are defined here
     ***/

    constructor({
                    online,
                    isTesting,
                    completeFeedback,
                    maxPoints,
                    expName,
                    beforeFeedbackDuration,
                    feedbackDuration,
                    maxTrainingNum,
                    compLink,
                    imgPath,
                    maxCompensation,
                    nTrialPerCondition,
                    nTrialPerConditionTraining,
                    nCond,
                    nSession
                } = {}) {

        // Initial Experiment Parameters
        // ===================================================================== // 
        this.online = online;
        this.completeFeedback = completeFeedback;
        this.expName = expName;
        this.isTesting = isTesting;

        this.feedbackDuration = feedbackDuration;
        this.beforeFeedbackDuration = beforeFeedbackDuration;

        this.nSession = nSession;

        this.sumReward = [0, 0, 0, 0, 0, 0, 0];

        this.totalReward = 0;

        this.maxTrainingNum = maxTrainingNum;

        this.initTime = (new Date()).getTime();

        this.expID = createCode();

        this.browsInfo = getOS() + ' - ' + getBrowser();

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        this.subID = urlParams.get('prolific_id');

        this.compLink = compLink;

        //
        //     // initGameStageDiv
        //     this._initContingencies();
        //     this._loadImg(imgPath, nCond, nSession);
        //     this._initConditionArrays(
        //         nTrialPerCondition, nTrialPerConditionTraining, nCond, nSession);
        //     this._initTrialObj(nCond, nSession);
        //
        //     if (maxPoints) {
        //         this.maxPoints = maxPoints;
        //     } else {
        //         this.maxPoints = this._computeMaxPoints(nSession);
        //     }
        //
        this.maxPoints = 100;
        // define compensation functions
        // ===================================================================== //
        this.conversionRate = (maxCompensation / this.maxPoints).toFixed(2);
        this.pointsToPence = points => points * this.conversionRate;
        this.penceToPounds = pence => pence / 100;
        this.pointsToPounds = points => this.penceToPounds(this.pointsToPence(points));
    }
}
 
