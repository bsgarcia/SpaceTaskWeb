import {GUI} from './gui.js';
import {sendToDB} from "./request.js";
import {randint} from "./utils.js";


export class Instructions {

    constructor(exp) {
        this.exp = exp;
    }

    goFullscreen(nextFunc, nextParams) {

        GUI.panelSetTitle('Introduction');
        GUI.panelInsertParagraph('To continue the experiment, you must enable fullscreen');
        GUI.panelInsertButton({
            id: 'fullscreen', value: 'Next',
            clickFunc: function () {
                let elem = document.documentElement;
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
        });
    }

    setUserID(nextFunc, nextParams) {

        // GUI.panelFlush();

        $('#icon_prefix').val('player' + randint(1000, 999999999))
        // prolific id is 24 characters
        // GUI.panelSetTitle('');
        // GUI.panelInsertParagraph('Please enter a pseudo.');
        $('#continue').click({obj: this},
            function (event) {
                let answer = $('#icon_prefix').val();

                event.data.obj.exp.subID = answer;
                window.subID = answer;
                $('#pseudo').fadeOut(300);
                nextFunc(nextParams);
            }, nextParams
        );
    }

    displayConsent(nextFunc, nextParams) {

        GUI.panelFlush();

        GUI.panelSetTitle('Consent');

        GUI.panelInsertParagraphTitle('Information for the participant');
        GUI.panelInsertParagraph('You are about to participate in the research study entitled:\n' +
            'The domain-general role of reinforcement learning-based training in cognition across short and long time-spans.\n' +
            'Researcher in charge: Pr. Stefano PALMINTERI.\n' +
            'This study aims to understand the learning processes in decision-making. Its fundamental purpose is to investigate the cognitive mechanisms of these ' +
            'learning and decision-making processes.' +
            'The proposed experiments have no immediate application or clinical value, but they will allow us to improve our understanding of the functioning brain. ' +
            'We are asking you to participate in this study because you have been recruited by the RISC or Prolific platforms.');

        GUI.panelInsertParagraphTitle('Procedure');
        GUI.panelInsertParagraph('During your participation in this study, we will ask you to answer several simple ' +
            'questionnaires and tests, which do not require any particular competence.' +
            'Your internet-based participation will require approximately 50 minutes.');

        GUI.panelInsertParagraphTitle('Voluntary Participation And Confidentiality');
        GUI.panelInsertParagraph('Your participation in this study is voluntary. This means that you are consenting to participate in this project without external pressure.' +
            'During your participation in this project, the researcher in charge and his staff will collect and record information about you. ' +
            'In order to preserve your identity and the confidentiality of the data, the identification of each file will be coded, thus preserving the anonymity of your answers. ' +
            'We will not collect any personal data from the RISC or Prolific platforms. ' +
            'The researcher in charge of this study will only use the data for research purposes in order to answer the scientific objectives of the project.' +
            'The data may be published in scientific journals and shared within the scientific community, ' +
            'in which case no publication or scientific communication will contain identifying information.');


        GUI.panelInsertParagraphTitle('Research Results And Publication');
        GUI.panelInsertParagraph('You will be able to check the publications resulting from this study on the following link: \n' +
            'https://sites.google.com/site/stefanopalminteri/publications');

        GUI.panelInsertParagraphTitle('Contact And Additional Information');
        GUI.panelInsertParagraph('Email: humanreinforcementlearning@gmail.com\n' +
            'This research has received a favorable opinion from the Inserm Ethical Review Committee / IRB0888 on November 13th, 2018.' +
            'Your participation in this research confirms that you have read this information and wish to participate in the research study.');

        GUI.panelInsertCheckBox({text: 'I am 18 years old or more', id: 'c1'});
        GUI.panelInsertCheckBox({text: 'My participation in this experiment is voluntary', id: 'c2'});
        GUI.panelInsertCheckBox({
            text: 'I understand that my data will be kept confidential and I can stop at any time without justification',
            id: 'c3'
        });

        GUI.panelInsertButton({
            value: 'Next', id: 'next',
            clickFunc: function () {
                if ($("input:checkbox:not(:checked)").length > 0) {
                    GUI.displayModalWindow('Error', 'You must tick all check boxes to continue.', 'error');
                } else {
                    nextFunc(nextParams);
                }
            }
        });
    }


    displayInitialInstruction(funcParams, nextFunc, nextParams) {

        let nPages = 1;
        let pageNum = funcParams["pageNum"];

        GUI.panelFlush();
        GUI.panelSetTitle('General Instructions');

        let text = {
            1: 'In this mini-game, you play a spaceship from the Rebel-Alliance trying to escape from the Imperial Fleet.\n\n' +
                ' On your way, you encounter several waves of asteroids. Those asteroids have different colors, which represent' +
                ' different rewards. <b>Your objective is to maximize your score by shooting the right target within' +
                ' different pairs of asteroids</b>.\n\nTo do so, you will be able to move your ship using arrow keys, and shoot using your space key.' +
                '\n <b>Please note that sometimes, after you shoot an asteroid, the reward associated to the other asteroid will also be displayed.</b>' +
                ' However the latter will be displayed in <b>grey</b>, and does <b>not</b> affect your score.\n' +
                'Good luck!'
        };

        GUI.panelSetParagraph(text[pageNum]);

        // to center two buttons inline
        GUI.panelInsertDiv({id: 'buttonBox'});

        GUI.panelInsertButton({
            id: 'back', value: 'Back',
            div: 'buttonBox', classname: 'btn btn-default card-button',
            clickFunc: function () {
                if (pageNum > 1) {
                    pageNum--;
                    GUI.panelSetParagraph(text[pageNum]);
                }
                if (pageNum === 1) {
                    GUI.hideElement('back');
                }
            }
        });

        // If pagenum is 1 we can't go back
        if (pageNum === 1) {
            GUI.hideElement('back');
        }

        GUI.panelInsertButton({
            id: 'next', value: 'Next', clickArgs: {obj: this},
            div: 'buttonBox', classname: 'btn btn-default card-button',
            clickFunc: function (event) {

                GUI.showElement('back');
                if (pageNum < nPages) {
                    pageNum++;
                    GUI.panelSetParagraph(text[pageNum]);
                } else {
                    nextFunc(nextParams);
                }
            }
        });

    }


    displayInstructionQuestionnaire(nextFunc, nextParams) {

        GUI.panelFlush();
        GUI.panelShow();
        GUI.setActiveCurrentStep('questionnaire');
        GUI.panelSetTitle('Questionnaire');

        GUI.panelSetParagraph(
            ` • You will now have to answer a few questions.\n\n
              • This won\'t take more than a few more minutes. Your answers remain anonymous and will not be disclosed.\n\n
              • Note that the experiment will be considered completed (and the payment issued) only if the questionnaires are correctly filled.\n\n
              • Please click "Start" when you are ready.`);

        GUI.panelInsertButton({
            id: 'next', value: 'Start', clickArgs: {obj: this},
            classname: 'btn btn-default card-button card-center',
            clickFunc: function (event) {
                setTimeout(
                    nextFunc(nextParams), 800
                );

            }
        });

    }

    endTraining(funcParams, nextFunc, nextParams) {

        let totalPoints;
        let pence;
        let pounds;
        let wonlost;

        totalPoints = this.exp.sumReward[1] + this.exp.sumReward[2] + this.exp.sumReward[3];
        pence = this.exp.pointsToPence(totalPoints).toFixed(2);
        pounds = this.exp.pointsToPounds(totalPoints).toFixed(2);

        wonlost = ['won', 'lost'][+(totalPoints < 0)];

        GUI.panelFlush();
        GUI.panelShow();
        GUI.setActiveCurrentStep('training');

        GUI.panelSetTitle('End of training');

        GUI.panelSetParagraph(`• The training is over!\n\n
         • Overall, in this training, you ${wonlost} ${totalPoints} points = ${pence} pence = ${pounds} pounds!\n\n
         Test 1: ${this.exp.sumReward[1]}\n
         Test 2: ${this.exp.sumReward[2]}\n
         Test 3: ${this.exp.sumReward[3]}\n\n
         • Now, you are about to start the first phase of the experiment. Note that from now on the points will be counted in your final payoff.\n
           Also note that the experiment includes much more trials and more points are at stake, compared to the training.\n
           Finally note that the real test will involve different symbols (i.e., not encountered in the training).\n\n
         • If you want you can do the training a second time.
        `);

        // to center two buttons inline
        GUI.panelInsertDiv({id: 'buttonBox'});

        GUI.panelInsertButton({
            id: 'toTraining', value: 'Restart training',
            div: 'buttonBox', classname: 'btn btn-default card-button',
            clickFunc: function (event) {
                event.data.obj.exp.sumReward[0] = 0;
                event.data.obj.exp.sumReward[1] = 0;
                event.data.obj.exp.sumReward[2] = 0;
                event.data.obj.exp.sumReward[3] = 0;
                nextParams['phaseNum'] = 1;
                nextParams['sessionNum'] = -2;
                nextParams['instructionNum'] = 4;
                nextFunc(nextParams);
            },
            clickArgs: {obj: this}
        });

        GUI.panelInsertButton({
            id: 'next', value: 'Next', clickArgs: {obj: this},
            div: 'buttonBox', classname: 'btn btn-default card-button',
            clickFunc: function (event) {
                event.data.obj.exp.sumReward[0] = 0;
                event.data.obj.exp.sumReward[1] = 0;
                event.data.obj.exp.sumReward[2] = 0;
                event.data.obj.exp.sumReward[3] = 0;

                GUI.setActiveCurrentStep('experiment');
                setTimeout(
                    nextFunc(nextParams), 800
                );

            }
        });
    }

    endExperiment() {

        GUI.initGameStageDiv();

        let pence = this.exp.pointsToPence(points).toFixed(2);
        let pounds = this.exp.pointsToPounds(points).toFixed(2);

        let wonlost = [' won ', ' lost '][+(points < 0)];

        let Title = '<h3 align = "center">The game is over!<br>' +
            'You ' + wonlost + points + ' points in total, which is ' + pence + ' pence = ' + pounds + ' pounds!<br><br>'
            + 'With your initial endowment, you won a total bonus of ' + (parseFloat(pence) + 250) + ' pence = ' + (parseFloat(pounds) + 2.5) + ' pounds!<br><br>' +
            'Thank you for playing!<br><br><a href="' + this.exp.compLink + '">Please click the link to complete this study</a><br></h3><br>';

        $('#TextBoxDiv').html(Title);
    }

    endExperimentWithFeedback() {

        let score = window.score;

        $('#game').empty();
        GUI.panelFlush();
        GUI.panelShow();
        GUI.setActiveCurrentStep('feedback');
        GUI.panelSetTitle('Thanks! Any feedback?');
        GUI.panelInsertParagraph('You won <b>' + score + '</b> points!\n Thanks for your participation!\n'
            + 'We hope you enjoyed this game. Also, if you have any feedback to provide us with, don\'t hesitate to fill the field below, we\'d be very grateful.\n\n' +
            'Best regards,\n' +
            'The Human Reinforcement Learning Team.');
        GUI.panelInsertParagraphTitle('Feedback');
        GUI.panelInsertTextArea({id: "feedbackField", value: ''});
        GUI.panelInsertButton({
            id: "toSendFeedback", value: "Send!",
            clickArgs: {obj: this},
            clickFunc: function (event) {
                let answer = document.getElementById('feedbackField').value;

                sendToDB(0,
                    {
                        prolificID: event.data.obj.exp.subID,
                        browser: event.data.obj.exp.browsInfo,
                        feedback: answer,
                    },
                    'php/InsertFeedback.php'
                );

                GUI.displayModalWindow('Thanks!',
                    'Thanks for your feedback! We really appreciate it.', 'info');

            }
        });

    }

}
