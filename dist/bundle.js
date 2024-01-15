(()=>{"use strict";const e=e=>{var n=document.querySelector("#unity-container"),t=document.querySelector("#unity-canvas"),o=document.querySelector("#unity-loading-bar"),i=document.querySelector("#unity-progress-bar-full"),r=document.querySelector("#unity-fullscreen-button"),l=document.querySelector("#unity-warning"),a="src/game/"+e+"/Build",s=a+"/"+e+".loader.js",d={dataUrl:a+`/${e}.data`,frameworkUrl:a+`/${e}.framework.js`,codeUrl:a+`/${e}.wasm`,streamingAssetsUrl:"StreamingAssets",companyName:"DefaultCompany",productName:"Space Shooter",productVersion:"1.0",showBanner:function(e,n){function t(){l.style.display=l.children.length?"block":"none"}var o=document.createElement("div");o.innerHTML=e,l.appendChild(o),"error"==n?o.style="background: red; padding: 10px;":("warning"==n&&(o.style="background: yellow; padding: 10px;"),setTimeout((function(){l.removeChild(o),t()}),5e3)),t()}};if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){var c=document.createElement("meta");c.name="viewport",c.content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes",document.getElementsByTagName("head")[0].appendChild(c),n.className="unity-mobile",t.className="unity-mobile"}o.style.display="block";var u=document.createElement("script");u.src=s,u.onload=()=>{createUnityInstance(t,d,(e=>{i.style.width=100*e+"%"})).then((e=>{window.unityInstance=e,o.style.display="none",r.onclick=()=>{e.SetFullscreen(1)}})).catch((e=>{alert(e)}))},document.body.appendChild(u),document.querySelector("#game").style.display="block",document.querySelector("progress").style.display="none"},n=()=>{window.unityInstance.Quit()};var t=parseInt(localStorage.getItem("instNum"))||0;const o=4,i=6,r=9;var l=!1,a=localStorage.getItem("end");window.subID="not_set";const s=()=>{localStorage.clear(),window.location.reload()},d=()=>{t<=3?q(t=o):t==o?window.endTrainingPerceptual():5==t||t==i?window.endTrainingRL():t>6&&window.endGame()};function c(){m(),document.getElementById("next-button").addEventListener("click",g),document.getElementById("prev-button").addEventListener("click",h),document.querySelector("#reload").addEventListener("click",s),document.querySelector("#skip").addEventListener("click",d),a?window.endGame():0!=t&&q(t)}const u=e=>{document.querySelector("#"+e).classList.add("active-step")},y=e=>{document.querySelector("#"+e).classList.add("done-step")},m=()=>{window.subID=("prolificID",new URL(document.location).searchParams.get("prolificID")||"random-"+Math.floor(1e10*Math.random())),document.querySelector(".subID").innerHTML="id: "+window.subID},p=()=>{document.querySelector("#panel").style.display="none"},g=()=>{l||(S(),t++,q(t))},h=()=>{l||(S(),t--,q(t))},w=()=>{document.querySelector("#next-button").style.display="none",document.querySelector("#prev-button").style.display="none"},v=()=>{document.querySelector("#next-button").style.display="inline-flex",document.querySelector("#prev-button").style.display="inline-flex"},b=()=>{document.querySelector("#prev-button").style.display="none"},S=()=>{l=!0,setTimeout((()=>{l=!1}),300)},q=async n=>{n=parseInt(n),localStorage.setItem("instNum",n),0==n?(document.querySelector("#panel").innerHTML='\n  <div class="card-text">\n            \x3c!-- <h1>Welcome to this</h1><br> --\x3e\n            <h1>Welcome to our</h1><br><h1 style="color: var(--primary); font-weight: bolder;">experiment!</h1>\n            \x3c!-- <h1>Welcome to this <span style = "display: block; color: var(--primary)"> experiment!</span></h1> --\x3e\n            \x3c!-- <h1><b style="color: var(--primary)"> experiment!</b></h1> --\x3e\n        </div>\n            \x3c!-- <p>Some text here</p> --\x3e\n            <div class="card-img">\n              <img class="front-img" src="images/spaceship_illustration.png" alt="" loading="lazy">\n            </div>\n',document.querySelector("#panel").style.display="flex",document.querySelector("#prev-button").style.display="none",document.querySelector("#game").style.display="none"):n==o?(p(),w(),u("training1"),y("introduction"),e("training1")):n==i?(p(),w(),u("training2"),y("training1"),y("introduction"),e("training2")):n==r?(p(),w(),u("experiment"),y("introduction"),y("training1"),y("training2"),document.querySelector("#game").style.display="block",e("main")):(document.querySelector("#panel").innerHTML='<progress style="width:35%; margin: auto"></progress>',document.querySelector("#panel").style.display="flex",document.querySelector("#panel").innerHTML=await(async e=>{const n=await fetch(e).then((e=>e.text()));let t=`<zero-md src="${e}">\n      <template data-merge="append">\n        <link rel="stylesheet" href="lib/css/admonition.css">\n        <style>\n          .markdown-body {\n            color: whitesmoke;\n            font-size: larger;\n            width: 85%; \n            /*margin-top: 10%;*/\n            margin: auto;\n          }\n        </style>\n      </template>\n      </zero-md>`;if(e.includes("inst_8")&&(t=t.replace("width: 85%","width: 100%"),t=t.replace("margin: auto",""),t=t.replace("/*",""),t=t.replace("*/","")),n.includes("display=")){let e=n.split("display=")[1].split("---\x3e")[0];document.querySelector("#panel").style.display=e}return n.includes("admonition=")&&(t+=`${n.split("admonition=")[1].split("---\x3e")[0]}</div>`),n.includes("video=")&&(t=t.replace("width: 85%",""),t='<div class="grid"><div class="s6">'+t,t+=`<div class="s6">\n      <div class="video-inst">\n      <video width="70%" height="100%" controls autoplay>\n        <source src="src/instructions/videos/${n.split("video=")[1].split("---\x3e")[0]}">\n        Your browser does not support the video tag.\n        </video>\n      </div>\n      </div>\n      </div>`),t})(`src/instructions/inst_${n}.md`),v(),(0==n||[o,i,r].includes(n-1))&&b())};window.endGame=()=>{n(),localStorage.setItem("end",!0),w(),y("introduction"),y("experiment"),u("survey"),document.querySelector("#game").style.display="none",document.querySelector("#panel").style.display="flex",document.querySelector("#panel").innerHTML='\n            <div class="center-align" style="margin: auto">\n            <h1 style="display: block">🚀Thank you!🚀</h1>\n            <br>\n            <br>\n            <p>Thank you for participating in our experiment!</p>\n            <p>Please click the button below and answer a few questions to complete your submission.</p>\n            <br>\n            <button id="submit-button" class="btn btn-primary">Survey</button>\n            </div>\n    '},window.endTrainingRL=()=>{n(),y("introduction"),y("training1"),y("training2"),u("experiment"),document.querySelector("#game").style.display="none",document.querySelector("#panel").style.display="flex",v(),q(t=7),b()},window.endTrainingPerceptual=()=>{n(),y("introduction"),y("training1"),u("training2"),document.querySelector("#game").style.display="none",document.querySelector("#panel").style.display="flex",v(),q(t=5),b()},"loading"!==document.readyState?c():document.addEventListener("DOMContentLoaded",c)})();