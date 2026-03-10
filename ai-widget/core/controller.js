import { state } from "./state.js";
import { RequestManager } from "./requestManager.js";
import { UI } from "../ui/renderer.js";

export const Controller={

API_URL:null,
CHAT_START_URL:null,
CHAT_MESSAGE_URL:null,

init(api,chatStart,chatMessage){

this.API_URL=api;
this.CHAT_START_URL=chatStart;
this.CHAT_MESSAGE_URL=chatMessage;

},

resetQuestion(q,questionEl,responseEl){

RequestManager.cancel();

state.question=q;

state.mode=null;

state.chatHistory=[];

state.chatSessionId=null;

state.chatStarting=false;

UI.renderQuestion(questionEl,q.text);

responseEl.innerHTML="";

},

async getAI(responseEl){

const key=state.question.text;

if(state.aiCache[key]){

return state.aiCache[key];

}

UI.renderLoading(responseEl);

try{

const data=await RequestManager.fetchAI(
this.API_URL,
state.question.text
);

state.aiCache[key]=data;

return data;

}catch(err){

UI.renderError(responseEl,"Server error");

}

},

async startChat(responseEl){

if(state.chatSessionId||state.chatStarting){

return;

}

state.chatStarting=true;

UI.renderLoading(responseEl);

try{

const data=await RequestManager.startChat(
this.CHAT_START_URL,
state.question.text
);

state.chatSessionId=data.session_id;

state.chatHistory.push({
type:"ai",
text:data.message||"Let's begin."
});

state.chatStarting=false;

}catch(e){

state.chatStarting=false;

UI.renderError(responseEl,"Unable to start chat");

}

},

async sendMessage(message){

const data=await RequestManager.sendMessage(
this.CHAT_MESSAGE_URL,
state.chatSessionId,
message
);

state.chatHistory.push({
type:"ai",
text:data.reply
});

}

};