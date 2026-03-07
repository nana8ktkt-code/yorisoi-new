"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Edit3, Plus, Sparkles, Trash2, Check, Lightbulb, Heart, Copy, Share, LogOut, Save } from 'lucide-react';

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

const levelFeelings = ["落ち着いたよ", "違和感あり", "ちょっとしんどい", "しんどい", "かなりつらい", "限界"];
const levelEmojis = ["🍃", "😅", "😷", "😭", "🥶", "🤮"];
const moodOptions = [
  { emoji: "🙂", label: "落ち着いてる" },
  { emoji: "😢", label: "寂しい" },
  { emoji: "😡", label: "イライラ" },
  { emoji: "😴", label: "眠い" },
  { emoji: "🤢", label: "気持ち悪い" }
];

const defaultSymptoms = ["つわり", "生理痛", "頭痛", "腹痛", "だるい", "熱がある"];
const softFontFace = '"Hiragino Maru Gothic ProN", "Meiryo", sans-serif';

export default function YorisoiApp() {
  const [showIntro, setShowIntro] = useState(true);
  const [pairCode, setPairCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [role, setRole] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [level, setLevel] = useState(0);
  const [data, setData] = useState({});
  const [status, setStatus] = useState(null);
  const [isSetting, setIsSetting] = useState(false);
  const [activeSettingSymptom, setActiveSettingSymptom] = useState("生理痛");
  const [settingLevel, setSettingLevel] = useState(0);
  const [customInput, setCustomInput] = useState({ doing: "", requests: "", notToDo: "" });

  // 1. ログイン保持 (localStorageから復元)
  useEffect(() => {
    const savedCode = localStorage.getItem('yorisoi_pairCode');
    const savedRole = localStorage.getItem('yorisoi_role');
    if (savedCode && savedRole) {
      setPairCode(savedCode);
      setRole(savedRole);
      setShowIntro(false);
    }
  }, []);

  // Firebase同期
  useEffect(() => {
    if (!pairCode) return;
    const unsubStatus = onSnapshot(doc(db, "pairs", pairCode), (s) => { if (s.exists()) setStatus(s.data()); });
    const unsubConfig = onSnapshot(doc(db, "configs", pairCode), (s) => { if (s.exists()) setData(s.data()); });
    return () => { unsubStatus(); unsubConfig(); };
  }, [pairCode]);

  const saveLogin = (code, r) => {
    localStorage.setItem('yorisoi_pairCode', code);
    localStorage.setItem('yorisoi_role', r);
    setPairCode(code);
    setRole(r);
  };

  const logout = () => {
    if(confirm("ログアウトしますか？ペアコードを控えていない場合、再ログインできません。")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const startAsReporter = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    saveLogin(code, 'her');
  };

  const startAsSupporter = () => {
    if (inputCode.length >= 4) saveLogin(inputCode.toUpperCase(), 'him');
  };

  // ステータス更新
  const updateStatus = async (newSyms, newLv, customPlan = null, mood = null, mode = null) => {
    if (!pairCode) return;
    const plan = customPlan || getPlan(newSyms, newLv);
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: newSyms, level: newLv, feeling: levelFeelings[newLv], emoji: levelEmojis[newLv],
      mood: mood !== null ? (status?.mood === mood ? "" : mood) : (status?.mood || ""),
      mode: mode !== null ? (status?.mode === mode ? "" : mode) : (status?.mode || ""),
      updatedAt: new Date().getTime(), doing: plan.doing, requests: plan.requests, notToDo: plan.notToDo,
      completedTasks: status?.completedTasks || []
    }, { merge: true });
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

  // 設定画面での自由記述保存
  const saveCustomText = async (type) => {
    const text = customInput[type];
    if (!text.trim()) return;
    const newData = { ...data };
    if (!newData[activeSettingSymptom]) newData[activeSettingSymptom] = {};
    if (!newData[activeSettingSymptom][settingLevel]) newData[activeSettingSymptom][settingLevel] = { doing: [], requests: [], notToDo: [] };
    
    if (!newData[activeSettingSymptom][settingLevel][type].includes(text)) {
      newData[activeSettingSymptom][settingLevel][type] = [...newData[activeSettingSymptom][settingLevel][type], text];
      setData(newData);
      await setDoc(doc(db, "configs", pairCode), newData);
      setCustomInput({ ...customInput, [type]: "" });
    }
  };

  const toggleConfigItem = async (symptom, lv, type, item) => {
    const newData = { ...data };
    const list = newData[symptom]?.[lv]?.[type] || [];
    newData[symptom][lv][type] = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setData(newData);
    await setDoc(doc(db, "configs", pairCode), newData);
  };
  // 続き
  const currentBg = (lv, mode) => {
    if (mode === "🌿") return "#f2f2f2";
    if (mode === "🐶") return "#fff3e0";
    const colors = ["#f0fcf4", "#f4fcf0", "#fffbe6", "#fff5f0", "#fff0f5", "#f5f0ff"];
    return colors[lv] || "#f0f7ff";
  };

  const bgStyle = currentBg(status?.level || 0, status?.mode);

  if (showIntro && !pairCode) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, textAlign: 'center' }}>
        <Heart size={64} color="#9ebbd7" style={{ marginBottom: '20px' }} />
        <h1 style={{ color: '#9ebbd7', fontSize: '32px', marginBottom: '40px' }}>YORISOI</h1>
        <button onClick={startAsReporter} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', marginBottom: '30px' }}>おつたえ側 🕊️</button>
        <input type="text" placeholder="招待コードを入力" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '15px', borderRadius: '20px', border: 'none', textAlign: 'center', marginBottom: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
        <button onClick={startAsSupporter} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7' }}>みまもり側 🤝</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, background: bgStyle, minHeight: '100vh', transition: '0.5s' }}>
      {isSetting ? (
        /* 設定画面 */
        <div style={{ background: '#fff', padding: '25px', borderRadius: '30px' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '10px 20px', background: '#f0f7ff', borderRadius: '15px', color: '#9ebbd7', marginBottom: '20px' }}>◀ 戻る</button>
          
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>症状を選択</label>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', margin: '10px 0 20px' }}>
            {defaultSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>しんどさ Lv.{settingLevel}</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0 25px' }}>
            {[0, 1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : '#eee', color: '#fff' }}>{n}</button>
            ))}
          </div>

          {['doing', 'requests', 'notToDo'].map(type => (
            <div key={type} style={{ marginBottom: '25px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>{type === 'doing' ? 'やっていること' : type === 'requests' ? 'お願い' : 'NGなこと'}</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input value={customInput[type]} onChange={(e) => setCustomInput({...customInput, [type]: e.target.value})} placeholder="自由に入力" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #eee' }} />
                <button onClick={() => saveCustomText(type)} style={{ padding: '10px', background: '#9ebbd7', color: '#fff', borderRadius: '10px' }}><Save size={20}/></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data[activeSettingSymptom]?.[settingLevel]?.[type]?.map(item => (
                  <button key={item} onClick={() => toggleConfigItem(activeSettingSymptom, settingLevel, type, item)} className="push-btn" style={{ padding: '8px 12px', borderRadius: '15px', background: '#f0f7ff', color: '#9ebbd7', fontSize: '12px' }}>{item} ✕</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* メイン画面 */
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <span style={{ fontWeight: 'bold', color: '#9ebbd7' }}>ID: {pairCode}</span>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Settings onClick={() => setIsSetting(true)} color="#9ebbd7" />
              <LogOut onClick={logout} color="#f87171" size={22} />
            </div>
          </header>

          {role === 'her' ? (
            <div className="fade-in">
              <h2 className="section-title">今日の気分は？</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '20px' }}>
                {moodOptions.map(m => (
                  <button key={m.label} onClick={() => updateStatus(selectedSymptoms, level, null, m.emoji + " " + m.label)} style={{ flex: 1, padding: '10px', borderRadius: '15px', background: status?.mood?.includes(m.label) ? '#9ebbd7' : '#fff', color: status?.mood?.includes(m.label) ? '#fff' : '#5a7d9a', border: 'none', boxShadow: '0 4px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '20px' }}>{m.emoji}</div>
                    <div style={{ fontSize: '9px' }}>{m.label}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => updateStatus(selectedSymptoms, level, null, null, "🐶")} style={{ flex: 1, padding: '15px', borderRadius: '20px', border: 'none', background: status?.mode === "🐶" ? "#fff3e0" : "#fff", fontWeight: 'bold' }}>🐶 そばにいて</button>
                <button onClick={() => updateStatus(selectedSymptoms, level, null, null, "🌿")} style={{ flex: 1, padding: '15px', borderRadius: '20px', border: 'none', background: status?.mode === "🌿" ? "#f2f2f2" : "#fff", fontWeight: 'bold' }}>🌿 そっとして</button>
              </div>

              <h2 className="section-title">1. 症状</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
                {defaultSymptoms.map(s => (
                  <button key={s} onClick={() => {
                    const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s];
                    setSelectedSymptoms(next); updateStatus(next, level);
                  }} style={{ padding: '12px 18px', borderRadius: '20px', border: 'none', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#9ebbd7', fontWeight: 'bold' }}>{s}</button>
                ))}
              </div>

              <h2 className="section-title">2. しんどさ</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold' }}>{n}</button>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: '25px', padding: '30px', textAlign: 'center', marginBottom: '40px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '50px' }}>{levelEmojis[level]}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{levelFeelings[level]}</div>
              </div>

              {/* 招待機能復活 */}
              <div style={{ border: '2px dashed #9ebbd7', padding: '20px', borderRadius: '25px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ebbd7' }}>招待コードを共有</p>
                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{pairCode}</div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => { navigator.clipboard.writeText(pairCode); alert("コピーしました"); }} style={{ padding: '10px', background: '#fff', borderRadius: '15px', border: '1px solid #9ebbd7' }}><Copy size={20}/></button>
                  <button onClick={() => { window.open(`https://line.me/R/msg/text/?YORISOIでつながろう🕊️招待コード: ${pairCode}`); }} style={{ padding: '10px', background: '#4cc764', borderRadius: '15px', color: '#fff' }}><Share size={20}/></button>
                </div>
              </div>
            </div>
          ) : (
            /* みまもり側 UI (省略せず保持) */
            <div className="fade-in">
              {status ? (
                <div style={{ background: '#fff', padding: '30px', borderRadius: '35px', textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', color: '#9ebbd7' }}>{status.mood} {status.mode === "🐶" ? "そばにいてほしいみたい" : status.mode === "🌿" ? "そっとしてほしいみたい" : ""}</p>
                  <div style={{ fontSize: '64px', margin: '20px 0' }}>{status.level}</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{status.emoji} {status.feeling}</div>
                </div>
              ) : <p>待機中...</p>}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .push-btn { transition: 0.2s; cursor: pointer; border: none; }
        .push-btn:active { transform: scale(0.95); }
        .section-title { font-size: 15px; font-weight: bold; margin-bottom: 15px; color: #5a7d9a; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
