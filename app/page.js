"use client";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, Heart, LogOut, Save } from "lucide-react";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "yorisoi-app-89ce7.firebaseapp.com",
  projectId: "yorisoi-app-89ce7",
  storageBucket: "yorisoi-app-89ce7.appspot.com",
  messagingSenderId: "509189105205",
  appId: "1:509189105205:web:7ffc405665e85fed92f37c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const levelFeelings = ["落ち着いたよ","違和感あり","ちょっとしんどい","しんどい","かなりつらい","限界"];
const levelEmojis = ["🍃","😅","😷","😭","🥶","🤮"];

const moodOptions = [
  { emoji:"🙂",label:"落ち着いてる"},
  { emoji:"😢",label:"寂しい"},
  { emoji:"😡",label:"イライラ"},
  { emoji:"😴",label:"眠い"},
  { emoji:"🤢",label:"気持ち悪い"}
];

const defaultSymptoms=["つわり","生理痛","PMS","頭痛","腹痛","だるい","のどが痛い","熱がある"];

export default function YorisoiApp(){

const [showIntro,setShowIntro]=useState(true);
const [pairCode,setPairCode]=useState("");
const [inputCode,setInputCode]=useState("");
const [role,setRole]=useState(null);

const [selectedSymptoms,setSelectedSymptoms]=useState([]);
const [level,setLevel]=useState(0);

const [status,setStatus]=useState(null);
const [data,setData]=useState({});
const [completedTasks,setCompletedTasks]=useState([]);

const [memo,setMemo]=useState("");

/* ========================
   ログイン復元
======================== */

useEffect(()=>{
const savedCode=localStorage.getItem("yorisoi_pairCode");
const savedRole=localStorage.getItem("yorisoi_role");

if(savedCode && savedRole){
setPairCode(savedCode);
setRole(savedRole);
setShowIntro(false);
}

},[]);

/* ========================
   Firestoreリアルタイム
======================== */

useEffect(()=>{

if(!pairCode) return;

const unsubStatus = onSnapshot(doc(db,"pairs",pairCode),(s)=>{

if(s.exists()){
const newData=s.data();

setStatus(newData);
setCompletedTasks(newData.completedTasks || []);
setMemo(newData.memo || "");

}

});

const unsubConfig = onSnapshot(doc(db,"configs",pairCode),(s)=>{

if(s.exists()) setData(s.data());

});

return ()=>{
unsubStatus();
unsubConfig();
};

},[pairCode]);

/* ========================
   ログイン保存
======================== */

const saveLogin=(code,r)=>{

localStorage.setItem("yorisoi_pairCode",code);
localStorage.setItem("yorisoi_role",r);

setPairCode(code);
setRole(r);

};

/* ========================
   新規作成
======================== */

const startAsReporter=async()=>{

const code=Math.random().toString(36).substring(2,8).toUpperCase();

saveLogin(code,"her");

await setDoc(doc(db,"configs",code),{});

};

/* ========================
   参加
======================== */

const startAsSupporter=()=>{

if(inputCode.length>=4){

saveLogin(inputCode.toUpperCase(),"him");

}

};

/* ========================
   体調更新
======================== */

const updateStatus=async(newSyms,newLv,mood=null,mode=null)=>{

if(!pairCode) return;

await setDoc(doc(db,"pairs",pairCode),{

symptoms:newSyms,
level:newLv,
emoji:levelEmojis[newLv],
feeling:levelFeelings[newLv],

mood:mood ?? status?.mood ?? "",
mode:mode ?? status?.mode ?? "",

memo:memo,

completedTasks:completedTasks,

updatedAt:new Date().getTime()

},{merge:true});

};

/* ========================
   タスクチェック
======================== */

const toggleTask=async(task)=>{

const updated = completedTasks.includes(task)
? completedTasks.filter(t=>t!==task)
: [...completedTasks,task];

setCompletedTasks(updated);

await setDoc(doc(db,"pairs",pairCode),{
completedTasks:updated
},{merge:true});

};

/* ========================
   メモ保存
======================== */

const saveMemo=async()=>{

await setDoc(doc(db,"pairs",pairCode),{
memo:memo
},{merge:true});

};

/* ========================
   UI
======================== */

if(showIntro && !pairCode){

return(

<div style={{padding:40,textAlign:"center"}}>

<h1>YORISOI</h1>

<button onClick={startAsReporter}>
おつたえ側
</button>

<div style={{marginTop:20}}>

<input
value={inputCode}
onChange={(e)=>setInputCode(e.target.value)}
placeholder="コード"
/>

<button onClick={startAsSupporter}>
みまもり側
</button>

</div>

</div>

);

}

/* ========================
   メイン画面
======================== */

return(

<div style={{padding:30,maxWidth:500,margin:"auto"}}>

<header style={{display:"flex",justifyContent:"space-between"}}>

<span>ID: {pairCode}</span>

</header>

{role==="her" && (

<>

<h3>体調レベル</h3>

<div style={{display:"flex",gap:10}}>

{[0,1,2,3,4,5].map(n=>(

<button
key={n}
onClick={()=>{

setLevel(n);
updateStatus(selectedSymptoms,n);

}}
>

{n}

</button>

))}

</div>

<h3>症状</h3>

<div style={{display:"flex",flexWrap:"wrap",gap:10}}>

{defaultSymptoms.map(s=>(

<button
key={s}
onClick={()=>{

const next=selectedSymptoms.includes(s)
? selectedSymptoms.filter(i=>i!==s)
: [...selectedSymptoms,s];

setSelectedSymptoms(next);

updateStatus(next,level);

}}
>

{s}

</button>

))}

</div>

<h3>体調メモ</h3>

<textarea
value={memo}
onChange={(e)=>setMemo(e.target.value)}
placeholder="今日の体調メモ"
/>

<button onClick={saveMemo}>
保存
</button>

</>

)}

{role==="him" && status && (

<>

<h2>

Lv.{status.level}
{status.emoji}

</h2>

<p>{status.feeling}</p>

{status.memo && (

<div>

<h3>メモ</h3>

<p>{status.memo}</p>

</div>

)}

<h3>お願い</h3>

{status.requests?.map(r=>(

<div
key={r}
onClick={()=>toggleTask(r)}
style={{
cursor:"pointer",
textDecoration:completedTasks.includes(r)
? "line-through"
:"none"
}}

>

{completedTasks.includes(r)?"✅":"⬜"} {r}

</div>

))}

<p style={{fontSize:12,opacity:0.6}}>

更新: {status.updatedAt ? new Date(status.updatedAt).toLocaleTimeString() : ""}

</p>

</>

)}

</div>

);

}