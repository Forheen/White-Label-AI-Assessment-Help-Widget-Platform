import { state } from "./core/state.js";
import { Controller } from "./core/controller.js";
import { UI } from "./ui/renderer.js";

(function(){

const scriptTag = document.currentScript;

const API_URL = "https://backendnaveen.vercel.app/api/ai-tutor/generate";
const CHAT_START_URL = "https://backendnaveen.vercel.app/api/ai-tutor/chat/start";
const CHAT_MESSAGE_URL = "https://backendnaveen.vercel.app/api/ai-tutor/chat/message";

Controller.init(API_URL,CHAT_START_URL,CHAT_MESSAGE_URL);

const container=document.createElement("div");
document.body.appendChild(container);

const shadow=container.attachShadow({mode:"open"});

shadow.innerHTML=`

<link rel="stylesheet" href="./styles/widget.css">

<button class="floating-btn">🤖</button>

<div class="panel light">

<div class="header">
AI Tutor
<div class="header-icons">
<span id="themeToggle">🌙</span>
<span id="closeBtn">✕</span>
</div>
</div>

<div class="content">

<div id="question"></div>
<div id="modes"></div>
<div id="response"></div>

</div>

<div class="footer">
<input placeholder="Ask your doubt..." />
<button>➤</button>
</div>

</div>
`;

const btn=shadow.querySelector(".floating-btn");
const panel=shadow.querySelector(".panel");
const closeBtn=shadow.querySelector("#closeBtn");

const questionEl=shadow.querySelector("#question");
const modesEl=shadow.querySelector("#modes");
const responseEl=shadow.querySelector("#response");

btn.onclick=()=>{
panel.classList.add("open");
btn.classList.add("hidden");
UI.renderHome(modesEl);
};

closeBtn.onclick=()=>{
panel.classList.remove("open");
btn.classList.remove("hidden");
};

window.AIWidget={

loadQuestion(q){

Controller.resetQuestion(q,questionEl,responseEl);
UI.renderHome(modesEl);

}

};

})();