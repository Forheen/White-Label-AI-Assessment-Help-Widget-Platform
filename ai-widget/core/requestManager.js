let controller=null;

export const RequestManager={

cancel(){

if(controller){
controller.abort();
}

},

async fetchAI(apiUrl,problem){

this.cancel();

controller=new AbortController();

const res=await fetch(apiUrl,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({problem}),
signal:controller.signal
});

return res.json();

},

async startChat(apiUrl,problem){

const res=await fetch(apiUrl,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({problem})
});

return res.json();

},

async sendMessage(apiUrl,sessionId,message){

const res=await fetch(apiUrl,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
session_id:sessionId,
message
})
});

return res.json();

}

};