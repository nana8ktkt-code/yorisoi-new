"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Edit3, Plus, Sparkles, Trash2, Check, Lightbulb, Heart, Copy, Share } from 'lucide-react';

// --- ホーム画面用の設定 (PWA) ---
if (typeof window !== "undefined") {
  const meta = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  };
  meta("apple-mobile-web-app-capable", "yes");
  meta("apple-mobile-web-app-status-bar-style", "default");
  meta("apple-mobile-web-app-title", "YORISOI");
  document.title = "YORISOI";
}

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
    doing: ["横になって休んでる", "薬飲んでる", "食欲がない", "少し落ち着いたきた", "声がでません"],
    requests: [
      { cat: "🧼 家事", items: ["洗い物をお願い", "洗濯物をお願い", "ゴミ出しをお願い"] },
      { cat: "🍱 食事", items: ["お寿司たべたいな", "おかゆ食べたい", "Ｃ1000出してきてほしいな"] },
      { cat: "🌡️ ケア", items: ["腰をさすって", "部屋あたたかくして", "部屋を暗くして"] }
    ],
    notToDo: ["話しかけないで", "大きな音NG", "匂いNG", "そっとしておいて"]
  };

  // 【新機能】URLからの自動招待・自動ログイン
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('code');
    const savedCode = localStorage.getItem('yorisoi_code');
    const savedRole = localStorage.getItem('yorisoi_role');

    // 招待リンクから来た場合（最優先）
    if (inviteCode) {
      const code = inviteCode.toUpperCase();
      setPairCode(code);
      setRole('him'); // 招待される側は自動的に「みまもり」
      localStorage.setItem('yorisoi_code', code);
      localStorage.setItem('yorisoi_role', 'him');
      setShowIntro(false);
      // URLをきれいにする（?code=... を消す）
      window.history.replaceState({}, document.title, "/");
    } 
    // 保存データがある場合
    else if (savedCode && savedRole) {
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

  const startAsReporter = () => {
    const code = generateCode();
    setPairCode(code);
    setRole('her');
    localStorage.setItem('yorisoi_code', code);
    localStorage.setItem('yorisoi_role', 'her');
  };

  const startAsSupporter = () => {
    if (inputCode.length >= 4) {
      const code = inputCode.toUpperCase();
      setPairCode(code);
      setRole('him');
      localStorage.setItem('yorisoi_code', code);
      localStorage.setItem('yorisoi_role', 'him');
    }
  };

  const getInviteUrl = () => {
    if (typeof window === "undefined") return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}?code=${pairCode}`;
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

  const logout = () => {
    if (confirm("ペアを解除してログアウトしますか？")) {
      localStorage.clear();
      window.location.reload();
    }
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
    const label = type === 'doing' ? '今の状態' : type === 'requests' ? 'お願い' : '遠慮してほしいこと';
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

  const pageStyle = { padding: '30px 20px', maxWidth: '500px', margin: '0 auto', fontFamily: softFontFace, background: (status?.level !== undefined ? ["#f0fcf4", "#f4fcf0", "#fffbe6", "#fff5f0", "#fff0f5", "#f5f0ff"][status.level] : "#f0f7ff"), minHeight: '100vh', color: '#5a7d9a', transition: 'background 0.5s ease' };

  if (showIntro) {
    return (
      <div style={{ ...pageStyle, background: '#f0f7ff', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <Heart size={64} color="#9ebbd7" style={{ marginBottom: '20px' }} />
        <h1 style={{ color: '#9ebbd7', fontSize: '32px', letterSpacing: '4px', marginBottom: '10px' }}>YORISOI</h1>
        <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '40px', color: '#7ba2c7' }}>体調を言葉にしなくても<br /><strong>大切な人に</strong>伝えられるアプリ</p>
        <button onClick={() => setShowIntro(false)} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '35px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>はじめる</button>
      </div>
    );
  }

  if (!role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '80px 20px', background: '#f0f7ff' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '36px' }}>🕊️ YORISOI</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '60px' }}>
          <button onClick={startAsReporter} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold' }}>おつたえ 🕊️</button>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>招待コードを入力</p>
            <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', fontSize: '20px', textAlign: 'center', marginBottom: '10px' }} />
            <button onClick={startAsSupporter} disabled={inputCode.length < 4} className="push-btn" style={{ width: '100%', padding: '20px', borderRadius: '30px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', opacity: inputCode.length < 4 ? 0.5 : 1 }}>みまもり 🤝</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {isSetting ? (
        <div style={{ background: '#fff', minHeight: '100vh', padding: '20px', borderRadius: '30px' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '10px 20px', borderRadius: '15px', background: '#f0f7ff', color: '#9ebbd7', marginBottom: '20px' }}>◀ 戻る</button>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
            {defaultSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: settingLevel === n ? '#9ebbd7' : '#eee' }}>{n}</button>)}
          </div>
          {Object.entries({ doing: '👟 状態', requests: '📋 お願い', notToDo: '⚠️ 遠慮' }).map(([key, label]) => (
            <div key={key} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>{label}</span><button onClick={() => addCustomOption(key)} style={{ color: '#9ebbd7' }}>+ 追加</button></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(key === 'requests' ? defaultOptions.requests.flatMap(g => g.items) : defaultOptions[key]).concat(data[activeSettingSymptom]?.[settingLevel]?.[key] || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
                  <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, key, item)} className={`push-btn chip ${data[activeSettingSymptom]?.[settingLevel]?.[key]?.includes(item) ? 'active' : ''}`}>{item}</button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={logout} style={{ width: '100%', color: '#f87171', marginTop: '40px' }}>ペア解除・ログアウト</button>
        </div>
      ) : (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px' }}>🕊️ {pairCode}</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <Trash2 onClick={resetStatus} size={22} color="#f87171" />
              <Settings onClick={() => setIsSetting(true)} size={22} color="#9ebbd7" />
            </div>
          </header>

          {role === 'him' ? (
            <div>
              {status ? (
                <>
                  <div style={{ background: '#fff', borderRadius: '30px', padding: '30px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#9ebbd7' }}>{status.symptoms?.join('＆')}</div>
                    <div style={{ fontSize: '50px', fontWeight: 'bold' }}>Lv.{status.level}</div>
                    <div style={{ fontSize: '20px' }}>{status.emoji} {status.feeling}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    {["任せて！", "あとでやるね", "向かってるよ"].map(m => (
                      <button key={m} onClick={() => sendQuickReply(m)} className="push-btn quick-reply">{m}</button>
                    ))}
                  </div>
                  <div className="info-card" style={{ borderLeft: '5px solid #ff9eb5', padding: '15px', background: '#fff', borderRadius: '15px' }}>
                    <strong>📋 お願い（チェックで完了）</strong>
                    {status.requests?.map(t => (
                      <div key={t} onClick={() => toggleTask(t)} style={{ display: 'flex', alignItems: 'center', marginTop: '10px', color: status.completedTasks?.includes(t) ? '#ccc' : '#555' }}>
                        {status.completedTasks?.includes(t) ? <CheckCircle2 size={20} color="#82c49a" /> : <Circle size={20} color="#ccc" />}
                        <span style={{ marginLeft: '10px' }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p style={{textAlign:'center', marginTop:'50px'}}>🍃 お相手の入力を待っています</p>}
            </div>
          ) : (
            <>
              <h2 className="section-title">1. 症状</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {defaultSymptoms.map(s => (
                  <button key={s} onClick={() => { const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s]; setSelectedSymptoms(next); updateStatus(next, level); }} className={`push-btn chip ${selectedSymptoms.includes(s) ? 'active' : ''}`}>{s}</button>
                ))}
              </div>
              <h2 className="section-title">2. しんどさ</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                {[0,1,2,3,4,5].map(n => <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} className={`push-btn lv-btn ${level === n ? 'active' : ''}`}>{n}</button>)}
              </div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '15px' }}>
                <div onClick={() => editPlanItem('requests')} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📋 お願い内容</span><Edit3 size={18} />
                </div>
                <div style={{ marginTop: '10px', fontSize: '14px' }}>{status?.requests?.join('、') || "未設定"}</div>
              </div>
              <button 
                onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`YORISOI🕊️でつながりましょう\n${getInviteUrl()}\n（このリンクを開くだけで登録完了するよ！）`)}`)} 
                className="push-btn line-btn" 
                style={{ marginTop: '30px', width: '100%', padding: '20px', background: '#4cc764', color: '#fff', borderRadius: '30px', fontWeight: 'bold' }}>
                LINEで招待リンクを送る
              </button>
            </>
          )}
        </>
      )}
      <style jsx>{`
        .push-btn { transition: 0.1s; border: none; cursor: pointer; outline: none; }
        .push-btn:active { transform: scale(0.95); }
        .chip { padding: 10px 15px; border-radius: 20px; background: #fff; font-size: 13px; }
        .chip.active { background: #9ebbd7; color: #fff; }
        .lv-btn { width: 45px; height: 45px; border-radius: 50%; background: #fff; font-weight:bold; color:#9ebbd7; }
        .lv-btn.active { background: #9ebbd7; color: #fff; }
        .quick-reply { padding: 10px; background: #fff; border: 1px dashed #9ebbd7; border-radius: 10px; font-size: 11px; color:#9ebbd7; }
        .section-title { font-size: 15px; margin-bottom: 10px; }
        .line-btn { box-shadow: 0 4px 12px rgba(76,199,100,0.3); }
      `}</style>
    </div>
  );
}
