"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Edit3, Plus, Sparkles, Trash2, Check } from 'lucide-react';

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
  const [sentMsg, setSentMsg] = useState(null);

  const defaultSymptoms = ["つわり", "生理痛", "PMS", "頭痛", "腹痛", "だるい", "のどが痛い", "熱がある"];
  const defaultOptions = {
    doing: ["横になって休んでる", "薬飲んでる", "食欲がない", "少し落ち着いてきた", "声がでません", "お風呂入れない"],
    requests: [
      { cat: "🧼 家事", items: ["洗い物をお願い", "洗濯物をお願い", "ゴミ出しをお願い"] },
      { cat: "🍱 食事", items: ["お寿司たべたいな", "おかゆ食べたい", "Ｃ１０００出してきてほしいな"] },
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

  const updateStatus = async (newSymptoms, newLevel, customPlan = null) => {
    if (!pairCode) return;
    const plan = customPlan || getPlan(newSymptoms, newLevel);
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: newSymptoms,
      level: newLevel,
      feeling: levelFeelings[newLevel],
      emoji: levelEmojis[newLevel],
      updatedAt: new Date().getTime(),
      doing: plan.doing,
      requests: plan.requests,
      notToDo: plan.notToDo,
      completedTasks: status?.completedTasks || [],
      lastAction: "",
      lastActionId: "" 
    }, { merge: true });
  };

  const resetStatus = async () => {
    if (!confirm("体調データをリセットして「落ち着いたよ」に戻しますか？")) return;
    setSelectedSymptoms([]);
    setLevel(0);
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: [], level: 0, feeling: levelFeelings[0], emoji: levelEmojis[0],
      updatedAt: new Date().getTime(), doing: [], requests: [], notToDo: [],
      completedTasks: [], thanks: "", lastAction: "", lastActionId: ""
    });
  };

  const toggleTask = async (task) => {
    const current = status?.completedTasks || [];
    const isNowCompleted = !current.includes(task);
    const next = isNowCompleted ? [...current, task] : current.filter(t => t !== task);
    if (isNowCompleted) {
      setSentMsg(`「${task}」完了！`);
      setTimeout(() => setSentMsg(null), 1500);
    }
    await setDoc(doc(db, "pairs", pairCode), { 
      completedTasks: next,
      lastAction: isNowCompleted ? `✨ 「${task}」をやってくれたよ！` : "",
      lastActionId: isNowCompleted ? Date.now().toString() : ""
    }, { merge: true });
  };

  const sendQuickReply = async (msg) => {
    setSentMsg("送信したよ🕊️");
    setTimeout(() => setSentMsg(null), 1500);
    await setDoc(doc(db, "pairs", pairCode), { 
      lastAction: `💬 パートナー：${msg}`,
      lastActionId: Date.now().toString(),
      updatedAt: new Date().getTime() 
    }, { merge: true });
  };

  const sendThanks = async (msg) => {
    await setDoc(doc(db, "pairs", pairCode), { thanks: msg, lastAction: "", lastActionId: "", updatedAt: new Date().getTime() }, { merge: true });
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

  const pageStyle = { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, background: '#f0f7ff', minHeight: '100vh', color: '#5a7d9a' };
  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '32px' }}>🕊️ YORISOI</h1>
        <p style={{ fontSize: '14px', marginBottom: '30px' }}>合言葉を入力してスタート</p>
        <input type="text" placeholder="合言葉を入力" onChange={(e) => setPairCode(e.target.value)} style={{ width: '85%', padding: '18px', borderRadius: '20px', border: 'none', fontSize: '18px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '20px', borderRadius: '25px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>おつたえ 🕊️</button>
          <button onClick={() => setRole('him')} style={{ padding: '20px', borderRadius: '25px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold', fontSize: '16px' }}>みまもり 🤝</button>
        </div>
      </div>
    );
  }

  if (role === 'him') {
    return (
      <div style={pageStyle}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}><h2>🤝 みまもり画面</h2></header>
        {status && (status.symptoms?.length > 0 || status.level !== undefined) ? (
          <div>
            <div style={{ background: '#fff', borderRadius: '30px', padding: '25px', textAlign: 'center', boxShadow: '0 8px 20px rgba(158,187,215,0.2)', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', color: '#9ebbd7', fontWeight: 'bold' }}>{status.symptoms?.join('＆') || "経過観察"}</div>
              <div style={{ fontSize: '50px', fontWeight: 'bold', margin: '5px 0' }}>Lv.{status.level}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: status.level === 0 ? '#82c49a' : '#ff9eb5' }}>{status.emoji} {status.feeling}</div>
              {status.thanks && <div style={{ marginTop: '15px', padding: '10px', background: '#fff0f5', borderRadius: '15px', color: '#ff7a99', fontSize: '14px' }}>💖 {status.thanks}</div>}
            </div>
            
            <div style={{ position: 'relative', marginBottom: '25px' }}>
              {sentMsg && <div className="sent-toast">{sentMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                  { m: "任せて！", c: "#e3f2fd", t: "#42a5f5" },
                  { m: "あとでやるね", c: "#fff9c4", t: "#fbc02d" },
                  { m: "向かってるよ", c: "#e8f5e9", t: "#66bb6a" }
                ].map(item => {
                  const isSent = status?.lastAction?.includes(item.m);
                  return (
                    <button 
                      key={item.m} 
                      onClick={() => sendQuickReply(item.m)} 
                      className={`push-btn quick-reply-btn ${isSent ? 'is-sent' : ''}`}
                      style={{ background: isSent ? '#eee' : item.c, color: isSent ? '#888' : item.t, border: `1px solid ${isSent ? '#ccc' : item.c}` }}
                    >
                      {isSent ? <Check size={14} style={{ marginRight: '4px' }} /> : null}
                      {item.m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: '#fff', padding: '18px', borderRadius: '20px', borderLeft: '6px solid #9ebbd7' }}>
                <small style={{ fontWeight: 'bold', color: '#9ebbd7' }}>👟 今の状態</small>
                <div style={{ marginTop: '5px' }}>{status.doing?.join('、') || "ゆっくりしています"}</div>
              </div>
              <div style={{ background: '#fff', padding: '18px', borderRadius: '20px', borderLeft: '6px solid #ff9eb5' }}>
                <small style={{ fontWeight: 'bold', color: '#ff9eb5' }}>📋 お願い（できたらチェック）</small>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {status.requests?.map(task => {
                    const isDone = status.completedTasks?.includes(task);
                    return (
                      <div key={task} onClick={() => toggleTask(task)} className={`task-row ${isDone ? 'done' : ''}`} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '5px 0', transition: '0.2s' }}>
                        {isDone ? <CheckCircle2 size={22} color="#82c49a" style={{ marginRight: '10px' }} /> : <Circle size={22} color="#ccc" style={{ marginRight: '10px' }} />}
                        <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#ccc' : 'inherit' }}>{task}</span>
                      </div>
                    );
                  }) || "特になし"}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '18px', borderRadius: '20px', borderLeft: '6px solid #f87171' }}>
                <small style={{ fontWeight: 'bold', color: '#f87171' }}>⚠️ 遠慮してほしいこと</small>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {status.notToDo?.map(task => (
                    <div key={task} style={{ display: 'flex', alignItems: 'center' }}><Circle size={20} color="#f87171" style={{ marginRight: '8px' }} /><span>{task}</span></div>
                  )) || "特になし"}
                </div>
              </div>
            </div>
          </div>
        ) : <div style={{ textAlign: 'center', marginTop: '100px' }}>🍃 今は落ち着いているようです</div>}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {isSetting ? (
        <div style={{ background: '#fff', minHeight: '100vh', padding: '20px' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ border: 'none', padding: '12px 24px', borderRadius: '15px', marginBottom: '20px', background: '#f0f7ff', color: '#9ebbd7', fontWeight: 'bold' }}>◀ 戻る</button>
          <div style={{ background: '#fcfdff', padding: '20px', borderRadius: '25px', border: '1px solid #eef' }}>
            <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #eee' }}>
              {defaultSymptoms.concat(Object.keys(data)).filter((v,i,a)=>a.indexOf(v)===i).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '35px', height: '35px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : '#eee', color: '#fff' }}>{n}</button>)}
            </div>
            {Object.entries({ doing: '👟 状態', requests: '📋 お願い', notToDo: '⚠️ 遠慮してほしいこと' }).map(([key, label]) => (
              <div key={key} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', margin: 0 }}>{label}</h4>
                  <button onClick={() => addCustomOption(key)} style={{ background: 'none', border: 'none', color: '#9ebbd7', display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
                    <Plus size={14} style={{ marginRight: '2px' }} /> 追加
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(key === 'requests' ? defaultOptions.requests.flatMap(g => g.items) : defaultOptions[key]).concat(data[activeSettingSymptom]?.[settingLevel]?.[key] || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
                    <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, key, item)} className={`push-btn chip ${data[activeSettingSymptom]?.[settingLevel]?.[key]?.includes(item) ? 'active' : ''}`}>{item}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>🕊️ {pairCode}</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Trash2 onClick={resetStatus} size={24} color="#f87171" style={{ cursor: 'pointer' }} />
              <Settings onClick={() => setIsSetting(true)} size={26} color="#9ebbd7" style={{ cursor: 'pointer' }} />
            </div>
          </header>

          {status?.lastAction && (
            <div key={status.lastActionId} className="action-notification">
              <Sparkles size={20} />
              <span>{status.lastAction}</span>
              <Sparkles size={20} />
            </div>
          )}

          {status?.completedTasks?.length > 0 && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: '13px', textAlign: 'center', marginBottom: '10px', color: '#82c49a' }}>✨ パートナーが動いてくれました！</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {["ありがとう", "だいすき♡", "助かった"].map(m => (
                  <button key={m} onClick={() => sendThanks(m)} className="push-btn thanks-btn">{m}</button>
                ))}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>1. 症状を選ぶ</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
            {defaultSymptoms.map(s => (
              <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} className={`push-btn chip ${selectedSymptoms.includes(s) ? 'active' : ''}`}>{s}</button>
            ))}
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>2. しんどさは？</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} className={`push-btn lv-btn ${level === n ? 'active' : ''}`}>{n}</button>)}
          </div>
          <div style={{ textAlign: 'center', color: level === 0 ? '#82c49a' : '#ff9eb5', fontWeight: 'bold', fontSize: '20px', marginBottom: '25px' }}>{levelEmojis[level]} {levelFeelings[level]}</div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>3. 内容をチェック・変更</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
            {[{ id: 'doing', label: '👟 今の状態', color: '#9ebbd7' }, { id: 'requests', label: '📋 お願い', color: '#ff9eb5' }, { id: 'notToDo', label: '⚠️ 遠慮してほしいこと', color: '#f87171' }].map(item => (
              <div key={item.id} onClick={() => editPlanItem(item.id)} className="push-btn plan-card" style={{ borderLeft: `6px solid ${item.color}` }}>
                <div><small style={{ fontWeight: 'bold', color: item.color }}>{item.label}</small><div style={{ fontSize: '14px', marginTop: '3px' }}>{status?.[item.id]?.join('、') || "未入力"}</div></div>
                <Edit3 size={16} color="#ccc" />
              </div>
            ))}
          </div>
          <button onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【YORISOI🕊️】\n体調更新しました：${selectedSymptoms.join('＆')} Lv.${level}\n${levelEmojis[level]}${levelFeelings[level]}\nアプリで詳細を確認してね！`)}`)} className="push-btn line-btn">LINEで通知する（重要）</button>
        </>
      )}
      <style jsx>{`
        .push-btn { transition: all 0.1s active; border: none; cursor: pointer; }
        .push-btn:active { transform: scale(0.95); opacity: 0.8; }
        .lv-btn { width: 45px; height: 45px; border-radius: 50% !important; background: #fff; color: #9ebbd7; font-weight: bold; }
        .lv-btn.active { background: #9ebbd7; color: #fff; }
        .quick-reply-btn { padding: 12px 5px; border-radius: 15px !important; font-size: 12px; font-weight: bold; }
        .chip { padding: 12px 16px; border-radius: 15px; background: #fff; color: #777; font-weight: bold; }
        .chip.active { background: #9ebbd7; color: #fff; }
        .plan-card { background: #fff; padding: 15px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; text-align: left; }
        .line-btn { width: 100%; padding: 20px; border-radius: 30px; background: #4cc764; color: #fff; font-weight: bold; font-size: 16px; }
        .thanks-btn { padding: 10px; border-radius: 12px; background: #f0f7ff; border: 1px solid #9ebbd7; color: #9ebbd7; font-size: 12px; font-weight: bold; }
        .is-sent { background: #e0e0e0 !important; color: #888 !important; border: 1px solid #ccc !important; opacity: 0.6; }
        .sent-toast { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #5a7d9a; color: #fff; padding: 4px 12px; border-radius: 10px; font-size: 12px; animation: floatUp 1.5s ease-out forwards; z-index: 10; }
        @keyframes floatUp { 0% { opacity: 0; transform: translate(-50%, 0); } 20% { opacity: 1; transform: translate(-50%, -10px); } 80% { opacity: 1; transform: translate(-50%, -10px); } 100% { opacity: 0; transform: translate(-50%, -20px); } }
        .action-notification { background: #fff; padding: 15px; border-radius: 20px; margin-bottom: 20px; border: 2px solid #ffeb3b; color: #d4af37; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
