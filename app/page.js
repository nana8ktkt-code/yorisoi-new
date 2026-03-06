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
    if (!confirm("リセットして「落ち着いたよ」に戻しますか？")) return;
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
    const label = type === 'doing' ? 'やっていること' : type === 'requests' ? 'やってくれたら嬉しいこと' : '遠慮してほしいこと';
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
        <div style={{ textAlign: 'left', background: '#fff', padding: '30px', borderRadius: '30px', width: '100%', marginBottom: '50px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>①</span><span style={{ fontSize: '14px' }}>体調を入力</span></div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>②</span><span style={{ fontSize: '14px' }}>お願いが自動生成</span></div>
          <div style={{ display: 'flex', gap: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>③</span><span style={{ fontSize: '14px' }}><strong>お相手に</strong>共有</span></div>
        </div>
        <button onClick={() => setShowIntro(false)} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '35px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>はじめる</button>
      </div>
    );
  }

  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '80px 20px', background: '#f0f7ff' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '36px' }}>🕊️ YORISOI</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '60px' }}>
          <button onClick={startAsReporter} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold' }}>おつたえ 🕊️</button>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '14px', marginBottom: '15px' }}>招待コードを入力して参加</p>
            <input type="text" placeholder="AX92KD" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '18px', borderRadius: '25px', border: 'none', fontSize: '24px', textAlign: 'center', marginBottom: '15px' }} />
            <button onClick={startAsSupporter} disabled={inputCode.length < 4} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7' }}>みまもり 🤝</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {isSetting ? (
        <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '30px' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '12px 24px', borderRadius: '15px', marginBottom: '25px', background: '#f0f7ff', color: '#9ebbd7' }}>◀ 戻る</button>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '18px', borderRadius: '15px', marginBottom: '20px' }}>
            {defaultSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: settingLevel === n ? '#9ebbd7' : '#eee', color: '#fff' }}>{n}</button>)}
          </div>
          {Object.entries({ doing: '😷 やっていること', requests: '☺️ やってくれたら嬉しい', notToDo: '🥺 遠慮してほしいこと' }).map(([key, label]) => (
            <div key={key} style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>{label}</span><button onClick={() => addCustomOption(key)} style={{ color: '#9ebbd7' }}>+ 追加</button></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {(key === 'requests' ? defaultOptions.requests.flatMap(g => g.items) : defaultOptions[key]).concat(data[activeSettingSymptom]?.[settingLevel]?.[key] || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
                    <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, key, item)} className={`push-btn chip ${data[activeSettingSymptom]?.[settingLevel]?.[key]?.includes(item) ? 'active' : ''}`}>{item}</button>
                  ))}
                </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '15px' }}>🕊️ {pairCode}</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Trash2 onClick={resetStatus} size={24} color="#f87171" />
              <Settings onClick={() => setIsSetting(true)} size={26} color="#9ebbd7" />
            </div>
          </header>

          {role === 'him' ? (
            <div>
              {status && (status.symptoms?.length > 0 || status.level !== undefined) ? (
                <>
                  <div style={{ background: '#fff', borderRadius: '35px', padding: '30px', textAlign: 'center', marginBottom: '25px' }}>
                    <div style={{ fontSize: '17px', color: '#9ebbd7' }}>{status.symptoms?.join('＆')}</div>
                    <div style={{ fontSize: '60px', fontWeight: 'bold' }}>Lv.{status.level}</div>
                    <div style={{ fontSize: '22px' }}>{status.emoji} {status.feeling}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="info-card" style={{ borderLeft: '6px solid #9ebbd7', background: '#fff', padding: '20px', borderRadius: '25px', display: 'flex', gap: '15px' }}>
                      <span style={{ fontSize: '24px' }}>😷</span>
                      <div><small style={{ color: '#9ebbd7', fontWeight: 'bold' }}>やっていること</small><div>{status.doing?.join('、') || "ゆっくりしています"}</div></div>
                    </div>
                    <div className="info-card" style={{ borderLeft: '6px solid #ff9eb5', background: '#fff', padding: '20px', borderRadius: '25px', display: 'flex', gap: '15px' }}>
                      <span style={{ fontSize: '24px' }}>☺️</span>
                      <div>
                        <small style={{ color: '#ff9eb5', fontWeight: 'bold' }}>やってくれたら嬉しい</small>
                        <div style={{ marginTop: '10px' }}>
                          {status.requests?.map(t => (
                            <div key={t} onClick={() => toggleTask(t)} style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                              {status.completedTasks?.includes(t) ? <CheckCircle2 size={24} color="#82c49a" /> : <Circle size={24} color="#ccc" />}
                              <span style={{ marginLeft: '10px', textDecoration: status.completedTasks?.includes(t) ? 'line-through' : 'none' }}>{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="info-card" style={{ borderLeft: '6px solid #f87171', background: '#fff', padding: '20px', borderRadius: '25px', display: 'flex', gap: '15px' }}>
                      <span style={{ fontSize: '24px' }}>🥺</span>
                      <div><small style={{ color: '#f87171', fontWeight: 'bold' }}>遠慮してほしいこと</small><div>{status.notToDo?.join('、') || "特になし"}</div></div>
                    </div>
                  </div>
                </>
              ) : <p style={{textAlign:'center', marginTop:'100px'}}>🍃 お相手の入力を待っています</p>}
            </div>
          ) : (
            <>
              <h2 className="section-title">1. 症状を選ぶ</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
                {defaultSymptoms.map(s => (
                  <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} className={`push-btn chip ${selectedSymptoms.includes(s) ? 'active' : ''}`}>{s}</button>
                ))}
              </div>
              <h2 className="section-title">2. しんどさは？</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} className={`push-btn lv-btn ${level === n ? 'active' : ''}`}>{n}</button>)}
              </div>
              <h2 className="section-title">3. 内容をチェック</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                {[
                  { id: 'doing', label: '😷 やっていること', color: '#9ebbd7' },
                  { id: 'requests', label: '☺️ やってくれたら嬉しい', color: '#ff9eb5' },
                  { id: 'notToDo', label: '🥺 遠慮してほしいこと', color: '#f87171' }
                ].map(item => (
                  <div key={item.id} onClick={() => editPlanItem(item.id)} className="push-btn plan-card" style={{ borderLeft: `6px solid ${item.color}`, background: '#fff', padding: '18px 22px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                    <div>
                      <small style={{ fontWeight: 'bold', color: item.color, fontSize: '11px' }}>{item.label}</small>
                      <div style={{ fontSize: '15px', marginTop: '4px' }}>{status?.[item.id]?.join('、') || "未入力"}</div>
                    </div>
                    <Edit3 size={18} color="#ccc" />
                  </div>
                ))}
              </div>
                            {/* 共有セクション：ここから入れ替え */}
              <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', textAlign: 'center', border: '2px dashed #9ebbd7' }}>
                  <small style={{ color: '#9ebbd7', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>招待コード</small>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>{pairCode}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      const text = `YORISOIでつながろう🕊️\n体調を言葉にしなくても伝えられるアプリ\n\nhttps://yorisoi.app/invite/${pairCode}`;
                      navigator.clipboard.writeText(text);
                      alert("リンクをコピーしました！");
                    }} 
                    className="push-btn" 
                    style={{ padding: '15px', borderRadius: '20px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <Copy size={18} /> リンクコピー
                  </button>
                  <button 
                    onClick={() => {
                      const text = `YORISOIでつながろう🕊️\n体調を言葉にしなくても伝えられるアプリ\n\nhttps://yorisoi.app/invite/${pairCode}`;
                      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
                    }} 
                    className="push-btn" 
                    style={{ padding: '15px', borderRadius: '20px', background: '#4cc764', color: '#fff', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <Share size={18} /> LINEで送る
                  </button>
                </div>
                
                <button 
                  onClick={async () => {
                    const shareData = {
                      title: 'YORISOI',
                      text: `YORISOIでつながろう🕊️\n体調を言葉にしなくても伝えられるアプリ`,
                      url: `https://yorisoi.app/invite/${pairCode}`
                    };
                    if (navigator.share) {
                      try { await navigator.share(shareData); } catch (err) { console.log(err); }
                    } else {
                      alert("お使いのブラウザは共有機能に対応していません。リンクコピーをご利用ください。");
                    }
                  }} 
                  className="push-btn" 
                  style={{ width: '100%', padding: '18px', borderRadius: '25px', background: '#9ebbd7', color: '#fff', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Share size={20} /> 共有する
                </button>
              </div>
            </>
            /* ここまで入れ替え */

          )}
        </>
      )}
      <style jsx>{`
        .push-btn { transition: 0.1s; border: none; cursor: pointer; outline: none; }
        .push-btn:active { transform: scale(0.96); }
        .chip { padding: 12px 18px; border-radius: 20px; background: #fff; font-size: 14px; font-weight: bold; }
        .chip.active { background: #9ebbd7; color: #fff; }
        .lv-btn { width: 48px; height: 48px; border-radius: 50%; background: #fff; color: #9ebbd7; font-weight: bold; }
        .lv-btn.active { background: #9ebbd7; color: #fff; }
        .line-btn { width: 100%; padding: 22px; border-radius: 35px; background: #4cc764; color: #fff; font-weight: bold; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
      `}</style>
    </div>
  );
}
