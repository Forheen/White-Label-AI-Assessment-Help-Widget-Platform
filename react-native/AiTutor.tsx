import React,
{
useState,
useRef
}
from "react";

import {
View,
Text,
TouchableOpacity,
Modal,
StyleSheet,
TextInput,
ScrollView,
ActivityIndicator
}
from "react-native";

import TutorEngine from "../core/tutorEngine";

interface Props{

question:string

images?:string[]

baseUrl?:string

apiKey?:string

}

export default function AiTutor({

question,

images=[],

baseUrl,

apiKey

}:Props){

const engineRef=
useRef(

new TutorEngine({

baseUrl,
apiKey

})

);

const engine=
engineRef.current;

const [open,setOpen]=
useState(false);

const [mode,setMode]=
useState<"home"|"solution"|"chat">(
"home"
);

const [loading,setLoading]=
useState(false);

const [solution,setSolution]=
useState<any>(null);

const [messages,setMessages]=
useState<any[]>([]);

const [input,setInput]=
useState("");

/* LOAD QUESTION */

function loadQuestion(){

engine.loadQuestion({

text:question,

images:images

});

}

/* OPEN PANEL */

function openTutor(){

loadQuestion();

setOpen(true);

setMode("home");

}

/* SOLUTION */

async function getSolution(){

setMode("solution");

setLoading(true);

const res=
await engine.generateSolution();

setSolution(res);

setLoading(false);

}

/* CHAT */

async function startChat(){

setMode("chat");

setLoading(true);

const data=
await engine.startChatSession();

setMessages(
engine.getChatHistory()
);

setLoading(false);

}

/* SEND MESSAGE */

async function send(){

if(!input.trim()) return;

setLoading(true);

await engine.sendMessage(input);

setMessages(

[...engine.getChatHistory()]

);

setInput("");

setLoading(false);

}

/* RENDER HOME */

function renderHome(){

return(

<View>

<Text style={styles.question}>

{question}

</Text>

<TouchableOpacity

style={styles.card}

onPress={getSolution}

>

<Text style={styles.cardTitle}>
Solution
</Text>

<Text style={styles.cardDesc}>
Get full explanation
</Text>

</TouchableOpacity>

<TouchableOpacity

style={styles.card}

onPress={startChat}

>

<Text style={styles.cardTitle}>
Chat
</Text>

<Text style={styles.cardDesc}>
Ask doubts step by step
</Text>

</TouchableOpacity>

</View>

);

}

/* SOLUTION UI */

function renderSolution(){

if(loading){

return(

<ActivityIndicator/>

);

}

if(!solution){

return null;

}

return(

<ScrollView>

<Text style={styles.answer}>

Final Answer:

{solution?.structured_data?.final_answer}

</Text>

<Text style={styles.explain}>

{solution?.structured_data?.normal_explanation}

</Text>

</ScrollView>

);

}

/* CHAT UI */

function renderChat(){

return(

<View style={{flex:1}}>

<ScrollView>

{messages.map((m,i)=>(

<View

key={i}

style={[

styles.msg,

m.type==="user"
? styles.user
: styles.ai

]}

>

<Text>

{m.text}

</Text>

</View>

))}

{loading &&

<ActivityIndicator/>

}

</ScrollView>

<View style={styles.footer}>

<TextInput

value={input}

onChangeText={setInput}

style={styles.input}

placeholder="Ask doubt"

/>

<TouchableOpacity

onPress={send}

style={styles.send}

>

<Text style={{color:"white"}}>

Send

</Text>

</TouchableOpacity>

</View>

</View>

);

}

/* MAIN */

return(

<>

<TouchableOpacity

style={styles.floating}

onPress={openTutor}

>

<Text style={styles.bot}>
🤖
</Text>

</TouchableOpacity>

<Modal

visible={open}

animationType="slide"

>

<View style={styles.panel}>

<View style={styles.header}>

<Text style={styles.title}>
AI Tutor
</Text>

<TouchableOpacity

onPress={()=>setOpen(false)}

>

<Text>
Close
</Text>

</TouchableOpacity>

</View>

<View style={styles.content}>

{mode==="home" &&
renderHome()}

{mode==="solution" &&
renderSolution()}

{mode==="chat" &&
renderChat()}

</View>

</View>

</Modal>

</>

);

}

/* STYLES */

const styles=
StyleSheet.create({

floating:{

position:"absolute",

bottom:30,

right:20,

backgroundColor:"#6366f1",

width:60,

height:60,

borderRadius:30,

alignItems:"center",

justifyContent:"center",

elevation:6

},

bot:{

fontSize:26

},

panel:{

flex:1,

backgroundColor:"white"

},

header:{

flexDirection:"row",

justifyContent:"space-between",

padding:16,

borderBottomWidth:1,

borderColor:"#eee"

},

title:{

fontSize:18,

fontWeight:"600"

},

content:{

flex:1,

padding:16

},

question:{

fontSize:15,

marginBottom:20

},

card:{

backgroundColor:"#f3f4f6",

padding:16,

borderRadius:12,

marginBottom:12

},

cardTitle:{

fontSize:16,

fontWeight:"600"

},

cardDesc:{

fontSize:13,

opacity:.7

},

answer:{

fontSize:16,

fontWeight:"600",

marginBottom:10

},

explain:{

fontSize:14,

lineHeight:20

},

msg:{

padding:10,

borderRadius:14,

marginBottom:8,

maxWidth:"80%"

},

user:{

alignSelf:"flex-end",

backgroundColor:"#6366f1"

},

ai:{

alignSelf:"flex-start",

backgroundColor:"#eee"

},

footer:{

flexDirection:"row",

borderTopWidth:1,

borderColor:"#eee",

padding:10

},

input:{

flex:1,

borderWidth:1,

borderColor:"#ddd",

borderRadius:10,

padding:10

},

send:{

backgroundColor:"#6366f1",

padding:10,

borderRadius:10,

marginLeft:8,

justifyContent:"center"

}

});