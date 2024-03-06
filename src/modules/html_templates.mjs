export const getInstructionPage = async (path) => {
  // add loading beer.css
  // document.querySelector('#panel').innerHTML = '<progress style="width:35%; margin: auto"></progress>';
  // read file 
  const file = await fetch(path).then(r => r.text());
  // if there is the word video in it, use video html template
  // 
  let template = `<zero-md src="${path}">
      <template data-merge="append">
        <link rel="stylesheet" href="lib/css/admonition.css">
        <style>
          .markdown-body {
            color: whitesmoke;
            font-size: larger;
            width: 85%; 
            /*margin-top: 10%;*/
            margin: auto;
          }
          
          strong {
            color: #53dbc9;
          }

        </style>
      </template>
      </zero-md>`;

  if (path.includes('inst_8')) {
    template = template.replace('width: 85%', 'width: 100%')
    template = template.replace('margin: auto', '')
    template = template.replace('/*', '')
    template = template.replace('*/', '')
  }

  if (file.includes("display=")) {
    let display = file.split("display=")[1].split("--->")[0]
    document.querySelector('#panel').style.display = display;
  }

  if (file.includes("admonition=")) {
    let admonition1 = file.split("admonition=")[1].split("--->")[0]
    template += `${admonition1}</div>`;
    if (file.split("admonition=").length > 2){
      let admonition2 = file.split("admonition=")[2].split("--->")[0]
      template += `${admonition2}`;
    }
  }

  if (file.includes("video=")) {
    template = template.replace('width: 85%', '')
    template = `<div class="grid"><div class="s6">` + template;
    let video = file.split("video=")[1].split("--->")[0]
    let videoPath = `src/instructions/videos/${video}`;
    template += `<div class="s6">
      <div class="video-inst">
      <video width="70%" height="100%" controls autoplay>
        <source src="${videoPath}">
        Your browser does not support the video tag.
        </video>
      </div>
      </div>
      </div>`
  }
  if (file.includes("image=")) {
    template = template.replace('width: 85%', '')
    let image = file.split("image=")[1].split("--->")[0]
    let imagePath = `src/instructions/images/${image}`;
    template = `<div class="grid"><div class="s6">` + template;
    template += `<div class="s6">
      <div class="video-inst">
      <img src="${imagePath}" style="width: 87%">
      </div>
      </div>
      </div>` 
  }

  return template;
}

export const landingPage = `
  <div class="card-text">
            <h1>Welcome to our</h1><br><h1 class="gradient-text" style="font-weight: bolder;">experiment!</h1>
        </div>
            <!-- <p>Some text here</p> -->
            <div class="card-img">
              <img class="front-img" src="images/spaceship_illustration.png" alt="" loading="lazy">
            </div>
`

export const restPage = `
  <div class="card-text">
            <h1>🚀 Well done!🚀 </h1>
            <h2>You've completed block {block_nb}!</h2>
            <p>Take a break and relax for a moment. You can continue to the next block by clicking the arrow button below.</p>
  <br>
  <br>
    <div class="admonition notice">
        <p class="title">Prolific maximum completion time</p>
        <p class="content">
          Beware of the time you spend on this page. Prolific gives you a maximum of ~120 minutes to complete this submission. 
          This experiment is supposed to take ~30 minutes.
        </p>
      </div>
  </div>
  <div class="card-img" style="flex:auto">
      <img class="front-img" src="images/rest_illustration.png" alt="" loading="lazy">
  </div>
`

export const consentPage = `

<h2>Title of the study: BrainPlay</h2>
<div class="scroll-div">
    <h3>Information to the Participants</h3>

    <p><strong>Procedure:</strong> For the purpose of our research, we will ask you for demographic
        information as well as to complete some psychometric questionnaires and computer-based cognitive tasks.
        Once you have consented, you will be guided through the study in a step-by-step manner, indicating the mean
        duration of each task and its pay rate. You will then have the possibility of logging in and out as many times
        as you wish to complete all tasks, as long as you do so within a period of 10 days since initial consent.</p>

    <p>If you don’t follow the rules of conduct listed below, this will lead to your exclusion from the study. You will
        still be paid for the part of the experiment you participated in.</p>

    <p><strong>Rules of conduct:</strong></p>
    <ul>
        <li>- Follow the instructions</li>
        <li>- Complete every task in the order and time period asked</li>
    </ul>

    <p>We want to remind you that participation in this study is voluntary. You may decline to answer any or all
        questions. There are no negative consequences to you if you decide not to participate in this study. The data
        collected will be treated the same way as other participants (further information below), and we will not take
        into account your interruption for further experiments. You will be compensated for the part of the experiment
        you participated in.</p>

    <p>Finally, it is possible that in certain situations, it is necessary to end the experiment faster than initially
        planned. The researcher himself will take this decision. You will still be paid for the part of the experiment
        you participated in.</p>

    <p><strong>Data Protection (Archiving/Data destruction):</strong> Risks to confidentiality for subjects who
        complete studies online are prevented by Prolific user anonymization, which protects the personal information
        about users by way of a secure server. No identifying information about Prolific users is revealed to us through
        their participation, and we will not solicit personal information. The results of this research study may be
        presented at scientific meetings or in publications; however, the data will be anonymous. Data collected in the
        present study will be kept for 7 years after publication in order to be fully analyzed.</p>

    <p>During the course of the study, inspections by authorities may take place to ensure that all relevant
        regulations are applied. In such circumstances, the person in charge of the study may be requested to
        communicate your data to meet the needs of these inspections.</p>

    <p><strong>Access to the results of the research:</strong> If you wish to be informed of the results of this study,
        you can contact by mail the person mentioned below. Only the general results of the study will be available. We
        will not give individual results.</p>

    <p><strong>If you have suffered any harm from the present study or simply want to be informed about the results of
            this study, please contact:</strong></p>

    <address>
        Prof. Daphné Bavelier <br>
        Faculté de psychologie, Uni Mail, <br>
        Bvd du Pont d’Arve 40 <br>
        1205 Genève; Switzerland
    </address>
</div>

    <br>
<!-- CONSENT BOX -->
<div>
    <label class="checkbox">
      <input type="checkbox" required>
      <span>
      Given the information above, I fully agree to participate
                freely and voluntarily in the research study, “Determinants of learning”.
      </span>
    </label>
    <br>
    <label class="checkbox">
      <input type="checkbox"required>
      <span>
              I am aware that my data can be transmitted, for scientific purposes only, under anonymized format.
      </span>
    </label>
    <br>
    <br>
    <label class="checkbox">
      <input type="checkbox" required>
      <span>
            I am aware that I can withdraw from the study at any time, without having to give any explanation
            and ask for the destruction of my personal information and/or collected data. <br>I understand that data 
            collected until the moment of my withdrawal will be used for scientific purposes only.
      </span>
      </label>
    <br>
    <br>
    <label class="checkbox">
    <input type="checkbox" required>
      <span>
            I understand that if I am below 18 years of age I cannot participate in this research. This consent
            form does not release the organizers of the research from liability.<br> I am entitled to my full rights 
            as provided under the law.
      </span>
    </label>
</div>
`
