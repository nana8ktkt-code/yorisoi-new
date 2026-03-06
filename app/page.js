"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Edit3, Plus, Sparkles, Trash2, Check, Lightbulb, Heart, Copy, Share } from 'lucide-react';

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

// しんどさレベルの定義
const levelFeelings = ["落ち着いたよ", "違和感あり", "ちょっとしんどい", "しんどい", "かなりつらい", "限界"];
const levelEmojis = ["🍃", "😅", "😷", "😭", "🥶", "🤮"];

const moodOptions = ["眠い...", "イライラしちゃう", "寂しい", "そっとしておいて", "食欲なし"];
const softFontFace = '"Hiragino Maru Gothic ProN", "Meiryo", sans-serif';

const getHint = (lv) => {
  if (lv === 0) return "落ち着いているみたい。今のうちに家事や準備を済ませておこう🕊️";
  if (lv <= 1) return "少し違和感があるみたい。無理させないように気にかけてあげてね。";
  if (lv <= 3) return "しんどくなってきました。『何かできることある？』と聞いてみて。";
  return "かなりつらそう。今は設定の『遠慮してほしいこと』を守って、静かに見守るのが一番のケアだよ。";
};

const getBgColor = (lv) => {
  const colors = ["#f0fcf4", "#f4fcf0", "#fffbe6", "#fff5f0", "#fff0f5", "#f5f0ff"];
  return colors[lv] || "#f0f7ff";
};

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

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
  const [sentMsg, setSentMsg] = useState(null);

  const defaultSymptoms = ["つわり", "生理痛", "PMS", "頭痛", "腹痛", "だるい", "のどが痛い", "熱がある"];
  const defaultOptions = {
    doing: ["横になって休んでる", "薬飲んでる", "食欲がない", "少し落ち着いたきた", "声がでません", "お風呂入れない"],
    requests: [
      { cat: "🧼 家事", items: ["洗い物をお願い", "洗濯物をお願い", "ゴミ出しをお願い"] },
      { cat: "🍱 食事", items: ["お寿司たべたいな", "おかゆ食べたい", "Ｃ1000出してきてほしいな"] },
      { cat: "🌡️ ケア", items: ["腰をさすって", "部屋あたたかくして", "部屋を暗くして"] }
    ],
    notToDo: ["話しかけないで", "大きな音NG", "匂いNG", "そっとしておいて"]
  };

  useEffect(() => {
    if (!pairCode) return;
    const unsubStatus = onSnapshot(doc(db, "pairs", pairCode), (s) => { if (s.exists()) setStatus(s.data()); });
    const unsubConfig = onSnapshot(doc(db, "configs", pairCode), (s) => { if (s.exists()) setData(s.data()); });
    return () => { unsubStatus(); unsubConfig(); };
  }, [pairCode]);

  const startAsReporter = () => {
    const code = generateCode();
    setPairCode(code);
    setRole('her');
  };

  const startAsSupporter = () => {
    if (inputCode.length >= 4) {
      const code = inputCode.toUpperCase();
      setPairCode(code);
      setRole('him');
    }
  };

  const updateStatus = async (newSymptoms, newLevel, customPlan = null, mood = null) => {
    if (!pairCode) return;
    const plan = customPlan || getPlan(newSymptoms, newLevel);
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: newSymptoms, level: newLevel, feeling: levelFeelings[newLevel], emoji: levelEmojis[newLevel],
      mood: mood !== null ? mood : (status?.mood || ""),
      updatedAt: new Date().getTime(), doing: plan.doing, requests: plan.requests, notToDo: plan.notToDo,
      completedTasks: status?.completedTasks || [],
      actions: status?.actions || []
    }, { merge: true });
  };

  const resetStatus = async () => {
    if (!confirm("体調データをリセットして「落ち着いたよ」に戻しますか？")) return;
    setSelectedSymptoms([]);
    setLevel(0);
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: [], level: 0, feeling: levelFeelings[0], emoji: levelEmojis[0], mood: "",
      updatedAt: new Date().getTime(), doing: [], requests: [], notToDo: [],
      completedTasks: [], thanks: "", actions: []
    });
  };

  const addAction = async (msg) => {
    const currentActions = status?.actions || [];
    if (currentActions.some(a => a.text === msg)) return;
    const newAction = { id: Date.now().toString(), text: msg, time: new Date().getTime() };
    const nextActions = [newAction, ...currentActions].slice(0, 5);
    await setDoc(doc(db, "pairs", pairCode), { actions: nextActions }, { merge: true });
  };

  const toggleTask = async (task) => {
    const current = status?.completedTasks || [];
    const isNowCompleted = !current.includes(task);
    if (isNowCompleted) {
      setSentMsg(`「${task}」完了！`);
      setTimeout(() => setSentMsg(null), 1500);
      await addAction(`✨ 「${task}」をやってくれました！`);
    }
    await setDoc(doc(db, "pairs", pairCode), { 
      completedTasks: isNowCompleted ? [...current, task] : current.filter(t => t !== task)
    }, { merge: true });
  };

  const sendQuickReply = async (msg) => {
    if (status?.actions?.some(a => a.text.includes(msg))) return;
    setSentMsg("送信したよ🕊️");
    setTimeout(() => setSentMsg(null), 1500);
    await addAction(`💬 お相手：${msg}`);
  };

  const sendThanks = async (msg) => {
    await setDoc(doc(db, "pairs", pairCode), { thanks: msg, actions: [], updatedAt: new Date().getTime() }, { merge: true });
    alert("感謝を伝えました🕊️");
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

  const editPlanItem = (type) => {
    const current = status?.[type]?.join('、') || "";
    const label = type === 'doing' ? '今の状態' : type === 'requests' ? 'やってほしいこと' : '遠慮してほしいこと';
    const newValue = window.prompt(`${label}を入力してください`, current);
    if (newValue !== null) {
      const newList = newValue.split(/[、, ]/).filter(i => i.trim() !== "");
      updateStatus(selectedSymptoms, level, {
        doing: type === 'doing' ? newList : (status?.doing || []),
        requests: type === 'requests' ? newList : (status?.requests || []),
        notToDo: type === 'notToDo' ? newList : (status?.notToDo || [])
      });
    }
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

  const addCustomOption = (type) => {
    const newItem = window.prompt("追加したい項目を入力してください");
    if (newItem && newItem.trim() !== "") {
      const trimmedItem = newItem.trim();
      const newData = { ...data };
      if (!newData[activeSettingSymptom]) newData[activeSettingSymptom] = {};
      if (!newData[activeSettingSymptom][settingLevel]) newData[activeSettingSymptom][settingLevel] = { doing: [], requests: [], notToDo: [] };
      if (!newData[activeSettingSymptom][settingLevel][type].includes(trimmedItem)) {
        newData[activeSettingSymptom][settingLevel][type] = [...newData[activeSettingSymptom][settingLevel][type], trimmedItem];
        setData(newData);
        setDoc(doc(db, "configs", pairCode), newData);
      }
    }
  };

  const currentBg = getBgColor(status?.level || 0);
  const pageStyle = { padding: '30px 20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, background: currentBg, minHeight: '100vh', color: '#5a7d9a', transition: 'background 0.5s ease' };

  if (showIntro) {
    return (
      <div style={{ ...pageStyle, background: '#f0f7ff', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <Heart size={64} color="#9ebbd7" style={{ marginBottom: '20px' }} />
        <h1 style={{ color: '#9ebbd7', fontSize: '32px', letterSpacing: '4px', marginBottom: '10px' }}>YORISOI</h1>
        <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '40px', color: '#7ba2c7' }}>体調を言葉にしなくても<br /><strong>大切な人に</strong>伝えられるアプリ</p>
        <div style={{ textAlign: 'left', background: '#fff', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)', width: '100%', marginBottom: '50px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>①</span><span style={{ fontSize: '14px' }}>体調を入力</span></div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>②</span><span style={{ fontSize: '14px' }}>お願いが自動生成</span></div>
          <div style={{ display: 'flex', gap: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>③</span><span style={{ fontSize: '14px' }}><strong>お相手に</strong>共有</span></div>
        </div>
        <button onClick={() => setShowIntro(false)} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '35px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 6px 20px rgba(158,187,215,0.4)' }}>はじめる</button>
      </div>
    );
  }

  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '80px 20px', background: '#f0f7ff' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '36px', letterSpacing: '2px' }}>🕊️ YORISOI</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '60px' }}>
          <button onClick={startAsReporter} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 6px 20px rgba(158,187,215,0.3)' }}>おつたえ側 🕊️</button>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '14px', marginBottom: '15px', color: '#7ba2c7' }}>招待コードを入力して参加</p>
            <input type="text" placeholder="AX92KD" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '18px', borderRadius: '25px', border: 'none', fontSize: '24px', textAlign: 'center', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', color: '#5a7d9a' }} />
            <button onClick={startAsSupporter} disabled={inputCode.length < 4} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#fff', color: '#9ebbd7', fontWeight: 'bold', fontSize: '18px', border: '2px solid #9ebbd7' }}>みまもり側 🤝</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {isSetting ? (
        <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '12px 24px', borderRadius: '15px', marginBottom: '25px', background: '#f0f7ff', color: '#9ebbd7', fontWeight: 'bold' }}>◀ 戻る</button>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>編集する症状</label>
            <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', border: '1px solid #eee', background: '#fafafa', color: '#5a7d9a', fontSize: '16px' }}>
              {defaultSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>しんどさレベル</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fafafa', padding: '10px', borderRadius: '20px' }}>
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : 'transparent', color: settingLevel === n ? '#fff' : '#ccc', fontWeight: 'bold' }}>{n}</button>
              ))}
            </div>
          </div>
          {['doing', 'requests', 'notToDo'].map((type) => (
            <div key={type} style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{type === 'doing' ? '今の状態' : type === 'requests' ? 'やってほしいこと' : '遠慮してほしいこと'}</span>
                <button onClick={() => addCustomOption(type)} style={{ background: 'none', border: 'none', color: '#9ebbd7', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold' }}><Plus size={16} /> 追加</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {(type === 'requests' ? defaultOptions.requests.flatMap(cat => cat.items) : defaultOptions[type]).concat(data[activeSettingSymptom]?.[settingLevel]?.[type] || []).filter((v, i, a) => a.indexOf(v) === i).map(item => {
                  const isActive = data[activeSettingSymptom]?.[settingLevel]?.[type]?.includes(item);
                  return (
                    <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, type, item)} className={`push-btn chip ${isActive ? 'active' : ''}`} style={{ padding: '10px 18px', borderRadius: '20px', border: 'none', background: isActive ? '#9ebbd7' : '#f5f5f5', color: isActive ? '#fff' : '#888', fontSize: '13px' }}>{item}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px 18px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ebbd7' }}>ID: {pairCode}</span>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Trash2 onClick={resetStatus} size={24} color="#f87171" style={{ cursor: 'pointer' }} />
              <Settings onClick={() => setIsSetting(true)} size={26} color="#9ebbd7" style={{ cursor: 'pointer' }} />
            </div>
          </header>

          {role === 'him' ? (
            <div className="fade-in">
              {status && (status.symptoms?.length > 0 || status.level !== undefined) ? (
                <>
                  <div style={{ background: '#fff', borderRadius: '35px', padding: '35px 25px', textAlign: 'center', marginBottom: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '17px', color: '#9ebbd7', fontWeight: 'bold', marginBottom: '10px' }}>{status.symptoms?.join(' ＆ ')}</div>
                    <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#5a7d9a', margin: '10px 0' }}>Lv.{status.level}</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{status.emoji} {status.feeling}</div>
                    <div style={{ marginTop: '20px', background: '#f0f7ff', padding: '15px', borderRadius: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                      <Lightbulb size={18} style={{ marginBottom: '5px' }} /> <br /> {getHint(status.level)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="info-card" style={{ borderLeft: '6px solid #9ebbd7', background: '#fff', padding: '22px', borderRadius: '25px', display: 'flex', gap: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: '28px' }}>😷</span>
                      <div><small style={{ color: '#9ebbd7', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>やっていること</small><div style={{ fontSize: '16px' }}>{status.doing?.length > 0 ? status.doing.join('、') : "ゆっくりしています"}</div></div>
                    </div>
                    <div className="info-card" style={{ borderLeft: '6px solid #ff9eb5', background: '#fff', padding: '22px', borderRadius: '25px', display: 'flex', gap: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: '28px' }}>☺️</span>
                      <div style={{ flex: 1 }}>
                        <small style={{ color: '#ff9eb5', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>やってくれたら嬉しい（できたらチェック）</small>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {status.requests?.map(task => {
                            const isDone = status.completedTasks?.includes(task);
                            return (
                              <div key={task} onClick={() => toggleTask(task)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: isDone ? '#f9f9f9' : 'transparent', padding: '8px', borderRadius: '12px' }}>
                                {isDone ? <CheckCircle2 size={24} color="#82c49a" /> : <Circle size={24} color="#ccc" />}
                                <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#ccc' : '#5a7d9a', fontSize: '15px' }}>{task}</span>
                              </div>
                            );
                          })}
                          {(!status.requests || status.requests.length === 0) && <div style={{ color: '#ccc', fontSize: '14px' }}>特になし</div>}
                        </div>
                      </div>
                    </div>
                    <div className="info-card" style={{ borderLeft: '6px solid #f87171', background: '#fff', padding: '22px', borderRadius: '25px', display: 'flex', gap: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: '28px' }}>🥺</span>
                      <div><small style={{ color: '#f87171', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>遠慮してほしいこと</small><div style={{ fontSize: '16px' }}>{status.notToDo?.length > 0 ? status.notToDo.join('、') : "特になし"}</div></div>
                    </div>
                  </div>
                </>
              ) : <div style={{ textAlign: 'center', padding: '100px 20px', color: '#9ebbd7' }}><Sparkles size={48} style={{ marginBottom: '20px', opacity: 0.5 }} /><p>お相手の入力を待っています🕊️</p></div>}
            </div>
          ) : (
            <div className="fade-in">
              <h2 className="section-title">1. 症状を選ぶ</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '35px' }}>
                {defaultSymptoms.map(s => (
                  <button key={s} onClick={() => {
                    const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s];
                    setSelectedSymptoms(next);
                    updateStatus(next, level);
                  }} className={`push-btn chip ${selectedSymptoms.includes(s) ? 'active' : ''}`} style={{ padding: '12px 20px', borderRadius: '20px', border: 'none', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#9ebbd7', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>{s}</button>
                ))}
              </div>

              {/* 2. しんどさは？（1枚目の画像の操作感を再現） */}
              <h2 className="section-title">2. しんどさは？</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '15px' }}>
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} className={`push-btn lv-btn ${level === n ? 'active' : ''}`} style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 8px rgba(0,0,0,0.03)' }}>{n}</button>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: '25px', padding: '30px 20px', textAlign: 'center', marginBottom: '35px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>{levelEmojis[level]}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{levelFeelings[level]}</div>
              </div>

              <h2 className="section-title">3. 内容をチェック</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                {[
                  { id: 'doing', label: '😷 やっていること', color: '#9ebbd7' },
                  { id: 'requests', label: '☺️ やってくれたら嬉しい', color: '#ff9eb5' },
                  { id: 'notToDo', label: '🥺 遠慮してほしいこと', color: '#f87171' }
                ].map(item => (
                  <div key={item.id} onClick={() => editPlanItem(item.id)} className="push-btn plan-card" style={{ borderLeft: `6px solid ${item.color}`, background: '#fff', padding: '18px 22px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div>
                      <small style={{ fontWeight: 'bold', color: item.color, fontSize: '11px' }}>{item.label}</small>
                      <div style={{ fontSize: '15px', marginTop: '4px' }}>{status?.[item.id] && status[item.id].length > 0 ? status[item.id].join('、') : "未入力"}</div>
                    </div>
                    <Edit3 size={18} color="#ccc" />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', textAlign: 'center', border: '2px dashed #9ebbd7' }}>
                  <small style={{ color: '#9ebbd7', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>招待コード</small>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>{pairCode}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => {
                    const text = `YORISOIでつながろう🕊️\n体調を言葉にしなくても伝えられるアプリ\n\nhttps://yorisoi.app/invite/${pairCode}`;
                    navigator.clipboard.writeText(text);
                    alert("リンクをコピーしました！");
                  }} className="push-btn" style={{ padding: '15px', borderRadius: '20px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Copy size={18} /> リンクコピー
                  </button>
                  <button onClick={() => {
                    const text = `YORISOIでつながろう🕊️\n体調を言葉にしなくても伝えられるアプリ\n\nhttps://yorisoi.app/invite/${pairCode}`;
                    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
                  }} className="push-btn" style={{ padding: '15px', borderRadius: '20px', background: '#4cc764', color: '#fff', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Share size={18} /> LINEで送る
                  </button>
                </div>
                <button onClick={async () => {
                  const shareData = { title: 'YORISOI', text: `YORISOIでつながろう🕊️\n体調を言葉にしなくても伝えられるアプリ`, url: `https://yorisoi.app/invite/${pairCode}` };
                  if (navigator.share) { try { await navigator.share(shareData); } catch (err) { console.log(err); } }
                  else { alert("ブラウザが共有に対応していません。コピーをご利用ください。"); }
                }} className="push-btn" style={{ width: '100%', padding: '18px', borderRadius: '25px', background: '#9ebbd7', color: '#fff', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Share size={20} /> 共有する
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {sentMsg && (
        <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(90,125,154,0.9)', color: '#fff', padding: '12px 25px', borderRadius: '25px', fontSize: '14px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>{sentMsg}</div>
      )}

      <style jsx>{`
        .push-btn { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; border: none; outline: none; }
        .push-btn:active { transform: scale(0.92); }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 18px; color: #5a7d9a; display: flex; align-items: center; gap: 8px; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
