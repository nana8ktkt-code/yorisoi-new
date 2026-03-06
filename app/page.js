"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, Send, ChevronDown, Plus, Check, Heart, Ban, Info, Sparkles } from 'lucide-react';

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

const levelFeelings = [
  "いつも通り元気！", "ちょっと違和感あるかも", "地味にじわじわ痛い", 
  "しんどい、動きたくない", "かなりつらい、助けて", "立っていられない、限界"
];

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
    const unsubStatus = onSnapshot(doc(db, "pairs", pairCode), (s) => {
      if (s.exists()) setStatus(s.data());
    });
    const unsubConfig = onSnapshot(doc(db, "configs", pairCode), (s) => {
      if (s.exists()) setData(s.data());
    });
    return () => { unsubStatus(); unsubConfig(); };
  }, [pairCode]);

  const updateStatus = async (newSymptoms, newLevel) => {
    if (!pairCode) return;
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: newSymptoms,
      level: newLevel,
      feeling: levelFeelings[newLevel],
      updatedAt: new Date().getTime(),
      reaction: "" // 更新時にリアクションをリセット
    }, { merge: true });
  };

  const sendReaction = async (text) => {
    await setDoc(doc(db, "pairs", pairCode), { reaction: text }, { merge: true });
    alert("彼女に気持ちを伝えました！");
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

  if (!role) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif', background: '#fcfdff', minHeight: '100vh' }}>
        <h1 style={{ color: '#9ebbd7', letterSpacing: '2px' }}>💞 Yorisoi</h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '40px' }}>二人だけの合言葉を入力</p>
        <input type="text" placeholder="合言葉" onChange={(e) => setPairCode(e.target.value)} style={{ width: '80%', padding: '15px', borderRadius: '15px', border: '2px solid #eee', fontSize: '18px', textAlign: 'center', marginBottom: '30px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '20px', borderRadius: '20px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>私は体調を伝えたい（彼女）</button>
          <button onClick={() => setRole('him')} style={{ padding: '20px', borderRadius: '20px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold', fontSize: '16px' }}>私は体調を見守りたい（彼）</button>
        </div>
      </div>
    );
  }

  if (role === 'him') {
    const currentPlan = status ? getPlan(status.symptoms || [], status.level || 0) : null;
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', minHeight: '100vh', background: '#fff9fb' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '14px', color: '#ff9eb5', fontWeight: 'bold' }}>Pair: {pairCode}</span>
          <h2 style={{ fontSize: '22px', margin: '10px 0', color: '#555' }}>💞 彼女の状態</h2>
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
                <div style={{ fontSize: '16px', marginTop: '5px' }}>{currentPlan.doing.join('、') || "休んでいます"}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #ff9eb5' }}>
                <small style={{ color: '#ff9eb5', fontWeight: 'bold' }}>🍼 お願いしたいこと</small>
                <div style={{ fontSize: '18px', marginTop: '5px', fontWeight: 'bold', color: '#d04040' }}>
                  {currentPlan.requests.length > 0 ? currentPlan.requests.map(r => `・${r}`).join('\n') : "特にありません。そばにいてね。"}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', borderLeft: '8px solid #bbb' }}>
                <small style={{ color: '#777', fontWeight: 'bold' }}>⚠️ 遠慮してほしいこと</small>
                <div style={{ fontSize: '16px', marginTop: '5px', color: '#666' }}>
                   {currentPlan.notToDo.length > 0 ? currentPlan.notToDo.map(n => `・${n}`).join('\n') : "特になし"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button onClick={() => sendReaction("🌸 助かった！")} style={{ padding: '15px', borderRadius: '15px', background: '#fff', border: '2px solid #ff9eb5', color: '#ff9eb5', fontWeight: 'bold' }}>🌸 助かった</button>
              <button onClick={() => sendReaction("✨ いつもありがとう")} style={{ padding: '15px', borderRadius: '15px', background: '#ff9eb5', border: 'none', color: '#fff', fontWeight: 'bold' }}>✨ ありがとう</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#ccc' }}>
             <Heart size={60} color="#eee" fill="#eee" style={{ marginBottom: '20px' }} />
             <p>彼女は今、元気そうです ✨</p>
          </div>
        )}
      </div>
    );
  }

  // 彼女の画面（発信者）
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', background: '#fff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#9ebbd7', fontWeight: 'bold' }}>合言葉: {pairCode}</div>
        <Settings onClick={() => setIsSetting(true)} size={24} color="#ccc" />
      </header>

      {status?.reaction && (
        <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center', border: '1px solid #ffcadb', color: '#ff7a99', fontWeight: 'bold', animation: 'bounce 1s infinite' }}>
          彼から：{status.reaction}
        </div>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>1. 症状を選ぶ</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
        {defaultSymptoms.map(s => (
          <button key={s} onClick={() => {
            const next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s];
            setSelectedSymptoms(next);
            updateStatus(next, level);
          }} style={{ padding: '12px 18px', borderRadius: '15px', border: '1px solid #eee', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#777', fontWeight: 'bold' }}>{s}</button>
        ))}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>2. しんどさは？</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => { setLevel(n); updateStatus(selectedSymptoms, n); }} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #9ebbd7', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold' }}>{n}</button>
        ))}
      </div>
      <div style={{ textAlign: 'center', color: '#ff7a99', fontWeight: 'bold', marginBottom: '30px' }}>😭 {levelFeelings[level]}</div>

      <div style={{ textAlign: 'center', padding: '20px', background: '#fcfdff', borderRadius: '20px', border: '2px dashed #eee', color: '#9ebbd7' }}>
         <Sparkles size={20} style={{ marginBottom: '5px' }} />
         <div>選ぶだけで彼に届きます</div>
      </div>

      {/* 通知ボタンを大きく配置 */}
      <button onClick={() => {
        const text = `【Yorisoi通知】\n彼女の体調が更新されました！\n${selectedSymptoms.join('＆')} Lv.${level}\n${levelFeelings[level]}\nアプリを確認してね！`;
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
      }} style={{ width: '100%', marginTop: '30px', padding: '20px', borderRadius: '35px', background: '#4cc764', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(76,199,100,0.3)' }}>
        彼にLINEで通知する（超重要）
      </button>
    </div>
  );
}
