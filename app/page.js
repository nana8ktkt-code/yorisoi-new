"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, Heart, LogOut, Save } from 'lucide-react';

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

const softFontFace = '"Hiragino Maru Gothic ProN", "Meiryo", sans-serif';

const getHint = (lv) => {
  if (lv === 0) return "落ち着いているみたい。今のうちに家事や準備を済ませておこう🕊️";
  if (lv <= 1) return "少し違和感があるみたい。無理させないように気にかけてあげてね。";
  if (lv <= 3) return "しんどくなってきました。『何かできることある？』と聞いてみて。";
  return "かなりつらそう。今は設定の『遠慮してほしいこと』を守って、静かに見守るのが一番のケアだよ。";
};

const getDynamicBg = (lv, mode) => {
  if (mode === "🌿") return "#f2f2f2"; 
  if (mode === "🐶") return "#fff3e0"; 
  const colors = ["#f0fcf4", "#f4fcf0", "#fffbe6", "#fff5f0", "#fff0f5", "#f5f0ff"];
  return colors[lv] || "#f0f7ff";
};

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

  const defaultSymptoms = ["つわり", "生理痛", "PMS", "頭痛", "腹痛", "だるい", "のどが痛い", "熱がある"];

  useEffect(() => {
    const savedCode = localStorage.getItem('yorisoi_pairCode');
    const savedRole = localStorage.getItem('yorisoi_role');
    if (savedCode && savedRole) {
      setPairCode(savedCode);
      setRole(savedRole);
      setShowIntro(false);
    }
  }, []);

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
    if(confirm("ログアウトしますか？")) {
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

  const updateStatus = async (newSyms, newLv, mood = null, mode = null) => {
    if (!pairCode) return;
    const plan = getPlan(newSyms, newLv);
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

  const saveCustomText = async (type) => {
    const text = customInput[type];
    if (!text.trim() || !pairCode) return;
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
    newData[symptom][lv][type] = list.filter(i => i !== item);
    setData(newData);
    await setDoc(doc(db, "configs", pairCode), newData);
  };

  const currentBg = getDynamicBg(status?.level || 0, status?.mode);

  if (showIntro && !pairCode) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: softFontFace, background: '#f0f7ff', minHeight: '100vh' }}>
        <Heart size={64} color="#9ebbd7" style={{ marginTop: '60px' }} />
        <h1 style={{ color: '#9ebbd7', fontSize: '32px', margin: '20px 0 40px' }}>YORISOI</h1>
        <button onClick={startAsReporter} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', marginBottom: '40px', border: 'none', cursor: 'pointer' }}>おつたえ側 🕊️</button>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '25px' }}>
          <input type="text" placeholder="コードを入力" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '15px', textAlign: 'center', border: 'none', fontSize: '20px' }} />
          <button onClick={startAsSupporter} className="push-btn" style={{ width: '100%', padding: '15px', borderRadius: '20px', background: '#eee', marginTop: '10px', border: 'none', cursor: 'pointer' }}>みまもり側として参加 🤝</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, background: currentBg, minHeight: '100vh', transition: '0.5s' }}>
      {isSetting ? (
        <div style={{ background: '#fff', padding: '25px', borderRadius: '30px', minHeight: '80vh' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '10px 20px', background: '#f0f7ff', borderRadius: '15px', color: '#9ebbd7', marginBottom: '20px', border: 'none' }}>◀ 戻る</button>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
            {defaultSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            {[0, 1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : '#eee', color: '#fff' }}>{n}</button>
            ))}
          </div>
          {['doing', 'requests', 'notToDo'].map(type => (
            <div key={type} style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                {type === 'doing' ? 'やっていること💪' : type === 'requests' ? 'やってくれたら嬉しい☺️' : '遠慮してほしいな🥺'}
              </p>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input value={customInput[type]} onChange={(e) => setCustomInput({...customInput, [type]: e.target.value})} placeholder="項目を入力..." style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #eee', fontSize: '13px' }} />
                <button onClick={() => saveCustomText(type)} style={{ padding: '10px', background: '#9ebbd7', color: '#fff', borderRadius: '10px', border: 'none' }}><Save size={18}/></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {data[activeSettingSymptom]?.[settingLevel]?.[type]?.map(item => (
                  <span key={item} onClick={() => toggleConfigItem(activeSettingSymptom, settingLevel, type, item)} style={{ padding: '5px 10px', background: '#f9f9f9', borderRadius: '10px', fontSize: '11px', cursor: 'pointer', border: '1px solid #eee' }}>
                    {item} <span style={{color: '#ccc', marginLeft: '4px'}}>✕</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontWeight: 'bold', color: '#9ebbd7' }}>ID: {pairCode}</span>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Settings onClick={() => setIsSetting(true)} color="#9ebbd7" style={{cursor: 'pointer'}} />
              <LogOut onClick={logout} color="#f87171" size={20} style={{cursor: 'pointer'}} />
            </div>
          </header>

          {role === 'her' ? (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px', marginBottom: '20px' }}>
                {moodOptions.map(m => (
                  <button key={m.label} onClick={() => updateStatus(selectedSymptoms, level, m.emoji + " " + m.label)} style={{ flex: 1, padding: '10px 5px', borderRadius: '15px', background: status?.mood === (m.emoji + " " + m.label) ? '#9ebbd7' : '#fff', color: status?.mood === (m.emoji + " " + m.label) ? '#fff' : '#5a7d9a', border: 'none', fontSize: '10px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '18px' }}>{m.emoji}</div>{m.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button onClick={() => updateStatus(selectedSymptoms, level, null, "🐶")} style={{ flex: 1, padding: '15px', borderRadius: '20px', border: 'none', background: status?.mode === "🐶" ? "#fff3e0" : "#fff", fontWeight: 'bold', cursor: 'pointer' }}>🐶 そばにいて</button>
                <button onClick={() => updateStatus(selectedSymptoms, level, null, "🌿")} style={{ flex: 1, padding: '15px', borderRadius: '20px', border: 'none', background: status?.mode === "🌿" ? "#f2f2f2" : "#fff", fontWeight: 'bold', cursor: 'pointer' }}>🌿 そっとして</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
                {defaultSymptoms.map(s => (
                  <button key={s} onClick={() => {
                    const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s];
                    setSelectedSymptoms(next); updateStatus(next, level);
                  }} style={{ padding: '10px 15px', borderRadius: '15px', border: 'none', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#9ebbd7', fontSize: '13px', cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold', cursor: 'pointer' }}>{n}</button>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: '25px', padding: '30px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '50px' }}>{levelEmojis[level]}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{levelFeelings[level]}</div>
              </div>
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button onClick={() => { navigator.clipboard.writeText(pairCode); alert("コピーしました！"); }} style={{ background: 'none', border: 'none', color: '#9ebbd7', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer' }}>招待コードをコピー</button>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              {status ? (
                <>
                  <div style={{ background: '#fff', padding: '30px', borderRadius: '35px', textAlign: 'center', marginBottom: '20px' }}>
                    <p style={{ color: '#9ebbd7', fontWeight: 'bold', fontSize: '14px' }}>
                      {status.mood} {status.mode === "🐶" ? "そばにいてほしいみたい" : status.mode === "🌿" ? "そっとしてほしいみたい" : ""}
                    </p>
                    <div style={{ fontSize: '60px', margin: '15px 0' }}>Lv.{status.level}</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{status.emoji} {status.feeling}</div>
                    <div style={{ marginTop: '15px', fontSize: '13px', background: '#f0f7ff', padding: '10px', borderRadius: '15px' }}>{getHint(status.level)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', borderLeft: '5px solid #9ebbd7' }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ebbd7', marginBottom: '10px' }}>やっていること💪</p>
                      {status.doing?.length > 0 ? status.doing.map(r => <div key={r} style={{ fontSize: '14px', marginBottom: '5px' }}>・{r}</div>) : <div style={{color:'#ccc', fontSize:'12px'}}>特になし</div>}
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', borderLeft: '5px solid #ff9eb5' }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff9eb5', marginBottom: '10px' }}>やってくれたら嬉しい☺️</p>
                      {status.requests?.length > 0 ? status.requests.map(r => <div key={r} style={{ fontSize: '14px', marginBottom: '5px' }}>・{r}</div>) : <div style={{color:'#ccc', fontSize:'12px'}}>特になし</div>}
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', borderLeft: '5px solid #ccc' }}>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '10px' }}>遠慮してほしいな🥺</p>
                      {status.notToDo?.length > 0 ? status.notToDo.map(r => <div key={r} style={{ fontSize: '14px', marginBottom: '5px' }}>・{r}</div>) : <div style={{color:'#ccc', fontSize:'12px'}}>特になし</div>}
                    </div>
                  </div>
                </>
              ) : <p style={{ textAlign: 'center', color: '#9ebbd7' }}>データを読み込み中...</p>}
            </div>
          )}
        </>
      )}
      <style jsx>{`
        .push-btn { transition: 0.2s; cursor: pointer; }
        .push-btn:active { transform: scale(0.95); }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
