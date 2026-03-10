(function () {

const scriptTag = document.currentScript;

const API_URL = "https://backendnaveen.vercel.app/api/ai-tutor/generate";
const CHAT_START_URL = "https://backendnaveen.vercel.app/api/ai-tutor/chat/start";
const CHAT_MESSAGE_URL = "https://backendnaveen.vercel.app/api/ai-tutor/chat/message";

/* ---------------- CONFIG ---------------- */

let config = {
theme: scriptTag?.getAttribute("theme") || "light",
defaultMode: scriptTag?.getAttribute("default-mode") || null,
enableChat: scriptTag?.getAttribute("enable-chat") !== "false",
position: scriptTag?.getAttribute("position") || "right",
brandColor: scriptTag?.getAttribute("brand-color") || "#6366f1"
};

/* ---------------- STATE ---------------- */

const state = {

question:null,
mode:null,

theme:config.theme==="dark"?"dark":"light",

aiCache:{},

chatHistory:[],
chatSessionId:null,
chatStarting:false,

requestId:0

};

/* ---------------- DOM ---------------- */

const container=document.createElement("div");
document.body.appendChild(container);

const shadow=container.attachShadow({mode:"open"});

/* YOUR ORIGINAL HTML + CSS (UNCHANGED) */

shadow.innerHTML = `

<style>

/* YOUR ORIGINAL CSS HERE — unchanged */

</style>

<button class="floating-btn">🤖</button>

<div class="panel ${state.theme}">
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

/* ---------------- ELEMENTS ---------------- */

const btn=shadow.querySelector(".floating-btn");
const panel=shadow.querySelector(".panel");
const closeBtn=shadow.querySelector("#closeBtn");
const themeToggle=shadow.querySelector("#themeToggle");

const questionEl=shadow.querySelector("#question");
const modesEl=shadow.querySelector("#modes");
const responseEl=shadow.querySelector("#response");

const footer=shadow.querySelector(".footer");
const input=shadow.querySelector("input");
const sendBtn=shadow.querySelector("button:last-child");

/* ---------------- HELPERS ---------------- */

function resetUI(){

state.requestId++;

responseEl.innerHTML="";
modesEl.innerHTML="";
footer.classList.remove("active");

}

/* ---------------- OPEN / CLOSE ---------------- */

btn.onclick=()=>{

panel.classList.add("open");
btn.classList.add("hidden");

state.mode=null;

resetUI();

renderModes();

};

closeBtn.onclick=()=>{

panel.classList.remove("open");
btn.classList.remove("hidden");

};

/* ---------------- THEME ---------------- */

themeToggle.onclick=()=>{

if(state.theme==="light"){

panel.classList.remove("light");
panel.classList.add("dark");

state.theme="dark";

themeToggle.textContent="☀️";

}else{

panel.classList.remove("dark");
panel.classList.add("light");

state.theme="light";

themeToggle.textContent="🌙";

}

};

/* ---------------- HOME ---------------- */

function renderModes(){

modesEl.innerHTML=`

<div class="app-home">

<div class="home-top">
<div class="home-avatar">🤖</div>
<div class="home-heading">
Welcome to <br/> AI Chat
</div>
</div>

<div class="home-pill" id="homePill">
Ask me anything...
</div>

<div class="widgets-label">WIDGETS</div>

<div class="widget-solution" data-mode="solution">
<div class="solution-title">1. Solution</div>
<div class="solution-desc">
This gadget provides you the solution with the explanation and the image.
</div>
</div>

<div class="widget-deconstruction" data-mode="breakdown">
<div class="deconstruction-title">2. Deconstruction</div>
<div class="deconstruction-desc">
Get a guide from Navin to understand how to think like a pro.
</div>
</div>

</div>
`;

shadow.getElementById("homePill").onclick=()=>{

state.mode="chat";
modesEl.innerHTML="";
renderResponse();

};

shadow.querySelectorAll("[data-mode]").forEach(card=>{

card.onclick=()=>{

state.mode=card.dataset.mode;
modesEl.innerHTML="";
renderResponse();

};

});

}

/* ---------------- API CALL ---------------- */

async function fetchAI(question){

const requestId=++state.requestId;

responseEl.innerHTML=`
<div class="response-box" style="text-align:center;">
<div style="font-weight:600;">🧠 Processing...</div>
<div style="opacity:0.7;font-size:13px;">Generating structured intelligence</div>
</div>
`;

try{

const res=await fetch(API_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({problem:question})
});

const data=await res.json();

if(requestId!==state.requestId) return;

state.aiCache[question]=data;

return data;

}catch(e){

if(requestId!==state.requestId) return;

responseEl.innerHTML=`
<div class="response-box">
Error connecting to AI server
</div>
`;

}

}

/* ---------------- RESPONSE ---------------- */

async function renderResponse(){

footer.classList.remove("active");

if(!state.question){

responseEl.innerHTML=`<div class="response-box">No question loaded.</div>`;
return;

}

/* SOLUTION / BREAKDOWN */

if(state.mode==="solution"||state.mode==="breakdown"){

questionEl.innerHTML=`<div class="back-bar">← Back</div>`;

shadow.querySelector(".back-bar").onclick=()=>{

state.mode=null;
resetUI();
renderModes();

};

let data=state.aiCache[state.question.text];

if(!data){

data=await fetchAI(state.question.text);

}

if(!data) return;

if(state.mode==="solution"){
renderSolutionUI(data);
}else{
renderBreakdownUI(data);
}

return;

}

/* CHAT */

if(state.mode==="chat"){

startChat();

}

}

/* ---------------- CHAT ---------------- */

async function startChat(){

if(state.chatSessionId||state.chatStarting) return;

state.chatStarting=true;

responseEl.innerHTML=`
<div class="response-box">
<div class="typing">
<div class="dot"></div>
<div class="dot"></div>
<div class="dot"></div>
</div>
</div>
`;

try{

const res=await fetch(CHAT_START_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({problem:state.question.text})
});

const data=await res.json();

state.chatSessionId=data.session_id;

state.chatHistory.push({
type:"ai",
text:data.message||"Let's begin."
});

state.chatStarting=false;

renderChat();

}catch(e){

state.chatStarting=false;

responseEl.innerHTML=`
<div class="response-box">
Unable to start AI session.
</div>
`;

}

}

function renderChat(){

modesEl.innerHTML="";

responseEl.innerHTML=`<div class="chat-area" id="chatArea"></div>`;

footer.classList.add("active");

const chatArea=shadow.querySelector("#chatArea");

state.chatHistory.forEach(msg=>{

const div=document.createElement("div");

div.className="chat-msg "+msg.type;

div.innerText=msg.text;

chatArea.appendChild(div);

});

chatArea.scrollTop=chatArea.scrollHeight;

sendBtn.onclick=sendMessage;

}

async function sendMessage(){

const text=input.value.trim();
if(!text) return;

input.value="";

state.chatHistory.push({type:"user",text});

renderChat();

const res=await fetch(CHAT_MESSAGE_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
session_id:state.chatSessionId,
message:text
})
});

const data=await res.json();

state.chatHistory.push({
type:"ai",
text:data.reply
});

renderChat();

}

/* ---------------- PUBLIC API ---------------- */

window.AIWidget={

loadQuestion(q){

state.question=q;

state.chatHistory=[];
state.chatSessionId=null;
state.chatStarting=false;

state.requestId++;

questionEl.innerHTML=`
<div class="question-box">${q.text}</div>
`;

renderModes();

}

};

})();