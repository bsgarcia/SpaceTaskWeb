export const getInstructionPage = async (path) => {
  // add loading beer.css
  document.querySelector('#panel').innerHTML = '<progress style="width:35%; margin: auto"></progress>';
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
          }
        </style>
      </template>
      </zero-md>`;
  if (file.includes("display=")) {
    let display = file.split("display=")[1].split("--->")[0]
    document.querySelector('#panel').style.display = display;
  }
  if (file.includes("admonition=")) {
    let admonition = file.split("admonition=")[1].split("--->")[0]
    template += `${admonition}</div>`;
  }
  if (file.includes("video=")) {
    template = `<div class="grid"><div class="s6">` + template;
    let video = file.split("video=")[1].split("--->")[0]
    let videoPath = `./instructions/videos/${video}`;
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
  return template;
}

export const landingPage = `
  <div class="card-text">
            <!-- <h1>Welcome to this</h1><br> -->
            <h1>Welcome to our</h1><br><h1 style="color: var(--primary); font-weight: bolder;">experiment!</h1>
            <!-- <h1>Welcome to this <span style = "display: block; color: var(--primary)"> experiment!</span></h1> -->
            <!-- <h1><b style="color: var(--primary)"> experiment!</b></h1> -->
        </div>
            <!-- <p>Some text here</p> -->
            <div class="card-img">
              <img class="front-img" src="images/spaceship_illustration.png" alt="">
            </div>
`
