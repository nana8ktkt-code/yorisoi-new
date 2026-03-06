"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Heart, MessageCircleHeart } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyC3S7sO5trehM1cNHOzo6cc49D8V4rXSqg",
  authDomain: "yorisoi-app-89ce7.firebaseapp.com",
  projectId: "yorisoi-app-89ce7",
  storageBucket: "yorisoi-app-89ce7.firebasestorage.app",
  messagingSenderId: "509189105205",
  appId: "1:509189105205:web:7ffc405665e85fed92f37c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const levelFeelings = ["落ち着いたよ", "違和感あり", "ちょっとしんどい", "しんどい", "かなりつらい", "限界・・"];
const levelEmojis = ["🍃", "😅", "😿", "😭", "🥶", "🚫"];
const softFontFace = '"Hiragino Maru Gothic ProN", "Meiryo", sans-serif';

export default function YorisoiApp() {
  const [pairCode, setPairCode] = useState("");
  const [role, setRole] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [level, setLevel] = useState(0);
  const [data, setData] = useState({});
  const [status, setStatus] = useState(null);
  const [isSetting, setIsSetting] = useState(false);
  const [activeSettingSymptom, setActiveSettingSymptom] = useState("生理痛");
  const [settingLevel, setSettingLevel] = useState(0);

  const defaultSymptoms = ["つわり", "生理痛", "PMS", "頭痛", "腹痛", "だるい", "のどが痛い", "熱がある"];
  const defaultOptions = {
    doing: ["横になって休んでる", "薬を飲んだ", "食欲がない", "少し落ち着いてきた"],
    requests: [
      { cat: "🧼 家事", items: ["洗い物をお願い", "洗濯物をお願い", "ゴミ出しをお願い"] },
      { cat: "🍱 食事", items: ["ゼリー買ってきて", "おかゆ食べたい", "Ｃ１０００買ってきて"] },
      { cat: "🌡️ ケア", items: ["腰をさすって", "暖房用意して", "タオル濡らして頭において"] }
    ],
    notToDo: ["話しかけないで", "大きな音NG", "強いにおいは避けてほしい", "そっとしておいて"]
  };

  useEffect(() => {
    if (!pairCode) return;
    const unsubStatus = onSnapshot(doc(db, "pairs", pairCode), (s) => { if (s.exists()) setStatus(s.data()); });
    const unsubConfig = onSnapshot(doc(db, "configs", pairCode), (s) => { if (s.exists()) setData(s.data()); });
    return () => { unsubStatus(); unsubConfig(); };
  }, [pairCode]);

  const updateStatus = async (newSymptoms, newLevel) => {
    if (!pairCode) return;
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: newSymptoms,
      level: newLevel,
      feeling: levelFeelings[newLevel],
      emoji: levelEmojis[newLevel],
      updatedAt: new Date().getTime(),
      completedTasks: status?.completedTasks || []
    }, { merge: true });
  };

  const toggleTask = async (task) => {
    const current = status?.completedTasks || [];
    const next = current.includes(task) ? current.filter(t => t !== task) : [...current, task];
    await setDoc(doc(db, "pairs", pairCode), { completedTasks: next }, { merge: true });
  };

  const sendThanks = async (msg) => {
    await setDoc(doc(db, "pairs", pairCode), { thanks: msg, updatedAt: new Date().getTime() }, { merge: true });
    alert("彼に感謝を伝えました🕊️");
  };

  const toggleSelection = (symptom, lv, type, item) => {
    const newData = { ...data };
    if (!newData[symptom]) newData[symptom] = {};
    if (!newData[symptom][lv]) newData[symptom][lv] = { doing: [], requests: [], notToDo: [] };
    const list = newData[symptom][lv][type] || [];
    newData[symptom][lv][type] = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setData(newData);
    setDoc(doc(db, "configs", pairCode), newData);
  };

  const getPlan = (syms, lv) => {
    const combined = { doing: [], requests: [], notToDo: [] };
    syms.forEach(s => {
      const p = data[s]?.[lv] || { doing: [], requests: [], notToDo: [] };
      combined.doing = [...new Set([...combined.doing, ...(p.doing || [])])];
      combined.requests = [...new Set([...combined.requests, ...(p.requests || [])])];
      combined.notToDo = [...new Set([...combined.notToDo, ...(p.notToDo || [])])];
    });
    return combined;
  };

  const pageStyle = { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, background: '#f0f7ff', minHeight: '100vh', color: '#5a7d9a' };

  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '32px' }}>🕊️ YORISOI</h1>
        <input type="text" placeholder="合言葉を入力" onChange={(e) => setPairCode(e.target.value)} style={{ width: '85%', padding: '18px', borderRadius: '20px', border: 'none', fontSize: '18px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '20px', borderRadius: '25px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold' }}>彼女（伝える）</button>
          <button onClick={() => setRole('him')} style={{ padding: '20px', borderRadius: '25px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold' }}>彼（見守る）</button>
        </div>
      </div>
    );
  }

  if (role === 'him') {
    const currentPlan = status ? getPlan(status.symptoms || [], status.level || 0) : null;
    const allTasks = currentPlan ? [...currentPlan.requests, ...currentPlan.notToDo] : [];
    return (
      <div style={pageStyle}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}><h2>🕊️ 彼女の状態</h2></header>
        {status && status.symptoms?.length > 0 ? (
          <div>
            <div style={{ background: '#fff', borderRadius: '30px', padding: '25px', textAlign: 'center', boxShadow: '0 8px 20px rgba(158,187,215,0.2)', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', color: '#9ebbd7', fontWeight: 'bold' }}>{status.symptoms.join('＆')}</div>
              <div style={{ fontSize: '50px', fontWeight: 'bold', margin: '5px 0' }}>Lv.{status.level}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: status.level === 0 ? '#82c49a' : '#ff9eb5' }}>{levelEmojis[status.level]} {status.feeling}</div>
              {status.thanks && <div style={{ marginTop: '15px', padding: '10px', background: '#fff0f5', borderRadius: '15px', color: '#ff7a99', fontSize: '14px' }}>💖 {status.thanks}</div>}
            </div>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📋 今日してあげられること</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allTasks.length > 0 ? allTasks.map(task => (
                <div key={task} onClick={() => toggleTask(task)} style={{ background: '#fff', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: '0.2s', opacity: status.completedTasks?.includes(task) ? 0.6 : 1 }}>
                  {status.completedTasks?.includes(task) ? <CheckCircle2 color="#82c49a" style={{ marginRight: '10px' }} /> : <Circle color="#ccc" style={{ marginRight: '10px' }} />}
                  <span style={{ textDecoration: status.completedTasks?.includes(task) ? 'line-through' : 'none', fontWeight: 'bold' }}>{task}</span>
                </div>
              )) : <div style={{ textAlign: 'center', padding: '20px', color: '#ccc' }}>今はゆっくり見守ってあげてね</div>}
            </div>
          </div>
        ) : <div style={{ textAlign: 'center', marginTop: '100px' }}>🍃 彼女は今、落ち着いています</div>}
      </div>
    );
  }

  if (isSetting) {
    const config = data[activeSettingSymptom]?.[settingLevel] || { doing: [], requests: [], notToDo: [] };
    return (
      <div style={{ ...pageStyle, background: '#fff' }}>
        <button onClick={() => setIsSetting(false)} style={{ border: 'none', padding: '12px 24px', borderRadius: '15px', marginBottom: '20px', background: '#f0f7ff', color: '#9ebbd7', fontWeight: 'bold' }}>◀ 戻る</button>
        <div style={{ background: '#fcfdff', padding: '20px', borderRadius: '25px', border: '1px solid #eef' }}>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #eee' }}>
            {defaultSymptoms.concat(Object.keys(data)).filter((v,i,a)=>a.indexOf(v)===i).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '35px', height: '35px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : '#eee', color: '#fff' }}>{n}</button>)}
          </div>
          {Object.entries({ doing: '👟 状態', requests: '🍼 お願い', notToDo: '⚠️ NG' }).map(([key, label]) => (
            <div key={key} style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px' }}>{label}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(key === 'requests' ? defaultOptions.requests.flatMap(g => g.items) : defaultOptions[key]).concat(config[key] || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
                  <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, key, item)} style={{ padding: '8px 12px', borderRadius: '15px', fontSize: '12px', background: config[key]?.includes(item) ? '#9ebbd7' : '#fff', color: config[key]?.includes(item) ? '#fff' : '#777', border: '1px solid #eee' }}>{item}</button>
                ))}
                <button onClick={() => { const v = window.prompt("自由入力"); if(v) toggleSelection(activeSettingSymptom, settingLevel, key, v)}} style={{ padding: '8px 12px', borderRadius: '15px', border: '1px dashed #9ebbd7', fontSize: '12px', color: '#9ebbd7' }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>🕊️ {pairCode}</div>
        <Settings onClick={() => setIsSetting(true)} size={26} color="#9ebbd7" style={{ cursor: 'pointer' }} />
      </header>

      {status?.completedTasks?.length > 0 && (
        <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', textAlign: 'center', marginBottom: '10px', color: '#82c49a' }}>✨ 彼がやってくれたよ！ありがとうを送ろう</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {["ありがとう", "だいすき♡", "助かった"].map(m => (
              <button key={m} onClick={() => sendThanks(m)} style={{ padding: '10px', borderRadius: '12px', background: '#f0f7ff', border: '1px solid #9ebbd7', color: '#9ebbd7', fontSize: '12px', fontWeight: 'bold' }}>{m}</button>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>1. 症状を選ぶ</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
        {defaultSymptoms.map(s => (
          <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} style={{ padding: '12px 16px', borderRadius: '15px', border: 'none', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#777', fontWeight: 'bold', fontSize: '14px' }}>{s}</button>
        ))}
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>2. しんどさは？</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold', fontSize: '16px' }}>{n}</button>)}
      </div>
      <div style={{ textAlign: 'center', color: level === 0 ? '#82c49a' : '#ff9eb5', fontWeight: 'bold', fontSize: '20px', marginBottom: '30px' }}>{levelEmojis[level]} {levelFeelings[level]}</div>

      <button onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【YORISOI🕊️】\n体調更新：${selectedSymptoms.join('＆')} Lv.${level}\n${levelEmojis[level]}${levelFeelings[level]}\nしてほしいことがあるよ、確認してね！`)}`)} style={{ width: '100%', padding: '20px', borderRadius: '30px', background: '#4cc764', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>彼にLINEで通知する（重要）</button>
    </div>
  );
}
