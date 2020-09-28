import {GUI} from './gui.js';
import {sendToDB} from "./request.js";
import {shuffle} from "./utils.js";


export class Questionnaire {

    constructor(exp) {
        this.exp = exp;
    }

    runCRT(funcParams, nextFunc, nextParams) {

        let questNum = funcParams['questNum'];

        GUI.panelFlush();
        GUI.panelHide();
        GUI.setActiveCurrentStep('questionnaire');
        GUI.initGameStageDiv();

        let nQuestions = 7;

        let Title = '<H2 align = "center"></H2>';
        let questID;
        let itemNum;
        let answer;
        let answer_value;

        let Question_time;
        let Reaction_time;

        let nb_skip = 7;


        let Info;
        let contents;
        let Ticks;

        switch (questNum) {

            case 1:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'A bat and a ball cost £1.10 in total. The bat costs £1.00 more than the ball. How much does the ball cost?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 5 pence </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 10 pence </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 9 pence </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 1 pence </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 1;

                break;

            case 2:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 5 minutes </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 100 minutes </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 20 minutes </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 500 minutes </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 2;

                break;

            case 3:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'In a lake, there is a patch of lily pads. Every day, the patch doubles in size. If it takes 48 days for the patch to cover the entire lake, how long would it take for the patch to cover half of the lake?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 47 days </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 24 days </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 12 days </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 36 days </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 3;

                break;

            case 4:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'If John can drink one barrel of water in 6 days, and Mary can drink one barrel of water in 12 days, how long would it take them to drink one barrel of water together?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 4 days </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 9 days </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 12 days </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 3 days </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 4;

                break;

            case 5:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Jerry received both the 15th highest and the 15th lowest mark in the class. How many students are in the class?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 29 students </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 30 students </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 1 student </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 15 students </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 5;

                break;

            case 6:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'A man buys a pig for £60, sells it for £70, buys it back for £80, and sells it finally for £90. How much has he made?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> 20 pounds </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> 10 pounds </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> 0 pounds </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> 30 pounds </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 6;

                break;

            case 7:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Simon decided to invest £8,000 in the stock market one day early in 2008.  Six months after he invested, on July 17, the stocks he had purchased were down 50%. ' +
                    'Fortunately for Simon, from July 17 to October 17, the stocks he had purchased went up 75%. At this point, Simon:' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                contents = new Array();
                contents[0] = '<input type= "radio" id="3" name= "answer" value= 2> <label for="3"> has lost money. </label><br>';
                contents[1] = '<input type= "radio" id="2" name= "answer" value= 1> <label for="2"> is ahead of where he began. </label><br>';
                contents[2] = '<input type= "radio" id="1" name= "answer" value= 0> <label for="1"> has broken even in the stock market. </label><br>';
                contents[3] = '<input type= "radio" id="0" name= "answer" value= 0> <label for="0"> it cannot be determined. </label><br>';
                contents = shuffle(contents);
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    contents[0] + contents[1] + contents[2] + contents[3] + '<br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "CRT-7";
                itemNum = 7;

                break;

            default:
                break;
        }

        let Buttons = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">'
            + '<input type="button"  class="btn btn-default card-button" id="Next" value="Next" > </div><div class="col-xs-1 col-md-1"></div></div>';


        $('#TextBoxDiv').html(Title + Info + Ticks + Buttons);

        Question_time = (new Date()).getTime();

        // $('#Bottom').html(Buttons);

        let exp = this.exp;

        $('#Next').click({obj: this}, function (event) {

            if ($("input:radio:checked").length < 1) {
                GUI.displayModalWindow('Error', 'Please select one answer.', 'error');

            } else {

                Reaction_time = (new Date()).getTime();
                answer = parseInt($("input:radio:checked").attr('id')); //console.log(answer)
                answer_value = $("input:radio:checked").val();

                if (exp.online) {
                    sendToDB(0,
                        {
                            exp: exp.expName,
                            expID: exp.expID,
                            id: exp.subID,
                            qid: questID,
                            qnum: 1,
                            item: itemNum,
                            ans: answer,
                            val: answer_value,
                            reaction_time: Reaction_time - Question_time
                        },
                        'php/InsertQuestionnaireDataDB.php'
                    );
                }

                $('#TextBoxDiv').remove();
                $('#Stage').empty();
                $('#Bottom').empty();

                if (answer === -1) {
                    funcParams['questNum'] += nb_skip + 1;
                } else {
                    funcParams['questNum']++;
                }

                if (funcParams['questNum'] <= nQuestions) {
                    event.data.obj.runCRT(funcParams, nextFunc, nextParams);
                } else {
                    nextFunc(nextParams);
                }
            }
        });
    }

