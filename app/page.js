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

// しんどさレベルの定義（リクエスト通りに修正）
const levelFeelings = ["落ち着いたよ", "違和感あり", "ちょっとしんどい", "しんどい", "かなりつらい", "限界・・"];
const levelEmojis = ["🍃", "😅", "😿", "😭", "🥶", "🚫"];

// 共通のソフトフォント設定
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
      emoji: levelEmojis[newLevel],
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

  const pageStyle = {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: softFontFace,
    background: '#f0f7ff',
    minHeight: '100vh',
    color: '#5a7d9a'
  };

  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '32px' }}>🕊️ YORISOI</h1>
        <p style={{ fontSize: '14px', marginBottom: '30px' }}>ふたりの合言葉を入力してください</p>
        <input type="text" placeholder="合言葉を入力" onChange={(e) => setPairCode(e.target.value)} style={{ width: '85%', padding: '18px', borderRadius: '20px', border: 'none', fontSize: '18px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '20px', borderRadius: '25px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>体調を伝えたい（彼女）</button>
          <button onClick={() => setRole('him')} style={{ padding: '20px', borderRadius: '25px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold', fontSize: '16px' }}>体調を見守りたい（彼）</button>
        </div>
      </div>
    );
  }

  if (role === 'him') {
    const currentPlan = status ? getPlan(status.symptoms || [], status.level || 0) : null;
    return (
      <div style={pageStyle}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px' }}>🕊️ 彼女の状態</h2>
        </header>
        {status && status.symptoms?.length > 0 ? (
          <div>
            <div style={{ background: '#fff', borderRadius: '35px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 25px rgba(158,187,215,0.3)', marginBottom: '25px' }}>
              <div style={{ fontSize: '18px', color: '#9ebbd7', fontWeight: 'bold' }}>{status.symptoms.join(' ＆ ')}</div>
              <div style={{ fontSize: '60px', fontWeight: 'bold', color: '#5a7d9a', margin: '10px 0' }}>Lv.{status.level}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: status.level === 0 ? '#82c49a' : '#ff9eb5' }}>
                {levelEmojis[status.level]} {status.feeling}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #9ebbd7' }}>
                <small style={{ fontWeight: 'bold' }}>👟 今の状態</small>
                <div style={{ marginTop: '5px' }}>{currentPlan.doing.join('、') || "休んでいます"}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #ff9eb5' }}>
                <small style={{ color: '#ff9eb5', fontWeight: 'bold' }}>🍼 お願い</small>
                <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#d04040', marginTop: '5px' }}>{currentPlan.requests.map(r => `・${r}`).join('\n') || "そばにいてね"}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #bbb' }}>
                <small style={{ color: '#777', fontWeight: 'bold' }}>⚠️ NG</small>
                <div style={{ marginTop: '5px' }}>{currentPlan.notToDo.map(n => `・${n}`).join('\n') || "特になし"}</div>
              </div>
            </div>
            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button onClick={() => setDoc(doc(db, "pairs", pairCode), { reaction: "🌸 助かったよ" }, { merge: true })} style={{ padding: '15px', borderRadius: '20px', background: '#fff', border: '2px solid #9ebbd7', color: '#9ebbd7', fontWeight: 'bold' }}>🌸 助かった</button>
              <button onClick={() => setDoc(doc(db, "pairs", pairCode), { reaction: "✨ ありがとう" }, { merge: true })} style={{ padding: '15px', borderRadius: '20px', background: '#9ebbd7', border: 'none', color: '#fff', fontWeight: 'bold' }}>✨ ありがとう</button>
            </div>
          </div>
        ) : <p style={{ textAlign: 'center', color: '#9ebbd7', marginTop: '100px' }}>🍃 彼女は今、落ち着いているようです</p>}
      </div>
    );
  }

  if (isSetting) {
    const config = data[activeSettingSymptom]?.[settingLevel] || { doing: [], requests: [], notToDo: [] };
    const allKnown = [...new Set([...defaultSymptoms, ...Object.keys(data)])];
    return (
      <div style={{ ...pageStyle, background: '#fff' }}>
        <button onClick={() => setIsSetting(false)} style={{ border: 'none', padding: '12px 24px', borderRadius: '15px', marginBottom: '20px', background: '#f0f7ff', color: '#9ebbd7', fontWeight: 'bold' }}>◀ 戻る</button>
        <div style={{ background: '#fcfdff', padding: '25px', borderRadius: '25px', border: '1px solid #eef' }}>
          <label style={{ fontSize: '12px', color: '#999' }}>設定する症状</label>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #eee' }}>
            {allKnown.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{ fontSize: '12px', color: '#999' }}>レベル {settingLevel} のとき</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : '#eee', color: settingLevel === n ? '#fff' : '#aaa' }}>{n}</button>)}
          </div>
          {Object.entries({ doing: '👟 状態', requests: '🍼 お願い', notToDo: '⚠️ NG' }).map(([key, label]) => (
            <div key={key} style={{ marginBottom: '25px' }}>
              <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>{label}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(key === 'requests' ? defaultOptions.requests.flatMap(g => g.items) : defaultOptions[key]).concat(config[key] || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
                  <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, key, item)} style={{ padding: '10px 16px', borderRadius: '20px', fontSize: '13px', background: config[key]?.includes(item) ? '#9ebbd7' : '#fff', color: config[key]?.includes(item) ? '#fff' : '#777', border: '1px solid #eee' }}>{item}</button>
                ))}
                <button onClick={() => { const v = window.prompt("自由に入力してください"); if(v) toggleSelection(activeSettingSymptom, settingLevel, key, v)}} style={{ padding: '10px 16px', borderRadius: '20px', border: '1px dashed #9ebbd7', fontSize: '13px', color: '#9ebbd7', background: '#fff' }}>+ 自由入力</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>🕊️ {pairCode}</div>
        <Settings onClick={() => setIsSetting(true)} size={26} color="#9ebbd7" style={{ cursor: 'pointer' }} />
      </header>
      {status?.reaction && <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', marginBottom: '25px', textAlign: 'center', color: '#ff9eb5', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>彼から：{status.reaction}</div>}
      
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>1. 症状を選ぶ</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '35px' }}>
        {defaultSymptoms.map(s => (
          <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} style={{ padding: '14px 20px', borderRadius: '20px', border: 'none', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#777', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>{s}</button>
        ))}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>2. しんどさは？</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{n}</button>)}
      </div>
      
      <div style={{ textAlign: 'center', color: level === 0 ? '#82c49a' : '#ff9eb5', fontWeight: 'bold', fontSize: '20px', margin: '20px 0 40px 0' }}>
        {levelEmojis[level]} {levelFeelings[level]}
      </div>

      <button onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【YORISOI🕊️】\n彼女の体調が更新されました！\n${selectedSymptoms.join('＆')} Lv.${level}\n${levelEmojis[level]}${levelFeelings[level]}\nアプリを確認してね！`)}`)} style={{ width: '100%', padding: '22px', borderRadius: '35px', background: '#4cc764', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '17px', boxShadow: '0 6px 20px rgba(76,199,100,0.3)' }}>彼にLINEで通知する（重要）</button>
    </div>
  );
}
