"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, Send, ChevronDown, Plus, Check, Heart, Sparkles } from 'lucide-react';

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

const levelFeelings = ["元気！", "違和感あり", "じわじわ痛い", "しんどい", "かなりつらい", "限界..."];

export default function YorisoiApp() {
  const [pairCode, setPairCode] = useState("");
  const [role, setRole] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [level, setLevel] = useState(0);
  const [data, setData] = useState({}); // マスター設定用
  const [status, setStatus] = useState(null); // リアルタイム体調用
  const [isSetting, setIsSetting] = useState(false);
  const [activeSettingSymptom, setActiveSettingSymptom] = useState("生理痛");
  const [settingLevel, setSettingLevel] = useState(0);

  const defaultSymptoms = ["つわり", "生理痛", "PMS", "頭痛", "腹痛", "だるい", "のどが痛い", "熱がある"];
  const defaultOptions = {
    doing: ["横になって休んでる", "薬を飲んで安静にしてる", "食欲がない", "少し落ち着いてきた"],
    requests: [
      { cat: "🧼 家事", items: ["洗い物をお願い", "洗濯物をお願い", "ゴミ出しをお願い"] },
      { cat: "🍱 食事", items: ["ゼリー買ってきて", "おかゆ食べたい", "Ｃ１０００買ってきて"] },
      { cat: "🌡️ ケア", items: ["腰をさすって", "湯たんぽ用意して", "部屋を暗くして"] }
    ],
    notToDo: ["話しかけないで", "大きな音NG", "匂いNG", "そっとしておいて"]
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
      updatedAt: new Date().getTime(),
      reaction: ""
    }, { merge: true });
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

  if (!pairCode || !role) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif', background: '#fcfdff', minHeight: '100vh' }}>
        <h1 style={{ color: '#9ebbd7' }}>💞 Yorisoi</h1>
        <input type="text" placeholder="合言葉を入力" onChange={(e) => setPairCode(e.target.value)} style={{ width: '80%', padding: '15px', borderRadius: '15px', border: '2px solid #eee', fontSize: '18px', textAlign: 'center', margin: '30px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '20px', borderRadius: '20px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold' }}>体調を伝えたい（彼女）</button>
          <button onClick={() => setRole('him')} style={{ padding: '20px', borderRadius: '20px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold' }}>体調を見守りたい（彼）</button>
        </div>
      </div>
    );
  }

  if (role === 'him') {
    const currentPlan = status ? getPlan(status.symptoms || [], status.level || 0) : null;
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', minHeight: '100vh', background: '#fff9fb' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', color: '#555' }}>💞 彼女の状態</h2>
        </header>
        {status && status.symptoms?.length > 0 ? (
          <div>
            <div style={{ background: '#fff', borderRadius: '30px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(255,158,181,0.2)', marginBottom: '25px' }}>
              <div style={{ fontSize: '18px', color: '#ff9eb5', fontWeight: 'bold' }}>{status.symptoms.join(' ＆ ')}</div>
              <div style={{ fontSize: '60px', fontWeight: 'bold', color: '#555', margin: '10px 0' }}>Lv.{status.level}</div>
              <div style={{ fontSize: '20px', color: '#ff7a99', fontWeight: 'bold' }}>😭 {status.feeling}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #9ebbd7' }}>
                <small style={{ color: '#9ebbd7', fontWeight: 'bold' }}>👟 今の状態</small>
                <div>{currentPlan.doing.join('、') || "休んでいます"}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #ff9eb5' }}>
                <small style={{ color: '#ff9eb5', fontWeight: 'bold' }}>🍼 お願い</small>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d04040' }}>{currentPlan.requests.map(r => `・${r}`).join('\n') || "そばにいてね"}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #bbb' }}>
                <small style={{ color: '#777', fontWeight: 'bold' }}>⚠️ NG</small>
                <div>{currentPlan.notToDo.map(n => `・${n}`).join('\n') || "特になし"}</div>
              </div>
            </div>
            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button onClick={() => setDoc(doc(db, "pairs", pairCode), { reaction: "🌸 助かった！" }, { merge: true })} style={{ padding: '15px', borderRadius: '15px', background: '#fff', border: '2px solid #ff9eb5', color: '#ff9eb5', fontWeight: 'bold' }}>🌸 助かった</button>
              <button onClick={() => setDoc(doc(db, "pairs", pairCode), { reaction: "✨ いつもありがとう" }, { merge: true })} style={{ padding: '15px', borderRadius: '15px', background: '#ff9eb5', border: 'none', color: '#fff', fontWeight: 'bold' }}>✨ ありがとう</button>
            </div>
          </div>
        ) : <p style={{ textAlign: 'center', color: '#ccc', marginTop: '100px' }}>彼女は今、元気そうです ✨</p>}
      </div>
    );
  }

  if (isSetting) {
    const config = data[activeSettingSymptom]?.[settingLevel] || { doing: [], requests: [], notToDo: [] };
    const allKnown = [...new Set([...defaultSymptoms, ...Object.keys(data)])];
    return (
      <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <button onClick={() => setIsSetting(false)} style={{ border: 'none', padding: '10px 20px', borderRadius: '10px', marginBottom: '20px', background: '#fff', fontWeight: 'bold' }}>◀ 完了</button>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px' }}>
          <label style={{ fontSize: '12px' }}>設定する症状</label>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
            {allKnown.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{ fontSize: '12px' }}>レベル {settingLevel}</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '35px', height: '35px', borderRadius: '50%', background: settingLevel === n ? '#9ebbd7' : '#fff' }}>{n}</button>)}
          </div>
          {/* 設定カテゴリー */}
          {Object.entries({ doing: '👟 状態', requests: '🍼 お願い', notToDo: '⚠️ NG' }).map(([key, label]) => (
            <div key={key} style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px' }}>{label}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {(key === 'requests' ? defaultOptions.requests.flatMap(g => g.items) : defaultOptions[key]).concat(config[key] || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
                  <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, key, item)} style={{ padding: '8px 12px', borderRadius: '20px', fontSize: '12px', background: config[key]?.includes(item) ? '#e0f0ff' : '#fff', border: '1px solid #eee' }}>{item}</button>
                ))}
                <button onClick={() => { const v = window.prompt("自由入力"); if(v) toggleSelection(activeSettingSymptom, settingLevel, key, v)}} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px dashed #aaa', fontSize: '12px' }}>+ 自由入力</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', background: '#fff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#9ebbd7', fontWeight: 'bold' }}>合言葉: {pairCode}</div>
        <Settings onClick={() => setIsSetting(true)} size={24} color="#ccc" style={{ cursor: 'pointer' }} />
      </header>
      {status?.reaction && <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center', color: '#ff7a99', fontWeight: 'bold' }}>彼から：{status.reaction}</div>}
      <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>1. 症状を選ぶ</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
        {defaultSymptoms.map(s => (
          <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} style={{ padding: '12px 18px', borderRadius: '15px', border: '1px solid #eee', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#777', fontWeight: 'bold' }}>{s}</button>
        ))}
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>2. しんどさは？</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #9ebbd7', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold' }}>{n}</button>)}
      </div>
      <div style={{ textAlign: 'center', color: '#ff7a99', fontWeight: 'bold', marginBottom: '30px' }}>😭 {levelFeelings[level]}</div>
      <button onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【Yorisoi通知】\n彼女の体調が更新されました！\n${selectedSymptoms.join('＆')} Lv.${level}\n${levelFeelings[level]}\nアプリを確認してね！`)}`)} style={{ width: '100%', padding: '20px', borderRadius: '35px', background: '#4cc764', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>彼にLINEで通知する（重要）</button>
    </div>
  );
}
