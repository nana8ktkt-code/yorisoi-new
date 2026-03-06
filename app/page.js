"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Edit3, Plus, Sparkles, Trash2, Check, Lightbulb } from 'lucide-react';

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
    // 全履歴の中に同じメッセージがあれば追加しない（重複防止の強化）
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
      await addAction(`✨ 「${task}」をやってくれたよ！`);
    }
    await setDoc(doc(db, "pairs", pairCode), { 
      completedTasks: isNowCompleted ? [...current, task] : current.filter(t => t !== task)
    }, { merge: true });
  };

  const sendQuickReply = async (msg) => {
    // 送信済みかチェック（連打防止）
    if (status?.actions?.some(a => a.text.includes(msg))) return;
    
    setSentMsg("送信したよ🕊️");
    setTimeout(() => setSentMsg(null), 1500);
    await addAction(`💬 パートナー：${msg}`);
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
  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '80px 20px', background: '#f0f7ff' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '36px', letterSpacing: '2px' }}>🕊️ YORISOI</h1>
        <p style={{ fontSize: '14px', marginBottom: '40px' }}>ふたりだけの、寄り添う空間</p>
        <input type="text" placeholder="合言葉を入力" onChange={(e) => setPairCode(e.target.value)} style={{ width: '90%', padding: '20px', borderRadius: '25px', border: 'none', fontSize: '18px', textAlign: 'center', marginBottom: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '22px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(158,187,215,0.4)' }}>おつたえ 🕊️</button>
          <button onClick={() => setRole('him')} style={{ padding: '22px', borderRadius: '30px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold', fontSize: '18px' }}>みまもり 🤝</button>
        </div>
      </div>
    );
  }

  if (role === 'him') {
    return (
      <div style={pageStyle}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}><h2 style={{ fontSize: '18px', opacity: 0.8 }}>🤝 みまもり中</h2></header>
        {status && (status.symptoms?.length > 0 || status.level !== undefined) ? (
          <div>
            <div style={{ background: '#fff', borderRadius: '35px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.04)', marginBottom: '25px' }}>
              <div style={{ fontSize: '17px', color: '#9ebbd7', fontWeight: 'bold' }}>{status.symptoms?.join('＆') || "経過観察"}</div>
              <div style={{ fontSize: '60px', fontWeight: 'bold', margin: '10px 0' }}>Lv.{status.level}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: status.level === 0 ? '#82c49a' : '#ff9eb5' }}>{status.emoji} {status.feeling}</div>
              {status.mood && <div style={{ marginTop: '10px', display: 'inline-block', padding: '4px 15px', background: '#f0f7ff', borderRadius: '20px', fontSize: '13px', color: '#7ba2c7' }}>☁️ {status.mood}</div>}
              {status.thanks && <div style={{ marginTop: '20px', padding: '12px', background: '#fff0f5', borderRadius: '20px', color: '#ff7a99', fontSize: '14px', animation: 'popIn 0.5s' }}>💖 {status.thanks}</div>}
            </div>

            <div style={{ background: '#fffbe6', padding: '15px 20px', borderRadius: '20px', marginBottom: '25px', display: 'flex', gap: '12px', border: '1px solid #ffe58f', boxShadow: '0 4px 10px rgba(250,173,20,0.05)' }}>
              <Lightbulb size={24} color="#faad14" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.6' }}><strong>接し方のヒント</strong><br />{getHint(status.level)}</div>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '30px' }}>
              {sentMsg && <div className="sent-toast">{sentMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { m: "任せて！", t: "#42a5f5" },
                  { m: "あとでやるね", t: "#fbc02d" },
                  { m: "向かってるよ", t: "#66bb6a" }
                ].map(item => {
                  const isSent = status?.actions?.some(a => a.text.includes(item.m));
                  return (
                    <button key={item.m} onClick={() => sendQuickReply(item.m)} className={`push-btn quick-reply-btn ${isSent ? 'is-sent' : ''}`} style={{ background: '#fff', color: isSent ? '#ccc' : item.t, border: `1px dashed ${isSent ? '#ccc' : item.t}`, padding: '15px 5px', borderRadius: '15px' }}>
                      {isSent ? <Check size={14} style={{ marginRight: '4px' }} /> : null}{item.m}
                    </button>
                  );
                })}
              </div>
              {/* 「見守ってるよ」も他のボタンと同じ「送信済みチェック」の仕様に修正 */}
              {(() => {
                const isSent = status?.actions?.some(a => a.text.includes("見守ってるよ 🧸"));
                return (
                  <button onClick={() => sendQuickReply("見守ってるよ 🧸")} className={`push-btn ${isSent ? 'is-sent' : ''}`} style={{ width: '100%', marginTop: '12px', padding: '15px', borderRadius: '15px', background: '#fff', border: `1px dashed ${isSent ? '#ccc' : '#9ebbd7'}`, color: isSent ? '#ccc' : '#9ebbd7', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isSent && <Check size={16} />}見守ってるよ 🧸
                  </button>
                );
              })()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="info-card" style={{ borderLeft: '6px solid #9ebbd7' }}><span className="card-icon">👟</span><div><small className="card-label" style={{ color: '#9ebbd7' }}>今の状態</small><div className="card-text">{status.doing?.join('、') || "ゆっくりしています"}</div></div></div>
              <div className="info-card" style={{ borderLeft: '6px solid #ff9eb5' }}><span className="card-icon">📋</span><div><small className="card-label" style={{ color: '#ff9eb5' }}>お願い（できたらチェック）</small><div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {status.requests?.map(task => {
                  const isDone = status.completedTasks?.includes(task);
                  return (
                    <div key={task} onClick={() => toggleTask(task)} className={`task-row ${isDone ? 'done' : ''}`} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}>
                      {isDone ? <CheckCircle2 size={24} color="#82c49a" style={{ marginRight: '10px' }} /> : <Circle size={24} color="#ccc" style={{ marginRight: '10px' }} />}
                      <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#ccc' : 'inherit' }}>{task}</span>
                    </div>
                  );
                }) || "特になし"}
              </div></div></div>
              <div className="info-card" style={{ borderLeft: '6px solid #f87171' }}><span className="card-icon">⚠️</span><div><small className="card-label" style={{ color: '#f87171' }}>遠慮してほしいこと</small><div className="card-text">{status.notToDo?.map(task => (<div key={task} style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}><Circle size={18} color="#f87171" style={{ marginRight: '8px' }} /><span>{task}</span></div>)) || "特になし"}</div></div></div>
            </div>
          </div>
        ) : <div style={{ textAlign: 'center', marginTop: '120px', opacity: 0.6 }}>🍃 今は落ち着いているようです</div>}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {isSetting ? (
        <div style={{ background: '#fff', minHeight: '100vh', padding: '30px 20px', borderRadius: '30px' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '12px 24px', borderRadius: '15px', marginBottom: '25px', background: '#f0f7ff', color: '#9ebbd7', fontWeight: 'bold' }}>◀ 戻る</button>
          <div style={{ background: '#fcfdff', padding: '25px', borderRadius: '30px', border: '1px solid #eef' }}>
            <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #eee', fontSize: '16px' }}>
              {defaultSymptoms.concat(Object.keys(data)).filter((v,i,a)=>a.indexOf(v)===i).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
              {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: settingLevel === n ? '#9ebbd7' : '#eee', color: '#fff' }}>{n}</button>)}
            </div>
            {Object.entries({ doing: '👟 状態', requests: '📋 お願い', notToDo: '⚠️ 遠慮してほしいこと' }).map(([key, label]) => (
              <div key={key} style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '15px', margin: 0 }}>{label}</h4>
                  <button onClick={() => addCustomOption(key)} style={{ background: 'none', border: 'none', color: '#9ebbd7', display: 'flex', alignItems: 'center', fontSize: '13px' }}><Plus size={16} /> 追加</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', opacity: 0.7 }}>🕊️ {pairCode}</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Trash2 onClick={resetStatus} size={24} color="#f87171" style={{ cursor: 'pointer' }} />
              <Settings onClick={() => setIsSetting(true)} size={26} color="#9ebbd7" style={{ cursor: 'pointer' }} />
            </div>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
            {status?.actions?.map((action) => (
              <div key={action.id} className="action-notification">
                <Sparkles size={18} />
                <span>{action.text}</span>
                <Sparkles size={18} />
              </div>
            ))}
          </div>

          <h2 className="section-title">1. 症状を選ぶ</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
            {defaultSymptoms.map(s => (
              <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} className={`push-btn chip ${selectedSymptoms.includes(s) ? 'active' : ''}`}>{s}</button>
            ))}
          </div>

          <h2 className="section-title">2. しんどさは？</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} className={`push-btn lv-btn ${level === n ? 'active' : ''}`}>{n}</button>)}
          </div>
          <div style={{ textAlign: 'center', color: level === 0 ? '#82c49a' : '#ff9eb5', fontWeight: 'bold', fontSize: '24px', marginBottom: '20px' }}>{levelEmojis[level]} {levelFeelings[level]}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '35px', justifyContent: 'center' }}>
            {moodOptions.map(m => (
              <button key={m} onClick={() => updateStatus(selectedSymptoms, level, null, m)} className={`push-btn mood-btn ${status?.mood === m ? 'active' : ''}`}>{m}</button>
            ))}
          </div>

          <h2 className="section-title">3. 内容をチェック</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
            {[{ id: 'doing', label: '👟 状態', color: '#9ebbd7' }, { id: 'requests', label: '📋 お願い', color: '#ff9eb5' }, { id: 'notToDo', label: '⚠️ 遠慮', color: '#f87171' }].map(item => (
              <div key={item.id} onClick={() => editPlanItem(item.id)} className="push-btn plan-card" style={{ borderLeft: `6px solid ${item.color}` }}>
                <div><small style={{ fontWeight: 'bold', color: item.color, fontSize: '11px' }}>{item.label}</small><div style={{ fontSize: '15px', marginTop: '4px' }}>{status?.[item.id]?.join('、') || "未入力"}</div></div>
                <Edit3 size={18} color="#ccc" />
              </div>
            ))}
          </div>

          {status?.completedTasks?.length > 0 && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', marginBottom: '15px', color: '#82c49a', fontWeight: 'bold' }}>✨ パートナーが動いてくれました！</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {["ありがとう", "だいすき♡", "助かった"].map(m => (<button key={m} onClick={() => sendThanks(m)} className="push-btn thanks-btn">{m}</button>))}
              </div>
            </div>
          )}
          <button onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【YORISOI🕊️】\n更新：${selectedSymptoms.join('＆')} Lv.${level}\n${levelEmojis[level]}${levelFeelings[level]}\n${status?.mood ? `気分：${status.mood}\n` : ''}アプリで詳細を確認してね！`)}`)} className="push-btn line-btn">LINEで通知する</button>
        </>
      )}
      <style jsx>{`
        .push-btn { transition: all 0.1s; border: none; cursor: pointer; outline: none; }
        .push-btn:active { transform: scale(0.96); opacity: 0.8; }
        .lv-btn { width: 48px; height: 48px; border-radius: 50% !important; background: #fff; color: #9ebbd7; font-weight: bold; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .lv-btn.active { background: #9ebbd7; color: #fff; transform: scale(1.1); }
        .chip { padding: 12px 18px; border-radius: 20px; background: #fff; color: #777; font-weight: bold; font-size: 14px; box-shadow: 0 4px 8px rgba(0,0,0,0.04); }
        .chip.active { background: #9ebbd7; color: #fff; }
        .mood-btn { padding: 6px 14px; border-radius: 15px; background: rgba(255,255,255,0.6); color: #888; font-size: 12px; border: 1px solid transparent; }
        .mood-btn.active { background: #fff; color: #9ebbd7; border-color: #9ebbd7; font-weight: bold; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; opacity: 0.9; }
        .info-card { background: #fff; padding: 20px; border-radius: 25px; display: flex; gap: 15px; box-shadow: 0 6px 15px rgba(0,0,0,0.03); }
        .card-icon { font-size: 24px; }
        .card-label { font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .card-text { margin-top: 5px; font-size: 15px; line-height: 1.5; }
        .plan-card { background: #fff; padding: 18px 22px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .line-btn { width: 100%; padding: 22px; border-radius: 35px; background: #4cc764; color: #fff; font-weight: bold; font-size: 17px; box-shadow: 0 6px 15px rgba(76,199,100,0.3); }
        .thanks-btn { padding: 12px; border-radius: 15px; background: #f0f7ff; border: 1px solid #9ebbd7; color: #9ebbd7; font-size: 13px; font-weight: bold; }
        .is-sent { opacity: 0.5; filter: grayscale(0.8); pointer-events: none; }
        .action-notification { background: #fff; padding: 12px 18px; border-radius: 20px; border: 2px solid #ffeb3b; color: #d4af37; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 12px rgba(255,235,59,0.15); }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
