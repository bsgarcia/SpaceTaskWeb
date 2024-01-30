(()=>{"use strict";const e=()=>{window.unityInstance.Quit()};var n=parseInt(localStorage.getItem("instNum"))||0;const t=[3,5,7,9,11,13,15],o=[4,6,8,10,12,14];var i=!1,l=localStorage.getItem("end");window.subID="not_set",window.session=parseInt(localStorage.getItem("session"))||0;const s=()=>{localStorage.clear(),window.location.reload()},r=()=>{n<=2?(n=t[0],S(n)):t.includes(n)?window.endTrainingPerceptual():o.includes(n)&&(n=t[o.indexOf(n)+1],S(n))};function a(){m(),document.getElementById("next-button").addEventListener("click",p),document.getElementById("prev-button").addEventListener("click",g),document.querySelector("#reload").addEventListener("click",s),document.querySelector("#skip").addEventListener("click",r),l?window.endGame():0!=n&&S(n)}const c=()=>{u("introduction"),[...Array(window.session).keys()].forEach((e=>{try{u("block"+(e+1))}catch(e){console.log(e)}}))},d=e=>{document.querySelector("#"+e).classList.add("active-step")},u=e=>{document.querySelector("#"+e).classList.add("done-step")},m=()=>{window.subID=("prolificID",new URL(document.location).searchParams.get("prolificID")||"random-"+Math.floor(1e10*Math.random())),document.querySelector(".subID").innerHTML="id: "+window.subID},y=()=>{document.querySelector("#panel").style.display="none"},p=()=>{i||(v(),n++,S(n))},g=()=>{i||(v(),n--,S(n))},w=()=>{document.querySelector("#next-button").style.display="none",document.querySelector("#prev-button").style.display="none"},h=()=>{document.querySelector("#next-button").style.display="inline-flex",document.querySelector("#prev-button").style.display="inline-flex"},b=()=>{document.querySelector("#prev-button").style.display="none"},v=()=>{i=!0,setTimeout((()=>{i=!1}),300)},S=async e=>{e=parseInt(e),localStorage.setItem("instNum",e),0==e?(document.querySelector("#panel").innerHTML='\n  <div class="card-text">\n            \x3c!-- <h1>Welcome to this</h1><br> --\x3e\n            <h1>Welcome to our</h1><br><h1 style="color: var(--primary); font-weight: bolder;">experiment!</h1>\n            \x3c!-- <h1>Welcome to this <span style = "display: block; color: var(--primary)"> experiment!</span></h1> --\x3e\n            \x3c!-- <h1><b style="color: var(--primary)"> experiment!</b></h1> --\x3e\n        </div>\n            \x3c!-- <p>Some text here</p> --\x3e\n            <div class="card-img">\n              <img class="front-img" src="images/spaceship_illustration.png" alt="" loading="lazy">\n            </div>\n',document.querySelector("#panel").style.display="flex",document.querySelector("#prev-button").style.display="none",document.querySelector("#game").style.display="none"):t.includes(e)?(c(),y(),w(),d("block"+(window.session+1)),u("introduction"),c(),(e=>{var n=document.querySelector("#unity-container"),t=document.querySelector("#unity-canvas"),o=document.querySelector("#unity-loading-bar"),i=document.querySelector("#unity-progress-bar-full"),l=document.querySelector("#unity-fullscreen-button"),s=document.querySelector("#unity-warning"),r="src/game/block/Build",a=r+"/"+e+".loader.js",c={dataUrl:r+`/${e}.data`,frameworkUrl:r+`/${e}.framework.js`,codeUrl:r+`/${e}.wasm`,streamingAssetsUrl:"StreamingAssets",companyName:"DefaultCompany",productName:"Space Shooter",productVersion:"1.0",showBanner:function(e,n){function t(){s.style.display=s.children.length?"block":"none"}var o=document.createElement("div");o.innerHTML=e,s.appendChild(o),"error"==n?o.style="background: red; padding: 10px;":("warning"==n&&(o.style="background: yellow; padding: 10px;"),setTimeout((function(){s.removeChild(o),t()}),5e3)),t()}};if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){var d=document.createElement("meta");d.name="viewport",d.content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes",document.getElementsByTagName("head")[0].appendChild(d),n.className="unity-mobile",t.className="unity-mobile"}o.style.display="block";var u=document.createElement("script");u.src=a,u.onload=()=>{createUnityInstance(t,c,(e=>{i.style.width=100*e+"%"})).then((e=>{window.unityInstance=e,o.style.display="none",l.onclick=()=>{e.SetFullscreen(1)}})).catch((e=>{alert(e)}))},document.body.appendChild(u),document.querySelector("#game").style.display="block",document.querySelector("progress").style.display="none"})("block")):o.includes(e)?(c(),document.querySelector("#panel").innerHTML='\n  <div class="card-text">\n            <h1>🚀 Well done!🚀 </h1>\n            <h2>You\'ve completed block {block_nb}!</h2>\n            <p>Take a break and relax for a moment. You can continue to the next block by clicking the arrow button below.</p>\n  <br>\n  <br>\n    <div class="admonition notice">\n        <p class="title">Prolific maximum completion time</p>\n        <p class="content">\n          Beware of the time you spend on this page. Prolific gives you a maximum of ~120 minutes to complete this submission. \n          This experiment is supposed to take ~30 minutes.\n        </p>\n      </div>\n  </div>\n  <div class="card-img" style="flex:auto">\n      <img class="front-img" src="images/rest_illustration.png" alt="" loading="lazy">\n  </div>\n'.replace("{block_nb}",""+window.session),document.querySelector("#panel").style.display="flex",b(),document.querySelector("#game").style.display="none",d("block"+(window.session+1))):e<=2?(document.querySelector("#panel").innerHTML='<progress style="width:35%; margin: auto"></progress>',document.querySelector("#panel").style.display="flex",document.querySelector("#panel").innerHTML=await(async e=>{const n=await fetch(e).then((e=>e.text()));let t=`<zero-md src="${e}">\n      <template data-merge="append">\n        <link rel="stylesheet" href="lib/css/admonition.css">\n        <style>\n          .markdown-body {\n            color: whitesmoke;\n            font-size: larger;\n            width: 85%; \n            /*margin-top: 10%;*/\n            margin: auto;\n          }\n          \n          strong {\n            color: #53dbc9;\n          }\n\n        </style>\n      </template>\n      </zero-md>`;if(e.includes("inst_8")&&(t=t.replace("width: 85%","width: 100%"),t=t.replace("margin: auto",""),t=t.replace("/*",""),t=t.replace("*/","")),n.includes("display=")){let e=n.split("display=")[1].split("---\x3e")[0];document.querySelector("#panel").style.display=e}return n.includes("admonition=")&&(t+=`${n.split("admonition=")[1].split("---\x3e")[0]}</div>`),n.includes("video=")&&(t=t.replace("width: 85%",""),t='<div class="grid"><div class="s6">'+t,t+=`<div class="s6">\n      <div class="video-inst">\n      <video width="70%" height="100%" controls autoplay>\n        <source src="src/instructions/videos/${n.split("video=")[1].split("---\x3e")[0]}">\n        Your browser does not support the video tag.\n        </video>\n      </div>\n      </div>\n      </div>`),t})(`src/instructions/inst_${e}.md`),h(),(0==e||t.includes(e-1))&&b()):window.endGame()};window.endGame=()=>{e(),localStorage.setItem("end",!0),w(),c(),d("end"),document.querySelector("#game").style.display="none",document.querySelector("#panel").style.display="flex",document.querySelector("#panel").innerHTML='\n            <div class="center-align" style="margin: auto">\n            <h1 style="display: block">🚀Thank you!🚀</h1>\n            <br>\n            <br>\n            <p>Thank you for participating in our experiment!</p>\n            <p>Please click the button below and answer a few questions to complete your submission.</p>\n            <br>\n            <button id="submit-button" class="btn btn-primary">Survey</button>\n            </div>\n    '},window.endTrainingRL=()=>{e(),u("introduction"),u("training1"),u("training2"),d("experiment"),document.querySelector("#game").style.display="none",document.querySelector("#panel").style.display="flex",h(),S(n=7),b()},window.endTrainingPerceptual=()=>{if(e(),window.session++,localStorage.setItem("session",window.session),c(),6==window.session)return w(),void window.endGame();h(),n=o[window.session],S(n),b()},"loading"!==document.readyState?a():document.addEventListener("DOMContentLoaded",a)})();