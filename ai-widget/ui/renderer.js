export const UI={

renderHome(modesEl){

modesEl.innerHTML=`

<div class="app-home">

<div class="home-top">
<div class="home-avatar">🤖</div>
<div class="home-heading">
Welcome to <br/> AI Chat
</div>
</div>

<div class="home-pill">
Ask me anything...
</div>

<div class="widgets-label">WIDGETS</div>

<div class="widget-solution">
<div class="solution-title">1. Solution</div>
<div class="solution-desc">
Get full explanation with visuals
</div>
</div>

<div class="widget-deconstruction">
<div class="deconstruction-title">2. Deconstruction</div>
<div class="deconstruction-desc">
Guided reasoning steps
</div>
</div>

</div>

`;

},

renderLoading(responseEl){

responseEl.innerHTML=`

<div class="response-box" style="text-align:center;">
<div style="font-weight:600;">🧠 Processing...</div>
<div style="opacity:0.7;font-size:13px;">
Generating structured reasoning
</div>
</div>

`;

},

renderError(responseEl,msg){

responseEl.innerHTML=`

<div class="response-box">
${msg}
</div>

`;

},

renderQuestion(questionEl,text){

questionEl.innerHTML=`

<div class="question-box">${text}</div>

`;

},

renderChat(chatArea,history){

chatArea.innerHTML="";

history.forEach(msg=>{

const div=document.createElement("div");

div.className="chat-msg "+msg.type;

div.innerText=msg.text;

chatArea.appendChild(div);

});

}

};