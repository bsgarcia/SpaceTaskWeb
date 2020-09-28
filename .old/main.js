$(document).ready(main);


function main() {
    /*
    Main function where
    we instantiate main components, in order to maintain
    their attributes throught the whole experiment scope
     */

    // initGameStageDiv main parameters
    let sessionNum = -1;
    let phaseNum = 1;

    let instructionNum = 'end';

    let exp = new Experiment();
    let inst = new Instructions(exp);

    // Run experiment!!
    stateMachine({instructionNum, sessionNum, phaseNum, inst, exp});
}


function stateMachine({instructionNum, sessionNum, phaseNum, inst, exp} = {}) {

    /* ============================ Instructions Management ========================== */

    let isTraining = +(sessionNum < 0);

    switch (instructionNum) {
        case 0:
            inst.goFullscreen(
                stateMachine,
                {
                    instructionNum: 1, inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;

        case 1:
            inst.setUserID(
                stateMachine,
                {
                    instructionNum: 2, inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 1
                }
            );
            return;

        case 2:
            inst.displayConsent(
                stateMachine,
                {
                    instructionNum: 3, inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 1
                }

            );
            return;

        case 3:
            inst.displayInitialInstruction(
                {pageNum: 1},
                stateMachine,
                {
                    instructionNum: 4, inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 1
                });
            return;

        case 4:
            inst.displayInstructionLearning(
                {pageNum: 1, isTraining: isTraining, phaseNum: 1},
                stateMachine,
                {
                    instructionNum: 'end', inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 1
                });
            return;

        case 5:
            inst.displayInstructionChoiceElicitation(
                {pageNum: 1, isTraining: isTraining, phaseNum: 2},
                stateMachine,
                {
                    instructionNum: 'end', inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 2
                });
            return;

        case 6:
            inst.displayInstructionSliderElicitation(
                {pageNum: 1, isTraining: isTraining, phaseNum: 3},
                stateMachine,
                {
                    instructionNum: 'end', inst: inst, exp: exp, sessionNum: sessionNum, phaseNum: 3
                });
            return;
        case 7:
            inst.endTraining(
                {pageNum: 1, isTraining: 1, phaseNum: 3, sessionNum: sessionNum},
                stateMachine,
                {
                    instructionNum: 4, inst: inst, exp: exp, sessionNum: 0, phaseNum: 1
                });
            return;
        case 8:
            inst.endExperiment(
                {pageNum: 1, isTraining: 1, phaseNum: 3},
                stateMachine,
                {
                    instructionNum: 'end', inst: inst, exp: exp, sessionNum: 0, phaseNum: 'end'
                });
            return;


        case 'end':
            break;
    }

    /* ============================ Test Management ================================ */

    let trialObj;
    let imgObj = [exp.images, exp.trainingImg][isTraining];

    switch (phaseNum) {

        case 1:
        case 2:

            let isElicitation = +(phaseNum > 1);

            // select stimuli depending on sessionNum;
            trialObj = [
                [exp.trialObjLearning, exp.trialObjChoiceElicitation][isElicitation],
                [exp.trialObjLearningTraining, exp.trialObjChoiceElicitationTraining][isElicitation],
            ][isTraining];

            let choice = new ChoiceManager(
                {
                    trialObj: trialObj,
                    feedbackDuration: exp.feedbackDuration,
                    completeFeedback: exp.completeFeedback,
                    feedbackObj: exp.feedbackImg,
                    imgObj: imgObj,
                    sessionNum: sessionNum,
                    phaseNum: phaseNum,
                    exp: exp,
                    elicitationType: [-1, 0][isElicitation],
                    showFeedback: [true, false][isElicitation],
                    maxTrials: 3,
                    nextFunc: stateMachine,
                    nextParams: {
                        instructionNum: [5, 6][isElicitation],
                        sessionNum: sessionNum,
                        phaseNum: [2, 3][isElicitation],
                        exp: exp,
                        inst: inst
                    }
                }
            );
            choice.run();
            break;

        case 3:

            // select stimuli depending on sessionNum;
            trialObj = [exp.trialObjSliderElicitation, exp.trialObjChoiceElicitation][isTraining];

            let slider = new SliderManager(
                {
                    trialObj: trialObj,
                    feedbackDuration: exp.feedbackDuration-1500,
                    completeFeedback: exp.completeFeedback,
                    feedbackObj: exp.feedbackImg,
                    imgObj: imgObj,
                    sessionNum: sessionNum,
                    phaseNum: phaseNum,
                    exp: exp,
                    elicitationType: 2,
                    showFeedback: exp.showFeedback,
                    nextFunc: stateMachine,
                    nextParams: {
                        instructionNum: [8, 7][isTraining],
                        sessionNum: sessionNum,
                        phaseNum: ['end', 1][isTraining],
                        exp: exp,
                        inst: inst
                    }
                }
            );
            slider.run();
            break;

        case 'end':
            break;
    }

    /* ============================ Questionnaire Management ====================== */


}


function sendToDB(call, data, url) {

    $.ajax({
        type: 'POST',
        data: data,
        async: true,
        url: url,
        success: function (r) {

            if (r[0].ErrorNo > 0 && (call + 1) < 2) {
                sendToDB(call + 1);
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {

            if ((call + 1) < 2) {
                sendToDB(call + 1);
            }
        }
    });
}


class GUI {

    static init() {
        if ($('#TextBoxDiv').length === 0) {
            createDiv('Stage', 'TextBoxDiv');
        }
    }

    static displayOptions(id1, id2, img, feedbackImg, invertedPosition) {
       let [option1, option2, feedback1, feedback2] = GUI.getOptions(id1, id2, img, feedbackImg);
       GUI.displayOpt(option1, option2, feedback1, feedback2, invertedPosition);
    }

    static getOptions(id1, id2, img, feedbackImg){

        let option1 = img[id1];
        option1.id = "option1";
        option1 = option1.outerHTML;

        let option2 = img[id2];
        option2.id = "option2";
        option2 = option2.outerHTML;

        let feedback1 = feedbackImg["empty"];
        feedback1.id = "feedback1";
        feedback1 = feedback1.outerHTML;

        let feedback2 = feedbackImg["empty"];
        feedback2.id = "feedback2";
        feedback2 = feedback2.outerHTML;

        return [option1, option2, feedback1, feedback2]
    }

    static displayOpt(option1, option2, feedback1, feedback2, invertedPosition) {

        let Title = '<div id = "Title"><H2 align = "center"> <br><br><br><br></H2></div>';

        let canvas1 = '<canvas id="canvas1" height="620"' +
            ' width="620" class="img-responsive center-block"' +
            ' style="border: 5px solid transparent; position: relative; top: 0px;">';

        let canvas2 = '<canvas id="canvas2" height="620"' +
            ' width="620" class="img-responsive center-block"' +
            ' style="border: 5px solid transparent; position: relative; top: 0px;">';

        let options = [[option1, option2], [option2, option1]][+(invertedPosition)];
        let feedbacks = [[feedback1, feedback2], [feedback2, feedback1]][+(invertedPosition)];
        let canvas = [[canvas1, canvas2], [canvas2, canvas1]][+(invertedPosition)];

        /* Create canevas for the slot machine effect, of the size of the images */
        let Images = '<div id = "stimrow" class="row" style= "transform: translate(0%, -100%);position:relative"> ' +
            '<div class="col-xs-1 col-md-1"></div>  <div class="col-xs-3 col-md-3">'
            + options[0] + '</div><div id = "Middle" class="col-xs-4 col-md-4"></div>' +
            '<div class="col-xs-3 col-md-3">' + options[1] + '</div><div class="col-xs-1 col-md-1"></div></div>';

        let Feedback = '<div id = "fbrow" class="row" style= "transform: translate(0%, 0%);position:relative"> ' +
            '<div class="col-xs-1 col-md-1"></div>  <div class="col-xs-3 col-md-3">' + feedbacks[0] + '' +
            '</div><div id = "Middle" class="col-xs-4 col-md-4"></div><div class="col-xs-3 col-md-3">'
            + feedbacks[1] + '</div><div class="col-xs-1 col-md-1"></div></div>';

        let myCanvas = '<div id = "cvrow" class="row" style= "transform: translate(0%, -200%);position:relative">' +
            '    <div class="col-xs-1 col-md-1"></div>  <div class="col-xs-3 col-md-3">'
            + canvas[0] + '</div><div id = "Middle" class="col-xs-4 col-md-4"></div><div class="col-xs-3 col-md-3">'
            + canvas[1] + '</div><div class="col-xs-1 col-md-1"></div></div>';

        $('#TextBoxDiv').html(Title + Feedback + Images + myCanvas);
    }

    static displayOptionSlider(option) {

        let canvas1 = '<canvas id="canvas1" height="620"' +
            ' width="620" class="img-responsive center-block"' +
            ' style="border: 5px solid transparent; position: relative; top: 0px;">';

        let canvas2 = '<canvas id="canvas2" height="620"' +
            ' width="620" class="img-responsive center-block"' +
            ' style="border: 5px solid transparent; position: relative; top: 0px;">';

        let myCanvas = '<div id = "cvrow" class="row" style= "transform: translate(0%, -200%);position:relative">' +
            '    <div class="col-xs-1 col-md-1"></div>  <div class="col-xs-3 col-md-3">'
            + canvas1 + '</div><div id = "Middle" class="col-xs-4 col-md-4"></div><div class="col-xs-3 col-md-3">'
            + canvas2 + '</div><div class="col-xs-1 col-md-1"></div></div>';

        let Title = '<div id = "Title"><H2 align = "center">What are the odds this symbol gives a +1?<br><br><br><br></H2></div>';
        let Images = '<div id = "stimrow" style="transform: translate(0%, -100%);position:relative"> ' +
            '<div class="col-xs-1 col-md-1"></div>  <div class="col-xs-3 col-md-3">'
            + '</div><div id = "Middle" class="col-xs-4 col-md-4">' + option + '</div></div>';

        let initValue = range(25, 75, 5)[Math.floor(Math.random() * 10)];

        let Slider = '<main>\n' +
            '  <form id="form">\n' +
            '    <h2>\n' +
            '    </h2>\n' +
            '    <div class="range">\n' +
            '      <input id="slider" name="range" type="range" value="' + initValue + '" min="0" max="100" step="5">\n' +
            '      <div class="range-output">\n' +
            '        <output id="output" class="output" name="output" for="range">\n' +
            '          ' + initValue + '%\n' +
            '        </output>\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  </form>\n' +
            '</main>\n' +
            '<br><br><div align="center"><button id="ok" class="btn btn-default btn-lg">Ok</button></div>';

        return Title + Images + myCanvas + Slider;
    }

    static slideCard(pic, cv, showFeedback) {

        let img = new Image();
        let canvas;
        img.src = pic.src;
        img.width = pic.width;
        img.height = pic.height;

        let speed = 3;
        let y = 0;

        let dy = 10;
        let x = 0;
        let ctx;

        img.onload = function () {

            canvas = cv;
            ctx = cv.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            let scroll = setInterval(draw, speed);

            if (showFeedback) {
                setTimeout(function () {
                    pic.style.visibility = "hidden";
                    clearInterval(scroll);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }, 1000);
            }

        };

        function draw() {

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (y > img.height) {
                y = -img.height + y;
            }

            if (y > 0) {
                ctx.drawImage(img, x, -img.height + y, img.width, img.height);
            }

            ctx.drawImage(img, x, y, img.width, img.height);

            y += dy;
        }
    }
}


class ChoiceManager {
    /*
    Manage trials with 2 options
    Private methods are prefixed with _
     */
    constructor({
        exp,
        trialObj,
        imgObj,
        sessionNum,
        phaseNum,
        feedbackDuration,
        completeFeedback,
        showFeedback,
        elicitationType,
        feedbackObj,
        maxTrials,
        nextFunc,
        nextParams
    } = {}) {

        // members
        this.exp = exp;

        this.trialObj = trialObj;
        this.feedbackObj = feedbackObj;
        this.imgObj = imgObj;

        this.sessionNum = sessionNum;
        this.phaseNum = phaseNum;

        this.feedbackDuration = feedbackDuration;
        this.completeFeedback = completeFeedback;
        this.showFeedback = showFeedback;
        this.elicitationType = elicitationType;

        this.nextFunc = nextFunc;
        this.nextParams = nextParams;

        // initGameStageDiv non parametric variables
        this.trialNum = 0;

        if (!maxTrials) {
            this.nTrial = trialObj.length;
        } else {
            this.nTrial = maxTrials;
        }

        this.invertedPosition = shuffle(
            Array.from(Array(this.nTrial), x => randint(0, 1))
        );

    }

    /* =========================================== public methods =========================================== */

    run() {

        GUI.init();

        let trialObj = this.trialObj[this.trialNum];

        let choiceTime = (new Date()).getTime();

        let params = {
            stimIdx1: trialObj[0],
            stimIdx2: trialObj[1],
            p1: trialObj[2],
            contIdx1: trialObj[3],
            ev1: trialObj[4],
            p2: trialObj[5],
            contIdx2: trialObj[6],
            ev2: trialObj[7],
            isCatchTrial: trialObj[8],
            r1: [-1, 1],
            choiceTime: choiceTime
        };

        GUI.displayOptions(
            params["stimIdx1"],
            params["stimIdx2"],
            this.imgObj,
            this.feedbackObj,
            this.invertedPosition[this.trialNum]
        );

        let clickEnabled = true;

        $('#canvas1').click({obj: this}, function (event) {
            if (!clickEnabled)
                return;
            clickEnabled = false;
            document.getElementById("canvas1").style.borderColor = "black";
            event.data.obj._clickEvent(1, params);
        });

        $('#canvas2').click({obj: this}, function (event) {
            if (!clickEnabled)
                return;
            clickEnabled = false;
            document.getElementById("canvas2").style.borderColor = "black";
            event.data.obj._clickEvent(2, params);
        });

    };

    /* =========================================== private methods =========================================== */

    _clickEvent(choice, params) {

        let reactionTime = (new Date()).getTime();
        let invertedPosition = this.invertedPosition[this.trialNum];
        let leftRight =
            +((invertedPosition && (choice === 1)) || (!invertedPosition && (choice === 2)));

        let contIdx1 = params["contIdx1"];
        let contIdx2 = params["contIdx2"];

       let [reward1, reward2, thisReward, otherReward, correctChoice] = this._getReward(choice, params);
       this._showReward(reward1, reward2, thisReward, choice);

       if (this.exp.online) {
            sendToDB(0,
                {
                    exp: this.exp.expName,
                    expID: this.exp.expID,
                    id: this.exp.subID,
                    test: 0,
                    trial: this.trialNum,
                    elicitation_type: this.elicitationType,
                    cont_idx_1: contIdx1,
                    cont_idx_2: contIdx2,
                    condition: -1,
                    symL: -1,
                    symR: -1,
                    choice: choice,
                    correct_choice: correctChoice,
                    outcome: thisReward,
                    cf_outcome: otherReward,
                    choice_left_right: leftRight,
                    reaction_time: reactionTime - params["choiceTime"],
                    reward: this.exp.totalReward,
                    session: this.sessionNum,
                    p1: p1[1],
                    p2: p2[1],
                    option1: -1,
                    option2: -1,
                    ev1: Math.round(params["ev1"] * 100) / 100,
                    ev2: Math.round(params["ev2"] * 100) / 100,
                    iscatch: params["isCatchTrial"],
                    inverted: invertedPosition,
                    choice_time: -1,
                    elic_distance: -1,
                    p_lottery: -1
                },
                'php/InsertLearningDataDB.php'
            );
        }

       this._next();
    }

    _getReward(choice, params) {

        let p1 = params["p1"];
        let p2 = params["p2"];
        let ev1 = params["ev1"];
        let ev2 = params["ev2"];

        let r1 = params["r1"];


        ev1 = Math.round(ev1 * 100) / 100;
        ev2 = Math.round(ev2 * 100) / 100;

        let reward1;
        let reward2;
        let thisReward;
        let otherReward;
        let correctChoice;

        reward1 = r1[+(Math.random() < p1[1])];
        reward2 = r1[+(Math.random() < p2[1])];
        thisReward = [reward2, reward1][+(choice === 1)];
        otherReward = [reward2, reward1][+(choice === 1)];
        correctChoice = [+(ev2 >= ev1), +(ev1 >= ev2)][+(choice === 1)];

        this.exp.sumReward[this.phaseNum] += thisReward;

        // if session is not training add to total reward
        this.exp.totalReward += thisReward * !([-1, -2].includes(this.sessionNum));

        return [reward1, reward2, thisReward, otherReward, correctChoice];

    };

    _showReward(reward1, reward2, thisReward, choice) {

        let pic1 = document.getElementById("option1");
        let pic2 = document.getElementById("option2");

        let cv1 = document.getElementById("canvas1");
        let cv2 = document.getElementById("canvas2");

        let fb1 = document.getElementById("feedback1");
        let fb2 = document.getElementById("feedback2");

        let pic = [pic2, pic1][+(choice === 1)];
        let cv = [cv2, cv1][+(choice === 1)];
        let fb = [fb2, fb1][+(choice === 1)];

        let showFeedback = this.showFeedback;

        if (this.completeFeedback) {
            if (this.showFeedback) {
                fb1.src = this.feedbackObj['' + reward1].src;
                fb2.src = this.feedbackObj['' + reward2].src;
            }

            setTimeout(function () {
                GUI.slideCard(pic1, cv1, showFeedback);
                GUI.slideCard(pic2, cv2, showFeedback);
            }, 500);

        } else {
            if (this.showFeedback) {
                fb.src = this.feedbackObj['' + thisReward].src;
            }
            setTimeout(function () {
                GUI.slideCard(pic, cv, showFeedback);
            }, 500);
        }
    }

    _next() {
        this.trialNum++;
        if (this.trialNum < this.nTrial) {
            setTimeout(function (event) {
                $('#stimrow').fadeOut(500);
                $('#fbrow').fadeOut(500);
                $('#cvrow').fadeOut(500);
                $('main').fadeOut(500);
                setTimeout(function (event) {
                    event.obj.run();
                }, 500, {obj: event.obj});
            }, this.feedbackDuration, {obj: this});
        } else {
            setTimeout(function (event) {
                    $('#TextBoxDiv').fadeOut(500);
                    setTimeout(function (event) {
                        $('#Stage').empty();
                        $('#Bottom').empty();
                        event.obj.nextFunc(event.obj.nextParams);
                    }, event.obj.feedbackDuration, {obj: event.obj})
                }, this.feedbackDuration, {obj: this}
            );
        }
    };
}


class SliderManager {

    constructor({
                    exp,
                    trialObj,
                    imgObj,
                    sessionNum,
                    phaseNum,
                    feedbackDuration,
                    elicitationType,
                    nextFunc,
                    nextParams
                } = {}) {
        // members
        this.exp = exp;
        this.trialObj = trialObj;
        this.nTrial = trialObj.length;

        this.sessionNum = sessionNum;
        this.phaseNum = phaseNum;

        this.imgObj = imgObj;
        this.trialNum = 0;

        this.invertedPosition = shuffle(
            Array.from(Array(this.nTrial), x => randint(0, 1))
        );

        this.feedbackDuration = feedbackDuration;

        this.elicitationType = elicitationType;

        this.nextFunc = nextFunc;
        this.nextParams = nextParams;
    }

    /* =================== public methods ================== */

    run() {

        GUI.init();

        let trialObj = this.trialObj[this.trialNum];

        let choiceTime = (new Date()).getTime();

        let params = {
            stimIdx: trialObj[0],
            p1: trialObj[1],
            ev1: trialObj[2],
            r1: [-1, 1],
            isCatchTrial: trialObj[trialObj.length - 1],
            choiceTime: choiceTime
        };

        let option1 = this.imgObj[params["stimIdx"]];
        option1.id = "option1";
        option1 = option1.outerHTML;

        let str = GUI.displayOptionSlider(option1);

        $('#TextBoxDiv').html(str);

        rangeInputRun();

        let slider = document.getElementById('slider');
        let output = document.getElementById('output');
        let form = document.getElementById('form');

        let clickEnabled = true;

        form.oninput = function () {
            output.value = slider.valueAsNumber;
            output.innerHTML += "%";
        };

        $('#ok').click({obj: this}, function (event) {
            if (clickEnabled) {
                clickEnabled = false;
                let choice = slider.value;
                event.data.obj._clickEvent(choice, params);
            }
        });

    };

    /* =================== private methods ================== */

    _clickEvent(choice, params) {

        let reactionTime = (new Date()).getTime();
        let invertedPosition = this.invertedPosition[this.trialNum];
        let ev1 = params["ev1"];

        let [correctChoice, thisReward, otherReward, pLottery, elicDistance] = this._getReward(choice, params);

        if (this.exp.online) {
            sendToDB(0,
                {
                    exp: this.exp.expName,
                    expID: this.exp.expID,
                    id: this.exp.subID,
                    test: 0,
                    trial: this.trialNum,
                    elicitation_type: this.elicitationType,
                    cont_idx_1: contIdx1,
                    cont_idx_2: contIdx2,
                    condition: -1,
                    symL: -1,
                    symR: -1,
                    choice: choice,
                    correct_choice: correctChoice,
                    outcome: thisReward,
                    cf_outcome: otherReward,
                    choice_left_right: -1,
                    reaction_time: reactionTime - params["choiceTime"],
                    reward: this.exp.totalReward,
                    session: this.sessionNum,
                    p1: p1[1],
                    p2: p2[1],
                    option1: -1,
                    option2: -1,
                    ev1: Math.round(ev1 * 100) / 100,
                    ev2: -1,
                    iscatch: params["isCatchTrial"],
                    inverted: invertedPosition,
                    choice_time: -1,
                    elic_distance: elicDistance,
                    p_lottery: pLottery
                },
                'php/InsertLearningDataDB.php'
            );
        }

        this._next();

    }

    _getReward(choice, params) {

        let p1 = params["p1"];
        let r1 = params["r1"];
        let thisReward = undefined;

        let pLottery = Math.random().toFixed(2);
        if (pLottery < (choice / 100)) {
            thisReward = r1[+(Math.random() < p1[1])];
        } else {
            thisReward = r1[+(Math.random() < pLottery)]
        }
        let otherReward = -1;

        let correctChoice = +((choice / 100) === p1[1]);
        let elicDistance = Math.abs(choice - p1[1] * 100);

        this.exp.sumReward[this.phaseNum] += thisReward;

        this.exp.totalReward += thisReward * !([-1, -2].includes(this.sessionNum));

        return [correctChoice, thisReward, otherReward, pLottery, elicDistance]

    };

    _next() {
        this.trialNum++;
        if (this.trialNum < this.nTrial) {
            setTimeout(function (event) {
                $('#stimrow').fadeOut(500);
                $('#fbrow').fadeOut(500);
                $('#cvrow').fadeOut(500);
                $('main').fadeOut(500);
                setTimeout(function (event) {
                    event.obj.run();
                }, 500, {obj: event.obj});
            }, this.feedbackDuration, {obj: this});
        } else {
            this.nextFunc(this.nextParams);
        }
    };
}


class Instructions {

    constructor(exp) {
        this.exp = exp;
    }

    goFullscreen(nextFunc, nextParams) {

        GUI.init();

        let Title = '<H3 align = "center">To continue the experiment, you must enable fullscreen.</H3><br>';
        let Button = '<div align="center">' +
            '<input align="center" id="fullscreen" type="button" value="Enable fullscreen"' +
            ' class="btn btn-default" onclick="openFullscreen();"></div>';

        $('#TextBoxDiv').html(Title);
        $('#Bottom').html(Button);

        let elem = document.documentElement;
        let button = document.getElementById('fullscreen');

        button.onclick = function () {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.mozRequestFullScreen) { /* Firefox */
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE/Edge */
                elem.msRequestFullscreen();
            }
            nextFunc(nextParams);
        }
    }

    setUserID(nextFunc, nextParams) {

        GUI.init();

        let Title = '<H3 align = "center">Please enter your Prolific ID: <input type="text" id = "textbox_id" name="ID"></H3>';
        let Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="toConsent" value="Next" ></div>';

        let TextInput = '';

        $('#TextBoxDiv').html(Title + TextInput);

        $('#Bottom').html(Buttons);

        $('#toConsent').click({obj: this}, function (event) {

            if (document.getElementById('textbox_id').value !== '') {
                event.data.obj.exp.subID = document.getElementById('textbox_id').value;
                $('#TextBoxDiv').remove();
                $('#Stage').empty();
                $('#Bottom').empty();
                nextFunc(nextParams);
            } else {
                alert('You must enter your Prolific ID.');
            }
        });
    };

    displayConsent(nextFunc, nextParams) {

        GUI.init();

        let Title = '<H2 align = "center">CONSENT</H2><br>';

        let Info = '<H4>INFORMATION FOR THE PARTICIPANT</H4>' +
            'You are about to participate in the research study entitled:<br>' +
            'The domain-general role of reinforcement learning-based training in cognition across short and long time-spans<br>' +
            'Researcher in charge: Pr. Stefano PALMINTERI<br>' +
            'This study aims to understand the learning processes in decision-making. Its fundamental purpose is to investigate the cognitive mechanisms of these' +
            'learning and decision-making processes.' +
            'The proposed experiments have no immediate application or clinical value, but they will allow us to improve our understanding of the functioning brain.<br>' +
            'We are asking you to participate in this study because you have been recruited by the RISC or Prolific platforms. <br>' +
            '<H4>PROCEDURE</H4>' +
            'During your participation in this study, we will ask you to answer several simple questionnaires and tests, which do not require any particular competence.' +
            'Your internet-based participation will require approximately 30 minutes. <br>' +
            '<H4>VOLUNTARY PARTICIPATION AND CONFIDENTIALITY</H4>' +
            'Your participation in this study is voluntary. This means that you are consenting to participate in this project without external pressure.' +
            'During your participation in this project, the researcher in charge and his staff will collect and record information about you.<br>' +
            'In order to preserve your identity and the confidentiality of the data, the identification of each file will be coded, thus preserving the anonymity of your answers. ' +
            'We will not collect any personal data from the RISC or Prolific platforms.<br>' +
            'The researcher in charge of this study will only use the data for research purposes in order to answer the scientific objectives of the project.' +
            'The data may be published in scientific journals and shared within the scientific community,' +
            'in which case no publication or scientific communication will contain identifying information. <br>' +
            '<H4>RESEARCH RESULTS AND PUBLICATION</H4>' +
            'You will be able to check the publications resulting from this study on the following link:<br>' +
            'https://sites.google.com/site/stefanopalminteri/publications<br>' +
            '<H4>CONTACT AND ADDITIONAL INFORMATION</H4>' +
            'Email: humanreinforcementlearning@gmail.com<br>' +
            'This research has received a favorable opinion from the Inserm Ethical Review Committee / IRB0888 on November 13th, 2018.<br>' +
            'Your participation in this research confirms that you have read this information and wish to participate in the research study.<br><br>' +
            '<H4>Please check all boxes before starting:<H4>';

        let Ticks = '<H4><input type="checkbox" name="consent" value="consent1"> I am 18 years old or more<br>' +
            '<input type="checkbox" name="consent" value="consent2"> My participation in this experiment is voluntary <br>' +
            '<input type="checkbox" name="consent" value="consent3"> I understand that my data will be kept confidential and I can stop at any time without justification <br></H4>';

        let Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="toInstructions" value="Next" ></div>';

        $('#TextBoxDiv').html(Title + Info + Ticks);
        $('#Bottom').html(Buttons);

        $('#toInstructions').click(function () {
            if ($("input:checkbox:not(:checked)").length > 0) {
                alert('You must tick all check boxes to continue.');
            } else {
                $('#TextBoxDiv').remove();
                $('#Stage').empty();
                $('#Bottom').empty();
                nextFunc(nextParams);
            }
        });
    }

    displayInitialInstruction(funcParams, nextFunc, nextParams) {

        let nPages = 2;
        let pageNum = funcParams["pageNum"];

        GUI.init();

        let Title = '<H2 align = "center">INSTRUCTIONS</H2>';
        let Info;
        switch (pageNum) {

            case 1:
                Info = '<H3 align = "center">This experiment is composed of 4 phases.<br><br>'
                    + 'The first three phases consist in different cognitive tests.<br><br>'
                    + 'There will be a training session composed of shorter versions of the 3 phases before the actual experiment starts.<br>'
                    + '<br><br> </H3>';
                break;

            case 2:
                Info = '<H3 align = "center">In addition of the fixed compensation provided by Profilic, you have been endowed with an additional 2.5 pounds. '
                    + '<br><br>Depending on your choices you can either double this endowment or lose it.<br><br>Following experimental economics methodological standards, no deception is involved concerning the calculation of the final payoff.'
                    + '<br> Across the three phases of the experiment, you can win a bonus up to ' + this.exp.maxPoints + ' points = ' + this.exp.pointsToPounds(this.exp.maxPoints).toFixed(2) + ' pounds!';
                break;
        }
        $('#TextBoxDiv').html(Title + Info);

        let Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="Back" value="Back" >\n\
		<input align="center" type="button"  class="btn btn-default" id="Next" value="Next" >\n\
		<input align="center" type="button"  class="btn btn-default" id="Start" value="Start the first phase!" ></div>';

        $('#Bottom').html(Buttons);

        if (pageNum === 1) {
            $('#Back').hide();
        }

        if (pageNum === nPages) {
            $('#Next').hide();
        }

        if (pageNum < nPages) {
            $('#Start').hide();
        }

        $('#Back').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            if (pageNum === 1) {
            } else {
                event.data.obj.displayInitialInstruction({pageNum: pageNum - 1}, nextFunc, nextParams);
            }

        });

        $('#Next').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();
            event.data.obj.displayInitialInstruction({pageNum: pageNum + 1}, nextFunc, nextParams);
        });

        $('#Start').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            if (event.data.obj.exp.online) {
                sendToDB(0,
                    {
                        expID: event.data.obj.expID,
                        id: event.data.obj.subID,
                        exp: event.data.obj.expName,
                        browser: event.data.obj.browsInfo
                    },
                    'php/InsertExpDetails.php'
                );

            }
            nextFunc(nextParams);
        });
    }

    displayInstructionLearning(funcParams, nextFunc, nextParams) {

        GUI.init();

        let nPages = 3;
        let pageNum = funcParams["pageNum"];
        let isTraining = funcParams["isTraining"];
        let phaseNum = funcParams['phaseNum'];

        let Title = '<H2 align="center">INSTRUCTIONS</H2>';
        let Info;

        switch (pageNum) {

            case 1:
                Info = '<H3 align="center"><b>Instructions for the first test (1/2)</b><br><br>'
                    + 'In each round you have to choose between one of two symbols displayed on either side of the screen.<br><br>'
                    + 'You can select one of the two symbols by left-clicking on it. <br><br>'
                    + 'After a choice, you can win/lose the following outcomes:<br><br>'
                    + '1 point = +' + this.exp.pointsToPence(1).toFixed(2) + ' pence<br>'
                    + '-1 points = -' + this.exp.pointsToPence(1).toFixed(2) + ' pence<br><br>'
                    + 'The outcome of your choice will appear in the location of the symbol you chose.<br><br>'
                    + 'The outcome you would have won by choosing the other option will also be displayed.<br><br>'
                    + 'Please note that only the outcome of your choice will be taken into account in the final payoff.<br><br></H3>';
                break;

            case 2:
                Info = '<H3 align="center"><b>Instructions for the first test (2/2)</b><br><br>'
                    + 'The different symbols are not equal in terms of outcome: one is in average more advantageous compared to the other in terms of points to be won.<br><br>'
                    + 'At the end of the test you will be shown with the final payoff in terms of cumulated points and monetary bonus.<br><br></H3>';

                break;

            case 3:
                let like;
                if (isTraining) {
                    Info = '<H3 align="center">Let' + "'s " + 'begin with the first training test!<br><br>'
                        + '<b>(Note : points won during the training do not count for the final payoff !)<br><br>'
                        + 'The word "ready" will be displayed before the actual game starts.</H3></b><br><br>';
                    like = '';
                } else {
                    Title = '<H2 align="center">PHASE ' + phaseNum + '</H2><br>';
                    Info = '<h3 align="center"><b>Note:</b> The test of the phase 1 is like the first test of the training.<br><br>';

                    like = 'This is the actual game, every point will be included in the final payoff.<br><br>'
                        + 'Ready? <br></H3>';
                }
                Info += like;
                break;
        }

        $('#TextBoxDiv').html(Title + Info);

        let Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="Back" value="Back" >\n\
		<input align="center" type="button"  class="btn btn-default" id="Next" value="Next" >\n\
		<input align="center" type="button"  class="btn btn-default" id="Start" value="Start the first phase!" ></div>';

        $('#Bottom').html(Buttons);

        if (pageNum === 1) {
            $('#Back').hide();
        }

        if (pageNum === nPages) {
            $('#Next').hide();
        }

        if (pageNum < nPages) {
            $('#Start').hide();
        }

        $('#Back').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            funcParams['pageNum'] -= 1;

            if (pageNum === 1) {
            } else {
                event.data.obj.displayInstructionLearning(funcParams, nextFunc, nextParams);
            }

        });
        $('#Next').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();
            funcParams['pageNum'] += 1;
            event.data.obj.displayInstructionLearning(funcParams, nextFunc, nextParams);
        });

        $('#Start').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            nextFunc(nextParams);
        });
    }

    displayInstructionChoiceElicitation(funcParams, nextFunc, nextParams) {

        GUI.init();

        let isTraining = funcParams['isTraining'];
        let phaseNum = funcParams['phaseNum'];
        let pageNum = funcParams['pageNum'];
        let points = this.exp.sumReward[phaseNum];
        let pence = this.exp.pointsToPence(points).toFixed(2);
        let pounds = this.exp.pointsToPounds(points).toFixed(2);
        let nPages = 3;
        let Title;
        let p;
        let like;
        let wonlost;

        let Info;
        let trainstring;

        if (isTraining) {
            Title = '<H2 align = "center">INSTRUCTIONS</H2><br>';
            p = '<b>(Note: points won during the training do not count for the final payoff!)<br><br>'
                + '<b>The word "ready" will be displayed before the actual game starts.</b></H3><br><br>';
            like = '';
        } else {
            Title = '<H2 align = "center">PHASE ' + phaseNum + '</H2><br>';
            like = '<h3 align="center"><b>Note:</b> The test of the phase 2 is like the second test of the training.</h3><br><br>';

            p = 'This is the actual game, every point will be included in the final payoff.<br><br>'
                + 'Ready? <br></H3>';
        }

        switch (pageNum) {
            case 1:
                wonlost = ['won', 'lost'][+(points < 0)];

                Info = '<H3 align = "center">You ' + wonlost + ' ' + points +
                    ' points = ' + pence + ' pence = ' + pounds + ' pounds!</h3><br><br>';

                Info += like;

                Info += '<H3 align="center"> <b>Instructions for the second test (1/2)</b><br><br>'
                    + 'In each round you have to choose between one of two items displayed on either side of the screen.<br>'
                    + 'You can select one of the two items by left-clicking on it.<br><br>'
                    + 'Please note that the outcome of your choice will not be displayed on each trial.<br>'
                    + 'However, for each choice an outcome will be calculated and taken into account for the final payoff.<br>'
                    + 'At the end of the test you will be shown with the final payoff in terms of cumulated points and monetary bonus.<br><br></H3>';

                break;

            case 2:
                Info = '<H3 align="center"> <b>Instructions for the second test (2/2)</b><br><br>'
                    + 'In the second test  there will be two kind of options.<br>'
                    + 'The first kind of options is represented by the symbols you already met during the previous test.<br><br>'
                    + '<b>Note</b>: the symbols keep the same outcome as in the first test.<br><br>'
                    + 'The second kind of options is represented by pie-charts explicitly describing the odds of winning / losing a point.<br><br>'
                    + 'Specifically, the green area indicates the chance of winning +1 (+' + this.exp.pointsToPence(1).toFixed(2) + 'p) ; the red area indicates the chance of losing -1 (+'
                    + this.exp.pointsToPence(1).toFixed(2) + 'p).<br><br>';
                break;

            case 3:
                if (isTraining) {
                    trainstring = "Let's begin with the second training test!<br>";
                } else {
                    trainstring = "";
                }

                Info = '<H3 align="center">' + trainstring + p;
                break;

        }

        $('#TextBoxDiv').html(Title + Info);

        let Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="Back" value="Back" >\n\
            <input align="center" type="button"  class="btn btn-default" id="Next" value="Next" >\n\
            <input align="center" type="button"  class="btn btn-default" id="Start" value="Start!" ></div>';

        $('#Bottom').html(Buttons);

        if (pageNum === 1) {
            $('#Back').hide();
        }

        if (pageNum === nPages) {
            $('#Next').hide();
        }

        if (pageNum < nPages) {
            $('#Start').hide();
        }

        $('#Back').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            funcParams['pageNum'] -= 1;

            if (pageNum === 1) {
            } else {
                event.data.obj.displayInstructionChoiceElicitation(funcParams, nextFunc, nextParams);
            }
        });

        $('#Next').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();
            funcParams['pageNum'] += 1;
            event.data.obj.displayInstructionChoiceElicitation(funcParams, nextFunc, nextParams);

        });

        $('#Start').click(function () {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            let ready;
            let steady;
            let go;

            if (isTraining) {
                ready = '3...';
                steady = '2...';
                go = '1...';
            } else {
                ready = 'Ready...';
                steady = 'Steady...';
                go = 'Go!';
            }

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            setTimeout(function () {
                $('#Stage').html('<H1 align = "center">' + ready + '</H1>');
                setTimeout(function () {
                    $('#Stage').html('<H1 align = "center">' + steady + '</H1>');
                    setTimeout(function () {
                        $('#Stage').html('<H1 align = "center">' + go + '</H1>');
                        setTimeout(function () {
                            $('#Stage').empty();
                            nextFunc(nextParams);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 10);
        });
    }

    displayInstructionSliderElicitation(funcParams, nextFunc, nextParams) {

        GUI.init();

        let isTraining = funcParams['isTraining'];
        let pageNum = funcParams['pageNum'];
        let phaseNum = funcParams['phaseNum'];

        let trainstring;
        let wonlost;

        let points = this.exp.sumReward[phaseNum];
        let pence = this.exp.pointsToPence(points).toFixed(2);
        let pounds = this.exp.pointsToPounds(points).toFixed(2);

        let nPages = 4;

        let Info;

        let Title = '<H2 align="center">INSTRUCTIONS</H2><br>';

        switch (pageNum) {
            case 1:
                wonlost = ['won', 'lost'][+(points < 0)];

                Info = '<H3 align = "center">You ' + wonlost + ' ' + points +
                    ' points = ' + pence + ' pence = ' + pounds + ' pounds!</h3><br><br>';

                Info += '<H3 align = "center"><b>Instructions for the third test (1/3)</b><br><br>'
                    + 'In each round of third test you will be presented with the symbols and pie-charts you met in the first and the second test.<br><br>'
                    + 'You will be asked to indicate (in percentages), what are the odds that a given symbol or pie-chart makes you win a point (+1=+' + this.exp.pointsToPence(1).toFixed(2) + 'p).<br><br>'
                    + 'You will be able to do this through moving a slider on the screen and then confirm your final answer by clicking on the confirmation button.<br><br>'
                    + '100%  = the symbol (or pie-chart) always gives +1pt.<br>'
                    + '50%  = the symbol (or pie-chart) always gives +1pt or -1pt with equal chances.<br>'
                    + '0% = the symbol (or pie-chart) always gives -1pt.<br><br>';
                break;

            case 2:
                Info = '<H3 align = "center"><b>Instructions for the third test (2/3)</b><br><br>'
                    + 'After confirming your choice (denoted C hereafter) the computer will draw a random lottery number (denoted L hereafter) between 0 and 100.<br>'
                    + 'If C is bigger than L, you win the reward with the probabilities associated to the symbol.<br>'
                    + 'If C is smaller than L, the program will spin a wheel of fortune and you will win a reward of +1 point with a probability of L%, otherwise you will lose -1 point.<br><br>';
                break;

            case 3:
                Info = '<H3 align = "center"><b>Instructions for the third test (3/3)</b><br><br>'
                    + 'To sum up, the higher the percentage you give, the higher the chances are the outcome will be determined by the symbol or the pie-chart.<br><br>'
                    + 'Conversely, the lower the percentage, the higher the chances are the outcome will be determined by the random lottery number.<br><br>'
                    + 'Please note that the outcome of your choice will not be displayed on each trial.<br><br>'
                    + 'However, for each choice an outcome will be calculated and taken into account for the final payoff.<br><br>'
                    + 'At the end of the test you will be shown with the final payoff in terms of cumulated points and monetary bonus.<br><br>'
                break;

            case 4:
                let like;
                if (isTraining) {
                    Info = '<H3 align="center">Let' + "'s " + 'begin with the third training test!<br><br>'
                        + '<b>(Note : points won during the training do not count for the final payoff !)<br><br>'
                        + 'The word "ready" will be displayed before the actual game starts.</H3></b><br><br>';
                    like = '';
                } else {
                    Title = '<H2 align="center">PHASE ' + phaseNum + '</H2><br>';
                    Info = '<h3 align="center"><b>Note:</b> The test of the phase 3 is like the third test of the training.<br><br>';

                    like = 'This is the actual game, every point will be included in the final payoff.<br><br>'
                        + 'Ready? <br></H3>';
                }
                Info += like;
                break;
        }

        $('#TextBoxDiv').html(Title + Info);

        let Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="Back" value="Back" >\n\
            <input align="center" type="button"  class="btn btn-default" id="Next" value="Next" >\n\
            <input align="center" type="button"  class="btn btn-default" id="Start" value="Start!" ></div>';

        $('#Bottom').html(Buttons);

        if (pageNum === 1) {
            $('#Back').hide();
        }

        if (pageNum === nPages) {
            $('#Next').hide();
        }

        if (pageNum < nPages) {
            $('#Start').hide();
        }

        $('#Back').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            funcParams['pageNum'] -= 1;

            if (pageNum === 1) {
            } else {
                event.data.obj.displayInstructionSliderElicitation(funcParams, nextFunc, nextParams);
            }
        });

        $('#Next').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            funcParams['pageNum'] += 1;

            event.data.obj.displayInstructionSliderElicitation(funcParams, nextFunc, nextParams);

        });

        $('#Start').click(function () {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            let ready;
            let steady;
            let go;

            if (isTraining) {
                ready = '3...';
                steady = '2...';
                go = '1...';
            } else {
                ready = 'Ready...';
                steady = 'Steady...';
                go = 'Go!';
            }

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            setTimeout(function () {
                $('#Stage').html('<H1 align = "center">' + ready + '</H1>');
                setTimeout(function () {
                    $('#Stage').html('<H1 align = "center">' + steady + '</H1>');
                    setTimeout(function () {
                        $('#Stage').html('<H1 align = "center">' + go + '</H1>');
                        setTimeout(function () {
                            $('#Stage').empty();
                            nextFunc(nextParams);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 10);
        });
    }

    endTraining(funcParams, nextFunc, nextParams) {


        GUI.init();

        let sessionNum = funcParams['sessionNum'];

        let Title;
        let Info;
        let totalPoints;
        let pence;
        let pounds;
        let wonlost;

        Title = '<H2 align = "center">END OF THE TRAINING</H2>';
        Info = '';

        totalPoints = this.exp.sumReward[1] + this.exp.sumReward[2] + this.exp.sumReward[3];
        pence = this.exp.pointsToPence(totalPoints).toFixed(2);
        pounds = this.exp.pointsToPounds(totalPoints).toFixed(2);

        wonlost = ['won', 'lost'][+(totalPoints < 0)];

        Info += '<H3 align="center"> The training is over!<br><br>';
        Info += 'Overall, in this training, you ' + wonlost + ' ' + totalPoints +
            ' points = ' + pence + ' pence = ' + pounds + ' pounds!<br><br>';

        Info += 'Test 1: ' + this.exp.sumReward[1] + '<br>';
        Info += 'Test 2: ' + this.exp.sumReward[2] + '<br>';
        Info += 'Test 3: ' + this.exp.sumReward[3] + '<br>';

        Info += 'Now, you are about to start the first phase of the experiment.<br> Note that from now on the points will be counted in your final payoff.'
            + ' Also note that the experiment includes much more trials and more points are at stake, compared to the training.<br>'
            + 'Finally note that the real test will involve different symbols (i.e., not encountered in the training).<br>'
            + 'If you want you can do the training a second time.</h3><br><br>';

        $('#TextBoxDiv').html(Title + Info);

        let Buttons = '<div align="center">\n\
            <input align="center" type="button"  class="btn btn-default" id="Training" value="Play training again" >\n\
            <input align="center" type="button"  class="btn btn-default" id="Next" value="Next" >\n\
            </div>';

        $('#Bottom').html(Buttons);

        if (sessionNum === this.exp.maxTrainingNum)
            $('#Training').hide();

        $('#Training').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();

            event.data.obj.exp.sumReward[0] = 0;
            event.data.obj.exp.sumReward[1] = 0;
            event.data.obj.exp.sumReward[2] = 0;
            event.data.obj.exp.sumReward[3] = 0;
            nextParams['phaseNum'] = 1;
            nextParams['sessionNum'] = -2;
            nextParams['instructionNum'] = 4;
            nextFunc(nextParams);
            // TODO: restart training
            // nextParams

        });

        $('#Next').click({obj: this}, function (event) {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();
            nextFunc(nextParams);
        });
    }

    endExperiment() {

        GUI.init();

        let points = this.exp.totalReward;
        let pence = this.exp.pointsToPence(points).toFixed(2);
        let pounds = this.exp.pointsToPounds(points).toFixed(2);

        let wonlost = [' won ', ' lost '][+(points < 0)];

        let Title = '<h3 align = "center">The game is over!<br>' +
            'You ' + wonlost + points + ' points in total, which is ' + pence + ' pence = ' + pounds + ' pounds!<br><br>' +
            'With your initial endowment, you won a total bonus of ' + (parseFloat(pence) + 250) + ' pence = ' + (parseFloat(pounds) + 2.5) + ' pounds!<br><br>' +
            'Thank you for playing!<br><br>Please click the link to complete this study:<br></h3><br>';

        let url = '<center><a href="' + this.exp.link + '">Click here.</a></center>';

        $('#TextBoxDiv').html(Title + url);
    }


}



// Questionnaires
// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ //
function Questionnaire() {


    function run() {

        createDiv('Stage', 'TextBoxDiv');

        var Title = '<H3 align = "center">QUESTIONNAIRE</H3>';

        var startBut;
        startBut = '"Start"';
        var Info = '<H3 align = "center">You will now have to answer a few questions.<br><br>This won\'t take more than a few more minutes.<br><br>Your answers remain anonymous and will not be disclosed.<br><br>' +
            'Note that the experiment will be considered completed (and the payment issued) only if the questionnaires are correctly filled.<br><br>' +
            'Please click "Start" when you are ready.</H3><br><br>';

        $('#TextBoxDiv').html(Title + Info);

        var Buttons = '<div align="center"><input align="center" type="button"  class="btn btn-default" id="Start" value=' + startBut + ' ></div>';

        $('#Bottom').html(Buttons);

        $('#Start').click(function () {

            $('#TextBoxDiv').remove();
            $('#Stage').empty();
            $('#Bottom').empty();
            playQuestionnaire_CRT(1);
        });
    }

    function playQuestionnaire_CRT(QuestNum) {

        var NumQuestions = 7; /*mettre a jour le nombre de pages (questions) via le script*/

        createDiv('Stage', 'TextBoxDiv');

        var Title = '<H2 align = "center"></H2>';
        var Info;
        var questID;
        var itemNum;
        var answer;
        var answer_value;

        var Question_time;
        var Reaction_time;

        var nb_skip = 7;


        switch (QuestNum) {

            case 1:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'A bat and a ball cost £1.10 in total. The bat costs £1.00 more than the ball. How much does the ball cost?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 5 pence </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 10 pence </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 9 pence </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 1 pence </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 1;

                break;

            case 2:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 5 minutes </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 100 minutes </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 20 minutes </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 500 minutes </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 2;

                break;

            case 3:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'In a lake, there is a patch of lily pads. Every day, the patch doubles in size. If it takes 48 days for the patch to cover the entire lake, how long would it take for the patch to cover half of the lake?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 47 days </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 24 days </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 12 days </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 36 days </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 3;

                break;

            case 4:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'If John can drink one barrel of water in 6 days, and Mary can drink one barrel of water in 12 days, how long would it take them to drink one barrel of water together?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 4 days </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 9 days </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 12 days </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 3 days </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 4;

                break;

            case 5:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Jerry received both the 15th highest and the 15th lowest mark in the class. How many students are in the class?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 29 students </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 30 students </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 1 student </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 15 students </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 5;

                break;

            case 6:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'A man buys a pig for £60, sells it for £70, buys it back for £80, and sells it finally for £90. How much has he made?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 20 pounds </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 10 pounds </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 0 pounds </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 30 pounds </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 6;

                break;

            case 7:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Simon decided to invest £8,000 in the stock market one day early in 2008.  Six months after he invested, on July 17, the stocks he had purchased were down 50%. ' +
                    'Fortunately for Simon, from July 17 to October 17, the stocks he had purchased went up 75%. At this point, Simon:' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> has lost money. </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> is ahead of where he began. </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> has broken even in the stock market. </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> it cannot be determined. </label><br>';
                contents = shuffle(contents);
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 7;

                break;

            default:
                break;
        }

        var Buttons = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"> <input type="button"  class="btn btn-default" id="Next" value="Next" > </div><div class="col-xs-1 col-md-1"></div></div>';


        $('#TextBoxDiv').html(Title + Info + Ticks);

        Question_time = (new Date()).getTime();

        $('#Bottom').html(Buttons);


        $('#Next').click(function () {

            if ($("input:radio:checked").length < 1) {
                alert('Please select one answer.');

            } else {

                Reaction_time = (new Date()).getTime();
                answer = parseInt($("input:radio:checked").attr('value')); //console.log(answer)
                answer_value = $("input:radio:checked").val();

                SendQuestDataDB(0);

                $('#TextBoxDiv').remove();
                $('#Stage').empty();
                $('#Bottom').empty();

                if (answer == -1) {
                    QuestNum += nb_skip + 1;
                } else {
                    QuestNum++;
                }

                if (QuestNum <= NumQuestions) {
                    playQuestionnaire_CRT(QuestNum);
                } else {
                    playQuestionnaire_SES(1);
                }
            }
            ;
        });

        function SendQuestDataDB(call) {
            /*console.log(clog)*/

            $.ajax({
                type: 'POST',
                data: {
                    exp: this.expName,
                    expID: expID,
                    id: subID,
                    qid: questID,
                    qnum: 1,
                    item: itemNum,
                    ans: answer,
                    val: answer_value,
                    reaction_time: Reaction_time - Question_time
                },
                async: true,
                url: 'php/InsertQuestionnaireDataDB.php',
                /*dataType: 'json',*/
                success: function (r) {

                    if (r[0].ErrorNo > 0 && call + 1 < maxDBCalls) {
                        SendQuestDataDB(call + 1);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {

                    if (call + 1 < maxDBCalls) {
                        SendQuestDataDB(call + 1);
                    }
                }
            });
        }
    }

    function playQuestionnaire_SES(QuestNum) {

        var NumQuestions = 13;

        createDiv('Stage', 'TextBoxDiv');

        var Title = '<H2 align = "center"></H2>';
        var Info;
        var questID;
        var itemNum;
        var answer;
        var answer_value;

        var Question_time;
        var Reaction_time;

        var nb_skip = 0;

        var Buttons = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"> <input type="button"  class="btn btn-default" id="Next" value="Next" > </div><div class="col-xs-1 col-md-1"></div></div>';

        switch (QuestNum) {

            case 1:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'The following questions measure your perception of your childhood and your current adult life. Please indicate your agreement with these statements. Please read each statement carefully, and then indicate how much you agree with the statement.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> I am ready. </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13_instruction";
                itemNum = 1;

                break;

            case 2:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was growing up, someone in my house was always yelling at someone else.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 1;

                break;

            case 3:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Some of the punishments I received when I was a child now seem too harsh to me.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 2;

                break;

            case 4:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'I guess you could say that I wasn’t treated as well as I should have been at home.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 3;

                break;

            case 5:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, things were often chaotic in my house.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 4;

                break;

            case 6:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, people often moved in and out of my house on a pretty random basis.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 5;

                break;

            case 7:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, I had a hard time knowing what my parents or other people in my house were going to say or do from day-to-day.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 6;

                break;

            case 8:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, my family usually had enough money for things when I was growing up.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 7;

                break;

            case 9:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, I grew up in a relatively wealthy neighborhood.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 8;

                break;

            case 10:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, I felt relatively wealthy compared to the other kids in my school.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 9;

                break;

            case 11:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Now as an adult, I have enough money to buy things I want.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 10;

                break;

            case 12:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Now as an adult, I don\'t need to worry too much about paying my bills.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 11;

                break;

            case 13:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Now as an adult, I don\'t think I\'ll have to worry about money too much in the future.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> 1 Strongly disagree </label><br>' +
                    '<input type= "radio" id="2" name= "answer" value= 2> <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="3" name= "answer" value= 3> <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="4" name= "answer" value= 4> <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="5" name= "answer" value= 5> <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="6" name= "answer" value= 6> <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="7" name= "answer" value= 7> <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="8" name= "answer" value= 8> <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="9" name= "answer" value= 9> <label for="9"> 9 Strongly agree </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 12;

                break;

            case 14:
                var Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Think of this ladder as representing where people stand in their communities. ' +
                    'People define community in different ways: please define it in whatever way is most meaningful to you.<br>' +
                    'At the top of the ladder are the people who have the highest standing in their community. At the bottom are the people who have the lowest standing in their community.<br><br>' +
                    'Where would you place yourself on this ladder?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                var Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="10" name= "answer" value= 10> <label for="10"> 10 Top - highest standing </label><br>' +
                    '<input type= "radio" id="9"  name= "answer" value= 9>  <label for="9"> 9 </label><br>' +
                    '<input type= "radio" id="8"  name= "answer" value= 8>  <label for="8"> 8 </label><br>' +
                    '<input type= "radio" id="7"  name= "answer" value= 7>  <label for="7"> 7 </label><br>' +
                    '<input type= "radio" id="6"  name= "answer" value= 6>  <label for="6"> 6 </label><br>' +
                    '<input type= "radio" id="5"  name= "answer" value= 5>  <label for="5"> 5 </label><br>' +
                    '<input type= "radio" id="4"  name= "answer" value= 4>  <label for="4"> 4 </label><br>' +
                    '<input type= "radio" id="3"  name= "answer" value= 3>  <label for="3"> 3 </label><br>' +
                    '<input type= "radio" id="2"  name= "answer" value= 2>  <label for="2"> 2 </label><br>' +
                    '<input type= "radio" id="1"  name= "answer" value= 1>  <label for="1"> 1 Bottom - lower standing </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13";
                itemNum = 13;

                break;
            default:

                break;

        }

        $('#TextBoxDiv').html(Title + Info + Ticks);

        Question_time = (new Date()).getTime();

        $('#Bottom').html(Buttons);


        $('#Next').click(function () {

            if ($("input:radio:checked").length < 1) {

                alert('Please select one answer.');

            } else {

                Reaction_time = (new Date()).getTime();
                answer = parseInt($("input:radio:checked").attr('id')); //console.log(answer)
                answer_value = $("input:radio:checked").val();

                SendQuestDataDB(0);

                $('#TextBoxDiv').remove();
                $('#Stage').empty();
                $('#Bottom').empty();

                if (answer == -1) {
                    QuestNum += nb_skip + 1;
                } else {
                    QuestNum++;
                }

                if (QuestNum <= NumQuestions + 1) {
                    playQuestionnaire_SES(QuestNum);
                } else {
                    endExperiment();
                }
            }
        });

        function SendQuestDataDB(call) {

            $.ajax({
                type: 'POST',
                data: {
                    exp: this.expName,
                    expID: expID,
                    id: subID,
                    qid: questID,
                    qnum: 5,
                    item: itemNum,
                    ans: answer,
                    val: answer_value,
                    reaction_time: Reaction_time - Question_time
                },
                async: true,
                url: 'php/InsertQuestionnaireDataDB.php',
                /*dataType: 'json',*/
                success: function (r) {
                    if (r[0].ErrorNo > 0 && call + 1 < maxDBCalls) {
                        SendQuestDataDB(call + 1);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {

                    if (call + 1 < maxDBCalls) {
                        SendQuestDataDB(call + 1);
                    }
                }
            });
        }
    }
}

//  Utils
// ------------------------------------------------------------------------------------------------------------------------------------------ //

function getKeyCode(event) {

    return event.which;
}

function getColor(FB) {
    color = borderColor;
    if (FB == 0) {
        color = "black";
    } else if (FB == 1) {
        color = "#07ed19";
    } else if (FB == -1) {
        color = "#f20202";
    } else if (FB == 0.1) {
        color = "#1bb527";
    } else if (FB == -0.1) {
        color = "#ba1616";
    }
    return color;
}

function createCode() {
    return Math.floor(Math.random() * 10000000000);
}

function createDiv(ParentID, ChildID) {

    var d = $(document.createElement('div'))
        .attr("id", ChildID);
    var container = document.getElementById(ParentID);
    d.appendTo(container);
}

function shuffle(array) {
    let counter = array.length;

    /* While there are elements in the array */
    while (counter > 0) {
        /* Pick a random index */
        let index = Math.floor(Math.random() * counter);

        /* Decrease counter by 1 */
        counter--;

        /* And swap the last element with it */
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}  /* function shuffle(array) */

// simple range function
function range(start, stop, step) {
    var a = [start], b = start;
    while (b < stop) {
        a.push(b += step || 1);
    }
    return a;
}

/**
 * Asserts a condition
 * @param condition
 * @param message
 */
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

const sum = arr => arr.reduce((a, b) => a + b, 0);

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

function getBrowser() {

    let nVer = navigator.appVersion;
    let nAgt = navigator.userAgent;
    let browserName = navigator.appName;
    let fullVersion = '' + parseFloat(navigator.appVersion);
    let majorVersion = parseInt(navigator.appVersion, 10);
    let nameOffset, verOffset, ix;

    /*In Opera, the true version is after "Opera" or after "Version"*/
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }

    /*In MSIE, the true version is after "MSIE" in userAgent*/
    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = nAgt.substring(verOffset + 5);
    }

    /*In Chrome, the true version is after "Chrome"*/
    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset + 7);
    }

    /*In Safari, the true version is after "Safari" or after "Version"*/
    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }

    /*In Firefox, the true version is after "Firefox"*/
    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset + 8);
    }

    /*In most other browsers, "name/version" is at the end of userAgent*/
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }

    if ((ix = fullVersion.indexOf(";")) != -1)
        fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(" ")) != -1)
        fullVersion = fullVersion.substring(0, ix);

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return browserName + ' ' + fullVersion + ' ' + majorVersion + ' ' + navigator.appName + ' ' + navigator.userAgent;
} /* function getBrowser() */

function getOS() {
    let OSName = "Unknown OS";
    if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
    if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
    if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
    if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";
    return OSName;
}


function Experiment() {
    /***

     Experiment initializer

     ***/

    // TODO:
    // Initial Experiment Parameters
    // -------------------------------------------------------------------------------------------------- //
    this.online = 0;
    this.completeFeedback = 0;
    this.expName = 'RetrieveAndCompare';
    //var language = "en"; // only en is available at the moment
    let compLink = 1;
    let nSessions = 1;

    this.questionnaire = 1;
    this.maxPoints = 98;

    // Main Exp
    let nCond = 4;
    nCond--; //because of range function
    let nCondPerSession = 4;
    let nTrialsPerCondition = 2;

    this.feedbackDuration = 2000;
    this.sumReward = [0, 0, 0, 0, 0, 0, 0];

    this.totalReward = 0;

    this.maxTrainingNum = -2;

    // Training
    let nCondTraining = 4;
    let nTrialTrainingPerCond = 2;
    let nTrainingTrials = nTrialTrainingPerCond * nCondTraining;//1;
    let maxTrainingSessions = 1;
    let nTrainingImg = nCondTraining * 2;
    nCondTraining--; // because of range function

    // Phase to print
    this.phases = [-1, 1, 2, 3, 1, 2, 3];

    // var nTrialsPerConditionLot = 2;
    // var nTrialsLotteries = (nCond + 1) * nTrialsPerConditionLot;

    this.initTime = (new Date()).getTime();

    this.expID = createCode();

    this.browsInfo = getOS() + ' - ' + getBrowser();

    this.subID = undefined;

    this.link = 'https://app.prolific.ac/submissions/complete?cc=RNFS5HP5';

    // Manage compensations
    // -------------------------------------------------------------------------------------------------- //
    // one point equals 250 pence / maxPoints
    let conversionRate = (250 / this.maxPoints).toFixed(2);
    this.pointsToPence = points => points * conversionRate;
    this.penceToPounds = pence => pence / 100;
    this.pointsToPounds = points => this.penceToPounds(this.pointsToPence(points));

    // Define conditions
    // -------------------------------------------------------------------------------------------------- //
    let probs = [];
    let rewards = [];
    let cont = [];

    // Define ind lotteryCont
    // -------------------------------------------------------------------------------------------------- //
    cont[0] = [1., 0.];
    cont[1] = [0.9, 0.1];
    cont[2] = [0.8, 0.2];
    cont[3] = [0.7, 0.3];
    cont[4] = [0.6, 0.4];
    cont[5] = [0.5, 0.5];
    cont[6] = [0.4, 0.6];
    cont[7] = [0.3, 0.7];
    cont[8] = [0.2, 0.8];
    cont[9] = [0.1, 0.9];
    cont[10] = [0., 1.];

    rewards[0] = [[-1, 1], [-1, 1]];
    probs[0] = [[0.1, 0.9], [0.9, 0.1]];

    rewards[1] = [[-1, 1], [-1, 1]];
    probs[1] = [[0.2, 0.8], [0.8, 0.2]];

    rewards[2] = [[-1, 1], [-1, 1]];
    probs[2] = [[0.3, 0.7], [0.7, 0.3]];

    rewards[3] = [[-1, 1], [-1, 1]];
    probs[3] = [[0.4, 0.6], [0.6, 0.4]];

    // Define conditions
    // -------------------------------------------------------------------------------------------------- //
    let expCondition = [];
    this.learningStim = [];
    this.learningStimTraining = [];
    let conditions = [];

    // range cond for each session
    let cond = shuffle(range(0, nCond));

    for (let i = 0; i < cond.length; i++) {
        expCondition.push(
            Array(nTrialsPerCondition).fill(cond[i]).flat()
        );
    }

    expCondition = expCondition.flat();


    for (let i = 0; i <= nCond; i++)
        conditions.push({
            reward: rewards[i],
            prob: probs[i]
        });

    // training conditions
    let trainingCondition = [];
    for (let i = 0; i < cond.length; i++) {
        trainingCondition.push(
            Array(nTrialTrainingPerCond).fill(cond[i]).flat()
        );
    }
    trainingCondition = trainingCondition.flat();

    // Get stims, feedbacks, resources
    // -------------------------------------------------------------------------------------------------------- //
    let imgPath = 'images/cards_gif/';
    let nImg = 16;
    let imgExt = 'gif';
    let borderColor = "transparent";

    this.images = [];
    let availableOptions = [];
    for (let i = 2; i <= nImg; i++) {
        availableOptions.push(i);
        this.images[i] = new Image();
        this.images[i].src = imgPath + 'stim_old/' + i + '.' + imgExt;
        this.images[i].className = "img-responsive center-block";
        this.images[i].style.border = "5px solid " + borderColor;
        this.images[i].style.position = "relative";
        this.images[i].style.top = "0px";
    }

    let feedbackNames = ["empty", "0", "1", "-1", '-2', '2'];
    this.feedbackImg = [];
    for (var i = 0; i < feedbackNames.length; i++) {
        fb = feedbackNames[i];
        this.feedbackImg[fb] = new Image();
        this.feedbackImg[fb].src = imgPath + 'fb/' + fb + '.' + imgExt;
        this.feedbackImg[fb].className = "img-responsive center-block";
        this.feedbackImg[fb].style.border = "5px solid " + borderColor;
        this.feedbackImg[fb].style.position = "relative";
        this.feedbackImg[fb].style.top = "0px";
    }

    // Training stims
    imgExt = 'jpg';
    this.trainingImg = [];
    let trainingOptions = [];
    let letters = [null, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for (let i = 1; i <= nTrainingImg; i++) {
        trainingOptions.push(i);
        this.trainingImg[i] = new Image();
        this.trainingImg[i].src = imgPath + 'stim/' + letters[i] + '.' + imgExt;
        this.trainingImg[i].className = "img-responsive center-block";
        this.trainingImg[i].style.border = "5px solid " + borderColor;
        this.trainingImg[i].style.position = "relative";
        this.trainingImg[i].style.top = "0px";
    }

    // Elicitations
    // ------------------------------------------------------------------------------------------------------- //
    let expectedValue = [
        "-1", "-0.8", "-0.6", "-0.4", "-0.2", "0", "0.2", "0.4", "0.6", "0.8", "1"];
    let expectedValueMap = {
        '-1': [cont[0], 0],
        '-0.8': [cont[1], 1],
        '-0.6': [cont[2], 2],
        '-0.4': [cont[3], 3],
        '-0.2': [cont[4], 4],
        '0': [cont[5], 5],
        '0.2': [cont[6], 6],
        '0.4': [cont[7], 7],
        '0.6': [cont[8], 8],
        '0.8': [cont[9], 9],
        '1': [cont[10], 10],
    };

    for (let i = 0; i < expectedValue.length; i++) {
        this.images[expectedValue[i]] = new Image();
        this.images[expectedValue[i]].src = imgPath + 'lotteries/' + expectedValue[i] + '.png';
        this.images[expectedValue[i]].className = "img-responsive center-block";
        this.images[expectedValue[i]].style.border = "5px solid " + borderColor;
        this.images[expectedValue[i]].style.position = "relative";
        this.images[expectedValue[i]].style.top = "0px";
        this.trainingImg[expectedValue[i]] = new Image();
        this.trainingImg[expectedValue[i]].src = imgPath + 'lotteries/' + expectedValue[i] + '.png';
        this.trainingImg[expectedValue[i]].className = "img-responsive center-block";
        this.trainingImg[expectedValue[i]].style.border = "5px solid " + borderColor;
        this.trainingImg[expectedValue[i]].style.position = "relative";
        this.trainingImg[expectedValue[i]].style.top = "0px";
    }

    // Define contexts
    // ------------------------------------------------------------------------------------------------------- //
    // training
    trainingOptions = shuffle(trainingOptions);
    let trainingContexts = [];
    let arr = [];
    let elicitationsStimEVTraining = [];
    let elicitationStimTraining = [];
    (new Set(trainingCondition)).forEach(x => arr.push(x));
    let j = 0;

    let catchTrialsTemp = shuffle([
        ["0.8", "-0.8"],
        ["0.6", "-0.6"],
        ["0.6", "-0.4"],
        ["0.4", "-0.4"],
        ["0.4", "-0.6"],
        ["0.2", "-0.2"],
        ["0.4", "-0.2"],
        ["1", "-1"],
    ]);

    let catchTrials = [];
    for (let i = 0; i < catchTrialsTemp.length; i++) {

        let stim1 = catchTrialsTemp[i][0];
        let stim2 = catchTrialsTemp[i][1];

        catchTrials[i] = [
            stim1,
            stim2,
            expectedValueMap[stim1],
            expectedValueMap[stim2],
            true
        ].flat();
    }

    for (let i = 0; i < nTrainingImg; i += 2) {

        trainingContexts[arr[j]] = [
            trainingOptions[i], trainingOptions[i + 1]
        ];
        j++;
    }

    trainingContexts = shuffle(trainingContexts);

    let symbolValueMapTraining = [];

    for (let i = 0; i < trainingContexts.length; i++) {
        let v1 = conditions[i]['prob'][0];
        let v2 = conditions[i]['prob'][1];
        let r = [-1, 1];
        symbolValueMapTraining[trainingContexts[i][0]] = [
            v1,
            cont.findIndex(x => x.toString() === v1.toString()),
            v1[0] * r[0] + v1[1] * r[1],
        ];
        symbolValueMapTraining[trainingContexts[i][1]] = [
            v2,
            cont.findIndex(x => x.toString() === v2.toString()),
            v2[0] * r[0] + v2[1] * r[1]
        ];
    }

    // EXP
    availableOptions = shuffle(availableOptions);
    let contexts = [];

    for (let i = 0; i <= nCond * 2; i += 2) {
        contexts.push([
            availableOptions[i], availableOptions[i + 1]
        ]);
    }
    contexts = shuffle(contexts);

    let symbolValueMap = [];

    for (let i = 0; i < contexts.length; i++) {
        let v1 = conditions[i]['prob'][0];
        let v2 = conditions[i]['prob'][1];
        let r = [-1, 1];
        symbolValueMap[contexts[i][0]] = [
            v1,
            cont.findIndex(x => x.toString() === v1.toString()),
            v1[0] * r[0] + v1[1] * r[1]
        ];
        symbolValueMap[contexts[i][1]] = [
            v2,
            cont.findIndex(x => x.toString() === v2.toString()),
            v2[0] * r[0] + v2[1] * r[1]
        ];
    }

    for (let i = 0; i < nTrainingImg; i += 2) {

        trainingContexts[arr[j]] = [
            trainingOptions[i], trainingOptions[i + 1]
        ];
        j++;

        let stim1 = trainingOptions[i];
        let stim2 = trainingOptions[i+1];

        elicitationStimTraining.push(
            [stim1, symbolValueMapTraining[stim1], false].flat()
        );

        elicitationStimTraining.push(
            [stim2, symbolValueMapTraining[stim2], false].flat()
        );

        let temp = [];
        for (let k = 0; k < probs.length; k++) {
            temp.push([
                trainingOptions[i],
                expectedValue[k],
                symbolValueMapTraining[trainingOptions[i]],
                expectedValueMap[expectedValue[k]],
                false
            ].flat());
        }
        elicitationsStimEVTraining = elicitationsStimEVTraining.concat(shuffle(temp));
        elicitationsStimEVTraining.push(catchTrials[i]);

        temp = [];
        for (let k = 0; k < probs.length; k++) {
            temp.push([
                trainingOptions[i + 1],
                expectedValue[k],
                symbolValueMap[trainingOptions[i + 1]],
                expectedValueMap[expectedValue[k]],
                false
            ].flat());
        }
        elicitationsStimEVTraining = elicitationsStimEVTraining.concat(shuffle(temp));
        elicitationsStimEVTraining.push(catchTrials[i + 1]);

    }

    this.elicitationStimEVTraining = elicitationsStimEVTraining;

    for (let i = 0; i < expCondition.length; i++) {

        let idx = expCondition[i];

        let [stimIdx1, stimIdx2] = contexts[idx];

        this.learningStim.push(
           [stimIdx1, stimIdx2, symbolValueMap[stimIdx1], symbolValueMap[stimIdx2], false].flat()
        );

    }

    for (let i = 0; i < trainingCondition.length; i++) {

        let idx = trainingCondition[i];

        let [stimIdx1, stimIdx2] = trainingContexts[idx];

        this.learningStimTraining.push(
            [stimIdx1, stimIdx2, symbolValueMapTraining[stimIdx1], symbolValueMapTraining[stimIdx2], false].flat()
        );

    }

    // Elicitation
    let elicitationsStim = [];
    this.elicitationStimEV = [];

    let cidx = Array.from(new Set(shuffle(expCondition.flat())));
    let catchIdx = 0;

    for (let j = 0; j < cidx.length; j++) {

        let stim1 = contexts[cidx[j]].flat()[0];
        let stim2 = contexts[cidx[j]].flat()[1];

        elicitationsStim.push([
            stim1,
            symbolValueMap[stim1],
            false
        ].flat());

        elicitationsStim.push([
            stim2,
            symbolValueMap[stim2],
            false
        ].flat());

        let temp = [];
        for (let k = 0; k < expectedValue.length; k++) {
            temp.push(
                [
                    stim1,
                    expectedValue[k],
                    symbolValueMap[stim1],
                    expectedValueMap[expectedValue[k]],
                    false
                ].flat()
            );
        }
        this.elicitationStimEV = this.elicitationStimEV.concat(shuffle(temp));
        this.elicitationStimEV.push(catchTrials[catchIdx]);
        catchIdx++;

        temp = [];
        for (let k = 0; k < expectedValue.length; k++) {
            temp.push(
                [
                    stim2,
                    expectedValue[k],
                    symbolValueMap[stim2],
                    expectedValueMap[expectedValue[k]],
                    false
                ].flat()
            );
        }
        this.elicitationStimEV = this.elicitationStimEV.concat(shuffle(temp));
        this.elicitationStimEV.push(catchTrials[catchIdx]);
        catchIdx++;

    }

    let randExpectedValue = shuffle(expectedValue);
    for (let i = 0; i < 4; i++) {
        elicitationsStim.push([
            randExpectedValue[i],
            expectedValueMap[randExpectedValue[i]],
            false
        ].flat());

    }
    randExpectedValue = shuffle(expectedValue);
    for (let i = 0; i < 2; i++) {
        elicitationStimTraining.push([
            randExpectedValue[i],
            expectedValueMap[randExpectedValue[i]],
            false
        ].flat());
    }

    this.elicitationStimTraining = shuffle(elicitationStimTraining);
    this.elicitationStim = shuffle(elicitationsStim);

}