    runSES(funcParams, nextFunc, nextParams) {

        GUI.initGameStageDiv();

        let questNum = funcParams['questNum'];
        let nQuestions = 13;

        let Title = '<H2 align = "center"></H2>';
        let Ticks;
        let questID;
        let itemNum;
        let answer;
        let answer_value;

        let Question_time;
        let Reaction_time;

        let nb_skip = 0;

        let Buttons = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"> <input type="button"  class="btn btn-default card-button" id="Next" value="Next" > </div><div class="col-xs-1 col-md-1"></div></div>';

        let Info;

        switch (questNum) {

            case 1:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'The following questions measure your perception of your childhood and your current adult life. Please indicate your agreement with these statements. Please read each statement carefully, and then indicate how much you agree with the statement.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
                    '<input type= "radio" id="1" name= "answer" value= 1> <label for="1"> I am ready. </label><br><br><br><br>' +
                    '</div><div class="col-xs-1 col-md-1"></div></div>';
                questID = "SES-13_instruction";
                itemNum = 1;

                break;

            case 2:
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was growing up, someone in my house was always yelling at someone else.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Some of the punishments I received when I was a child now seem too harsh to me.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'I guess you could say that I wasn’t treated as well as I should have been at home.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, things were often chaotic in my house.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, people often moved in and out of my house on a pretty random basis.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, I had a hard time knowing what my parents or other people in my house were going to say or do from day-to-day.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, my family usually had enough money for things when I was growing up.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, I grew up in a relatively wealthy neighborhood.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'When I was younger than 10, I felt relatively wealthy compared to the other kids in my school.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Now as an adult, I have enough money to buy things I want.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Now as an adult, I don\'t need to worry too much about paying my bills.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Now as an adult, I don\'t think I\'ll have to worry about money too much in the future.' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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
                Info = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7"><H3>' +
                    'Think of this ladder as representing where people stand in their communities. ' +
                    'People define community in different ways: please define it in whatever way is most meaningful to you.<br>' +
                    'At the top of the ladder are the people who have the highest standing in their community. At the bottom are the people who have the lowest standing in their community.<br><br>' +
                    'Where would you place yourself on this ladder?' +
                    '</h3><br><br></div><div class="col-xs-1 col-md-1"></div></div>';
                Ticks = '<div class="row"><div class="col-xs-3 col-md-3"></div><div id = "Middle" class="col-xs-7 col-md-7">' +
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

        $('#TextBoxDiv').html(Title + Info + Ticks + Buttons);

        Question_time = (new Date()).getTime();

        //$('#Bottom').html(Buttons);

        let exp = this.exp;

        $('#Next').click({obj: this}, function (event) {

            if ($("input:radio:checked").length < 1) {

                GUI.displayModalWindow('Error', 'Please select one answer.', 'error');

            } else {

                Reaction_time = (new Date()).getTime();
                answer = parseInt($("input:radio:checked").attr('value')); //console.log(answer)
                answer_value = $("input:radio:checked").val();

                if (exp.online) {
                    sendToDB(0,
                        {
                            exp: exp.expName,
                            expID: exp.expID,
                            id: exp.subID,
                            qid: questID,
                            qnum: 1,
                            item: itemNum,
                            ans: answer,
                            val: answer_value,
                            reaction_time: Reaction_time - Question_time
                        },
                        'php/InsertQuestionnaireDataDB.php'
                    );
                }

                $('#TextBoxDiv').remove();
                $('#Stage').empty();
                $('#Bottom').empty();

                if (answer === -1) {
                    funcParams['questNum'] += nb_skip + 1;
                } else {
                    funcParams['questNum']++;
                }

                if (funcParams['questNum'] <= nQuestions) {
                    event.data.obj.runSES(funcParams, nextFunc, nextParams);
                } else {
                    nextFunc(nextParams);
                }
            }
        });

    }
}
