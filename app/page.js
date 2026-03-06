"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { Settings, Send, ChevronDown, Plus, Check, Users, Heart } from 'lucide-react';

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

export default function YorisoiApp() {
  const [pairCode, setPairCode] = useState(""); // 合言葉
  const [role, setRole] = useState(null); // 'her' or 'him'
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [level, setLevel] = useState(0);
  const [data, setData] = useState({}); // マスター設定
  const [status, setStatus] = useState(null); // リアルタイムの体調
  const [isSetting, setIsSetting] = useState(false);
  const [activeSettingSymptom, setActiveSettingSymptom] = useState("生理痛");
  const [settingLevel, setSettingLevel] = useState(0);

  const defaultSymptoms = ["つわり", "生理痛", "PMS", "頭痛", "腹痛", "だるい", "のどが痛い", "熱がある"];
  const defaultOptions = {
    doing: ["横になって休んでる", "薬を飲んで安静にしてる", "病院に行った", "食欲がない", "少し落ち着いてきた"],
    requests: [
      { cat: "🧼 家事", items: ["洗い物をお願い", "洗濯物をお願い", "ゴミ出しをお願い", "お風呂を沸かして"] },
      { cat: "🍱 食事", items: ["Ｃ１０００用意してほしいな", "おかゆ食べたいな", "温かい飲み物がいいな", "アイス買ってきて"] },
      { cat: "🌡️ ケア", items: ["湯たんぽ用意して", "部屋を暗くして", "腰をさすって", "静かにしてほしい"] }
    ],
    notToDo: ["やっていない家事に触れないで", "話しかけないで", "大きな音NG", "匂いNG", "そっとしておいて"]
  };

  // ペアの体調をリアルタイム監視
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
      updatedAt: new Date().getTime()
    });
    // LINE通知用のリンク作成
    const text = `【体調更新】${newSymptoms.join('＆')} Lv.${newLevel}\nアプリで詳細を確認してね！`;
    console.log("Status Updated Automatically");
  };

  const toggleSymptom = (s) => {
    let next;
    if (s === "その他") {
      const val = window.prompt("症状を入力してください");
      if (!val) return;
      next = selectedSymptoms.includes(val) ? selectedSymptoms : [...selectedSymptoms, val];
    } else {
      next = selectedSymptoms.includes(s) ? selectedSymptoms.filter(i => i !== s) : [...selectedSymptoms, s];
    }
    setSelectedSymptoms(next);
    updateStatus(next, level);
  };

  const handleLevelChange = (n) => {
    setLevel(n);
    updateStatus(selectedSymptoms, n);
  };

  const saveConfig = async (newData) => {
    await setDoc(doc(db, "configs", pairCode), newData);
  };

  const toggleSelection = (symptom, lv, type, item) => {
    const newData = { ...data };
    if (!newData[symptom]) newData[symptom] = {};
    if (!newData[symptom][lv]) newData[symptom][lv] = { doing: [], requests: [], notToDo: [] };
    const currentList = newData[symptom][lv][type] || [];
    newData[symptom][lv][type] = currentList.includes(item) ? currentList.filter(i => i !== item) : [...currentList, item];
    setData(newData);
    saveConfig(newData);
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

  // 初期画面：ペアコード入力
  if (!role) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif', background: '#fcfdff', minHeight: '100vh' }}>
        <h1 style={{ color: '#9ebbd7', marginBottom: '10px' }}>Yorisoi</h1>
        <p style={{ color: '#888', fontSize: '14px' }}>二人を繋ぐ合言葉を入力してください</p>
        <input 
          type="text" 
          placeholder="例：wedding0707" 
          onChange={(e) => setPairCode(e.target.value)}
          style={{ width: '80%', padding: '15px', borderRadius: '15px', border: '2px solid #eee', marginTop: '20px', fontSize: '18px', textAlign: 'center' }}
        />
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setRole('her')} style={{ padding: '15px', borderRadius: '15px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold' }}>私は体調を伝えたい（彼女）</button>
          <button onClick={() => setRole('him')} style={{ padding: '15px', borderRadius: '15px', background: '#fff', color: '#9ebbd7', border: '2px solid #9ebbd7', fontWeight: 'bold' }}>私は体調を見守りたい（彼）</button>
        </div>
      </div>
    );
  }

  // 彼（閲覧者）の画面
  if (role === 'him') {
    const currentPlan = status ? getPlan(status.symptoms, status.level) : null;
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', minHeight: '100vh', background: '#fcfdff' }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Heart size={40} color="#ff9eb5" fill="#ff9eb5" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '20px', color: '#555' }}>今の彼女の状態</h2>
        </div>

        {status && status.symptoms.length > 0 ? (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9ebbd7' }}>{status.symptoms.join(' ＆ ')}</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#555' }}>Lv.{status.level}</div>
            </div>

            <div style={{ background: '#fff', borderRadius: '25px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: '20px' }}>
                <small style={{ color: '#88a', fontWeight: 'bold' }}>👟 今の状態</small>
                <div style={{ background: '#f0f7ff', padding: '15px', borderRadius: '12px', marginTop: '5px', fontSize: '16px' }}>
                  {currentPlan.doing.join('、') || "ゆっくりしています"}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <small style={{ color: '#a88', fontWeight: 'bold' }}>🍼 おねがいしたいこと</small>
                <div style={{ background: '#fff0f0', padding: '15px', borderRadius: '12px', marginTop: '5px', fontSize: '16px', fontWeight: 'bold', color: '#d04040' }}>
                  {currentPlan.requests.join('、') || "特にありません。そばにいてね。"}
                </div>
              </div>
              <div>
                <small style={{ color: '#666', fontWeight: 'bold' }}>⚠️ 遠慮してほしいこと</small>
                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '12px', marginTop: '5px', fontSize: '16px' }}>
                  {currentPlan.notToDo.join('、') || "特にありません"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>彼女は今、元気そうです ✨</p>
        )}
        
        <button onClick={() => setRole(null)} style={{ width: '100%', marginTop: '40px', background: 'none', border: 'none', color: '#aaa', fontSize: '12px' }}>ペアコードを変更する</button>
      </div>
    );
  }

  // 彼女（発信者）の画面
  if (isSetting) {
    const currentConfig = data[activeSettingSymptom]?.[settingLevel] || { doing: [], requests: [], notToDo: [] };
    const allKnownSymptoms = [...new Set([...defaultSymptoms, ...Object.keys(data)])];
    return (
      <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <button onClick={() => setIsSetting(false)} style={{ border: 'none', padding: '10px 20px', borderRadius: '10px', marginBottom: '20px', background: '#fff', fontWeight: 'bold' }}>◀ 完了</button>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '12px', color: '#888' }}>設定する症状</label>
          <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '20px' }}>
            {allKnownSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{ fontSize: '12px', color: '#888' }}>レベル {settingLevel}</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            {[0, 1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #9ebbd7', background: settingLevel === n ? '#9ebbd7' : '#fff', color: settingLevel === n ? '#fff' : '#9ebbd7' }}>{n}</button>)}
          </div>
          {/* 設定項目（中略：以前の機能維持） */}
          <h4 style={{ fontSize: '14px', color: '#5a8fb9' }}>👟 やっていること</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
            {defaultOptions.doing.concat(currentConfig.doing || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
              <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, 'doing', item)} style={{ padding: '6px 10px', borderRadius: '15px', border: '1px solid #eee', fontSize: '11px', background: currentConfig.doing?.includes(item) ? '#e0f0ff' : '#fff' }}>{item}</button>
            ))}
            <button onClick={() => { const v = window.prompt("追加"); if(v) toggleSelection(activeSettingSymptom, settingLevel, 'doing', v)}} style={{ padding: '6px 10px', borderRadius: '15px', border: '1px dashed #aaa', fontSize: '11px' }}>+ 自由入力</button>
          </div>
          <h4 style={{ fontSize: '14px', color: '#b95a5a' }}>🍼 おねがい</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
            {defaultOptions.requests.flatMap(g => g.items).concat(currentConfig.requests || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
              <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, 'requests', item)} style={{ padding: '6px 10px', borderRadius: '15px', border: '1px solid #eee', fontSize: '11px', background: currentConfig.requests?.includes(item) ? '#fff0f0' : '#fff' }}>{item}</button>
            ))}
            <button onClick={() => { const v = window.prompt("追加"); if(v) toggleSelection(activeSettingSymptom, settingLevel, 'requests', v)}} style={{ padding: '6px 10px', borderRadius: '15px', border: '1px dashed #aaa', fontSize: '11px' }}>+ 自由入力</button>
          </div>
          <h4 style={{ fontSize: '14px', color: '#666' }}>⚠️ 遠慮</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {defaultOptions.notToDo.concat(currentConfig.notToDo || []).filter((v,i,a)=>a.indexOf(v)===i).map(item => (
              <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, 'notToDo', item)} style={{ padding: '6px 10px', borderRadius: '15px', border: '1px solid #eee', fontSize: '11px', background: currentConfig.notToDo?.includes(item) ? '#f0f0f0' : '#fff' }}>{item}</button>
            ))}
            <button onClick={() => { const v = window.prompt("追加"); if(v) toggleSelection(activeSettingSymptom, settingLevel, 'notToDo', v)}} style={{ padding: '6px 10px', borderRadius: '15px', border: '1px dashed #aaa', fontSize: '11px' }}>+ 自由入力</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#555', background: '#fcfdff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} color="#9ebbd7" />
          <span style={{ fontSize: '14px', color: '#9ebbd7', fontWeight: 'bold' }}>ペア：{pairCode}</span>
        </div>
        <Settings onClick={() => setIsSetting(true)} size={24} style={{ color: '#aaa', cursor: 'pointer' }} />
      </header>

      <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>1. 症状を選ぶ（複数可）</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px', marginTop: '10px' }}>
        {defaultSymptoms.map(s => (
          <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid #eee', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#777', fontSize: '13px', fontWeight: 'bold' }}>
            {selectedSymptoms.includes(s) && <Check size={14} style={{ marginRight: '5px' }}/>} {s}
          </button>
        ))}
        <button onClick={() => toggleSymptom("その他")} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px dashed #9ebbd7', color: '#9ebbd7', fontSize: '13px' }}>+ その他</button>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>2. レベルを選ぶ</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0 30px 0' }}>
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => handleLevelChange(n)} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #9ebbd7', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold' }}>{n}</button>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '20px', border: '2px dashed #eee', borderRadius: '20px', color: '#aaa' }}>
        選択すると自動で彼に共有されます
      </div>

      <button onClick={() => {
        const combined = getPlan(selectedSymptoms, level);
        const text = `【Yorisoi通知】\n症状：${selectedSymptoms.join('＆')}\nレベル：${level}\n■お願い：${combined.requests.join('、')}\nアプリで詳しく見てね！`;
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
      }} style={{ width: '100%', marginTop: '30px', padding: '15px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        LINEでも念押しする <Send size={18} />
      </button>
    </div>
  );
}
