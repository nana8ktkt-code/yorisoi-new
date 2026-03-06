"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, Send, ChevronDown, Plus, Check } from 'lucide-react';

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
  const [selectedSymptoms, setSelectedSymptoms] = useState(["生理痛"]); // 複数選択用
  const [activeSettingSymptom, setActiveSettingSymptom] = useState("生理痛"); // 設定画面用
  const [level, setLevel] = useState(2);
  const [data, setData] = useState({});
  const [isSetting, setIsSetting] = useState(false);
  const [settingLevel, setSettingLevel] = useState(0);
  const userId = "user_001";

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

  useEffect(() => {
    return onSnapshot(doc(db, "users", userId), (s) => {
      if (s.exists()) setData(s.data().config || {});
    });
  }, []);

  const save = async (newData) => {
    await setDoc(doc(db, "users", userId), { config: newData }, { merge: true });
  };

  // 症状の選択切り替え（複数）
  const toggleSymptom = (s) => {
    if (s === "その他") {
      const val = window.prompt("症状を入力してください");
      if (!val) return;
      if (!selectedSymptoms.includes(val)) {
        setSelectedSymptoms([...selectedSymptoms, val]);
      }
      return;
    }
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter(i => i !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const toggleSelection = (symptom, lv, type, item) => {
    const newData = { ...data };
    if (!newData[symptom]) newData[symptom] = {};
    if (!newData[symptom][lv]) newData[symptom][lv] = { doing: [], requests: [], notToDo: [] };
    
    const currentList = newData[symptom][lv][type] || [];
    if (currentList.includes(item)) {
      newData[symptom][lv][type] = currentList.filter(i => i !== item);
    } else {
      newData[symptom][lv][type] = [...currentList, item];
    }
    setData(newData);
    save(newData);
  };

  const handleFreeInput = (type) => {
    const val = window.prompt("自由に入力してください");
    if (val) toggleSelection(activeSettingSymptom, settingLevel, type, val);
  };

  // 全ての選択済み症状のプランを合算する
  const getCombinedPlan = () => {
    const combined = { doing: [], requests: [], notToDo: [] };
    selectedSymptoms.forEach(s => {
      const p = data[s]?.[level] || { doing: [], requests: [], notToDo: [] };
      combined.doing = [...new Set([...combined.doing, ...(p.doing || [])])];
      combined.requests = [...new Set([...combined.requests, ...(p.requests || [])])];
      combined.notToDo = [...new Set([...combined.notToDo, ...(p.notToDo || [])])];
    });
    return combined;
  };

  if (isSetting) {
    const currentConfig = data[activeSettingSymptom]?.[settingLevel] || { doing: [], requests: [], notToDo: [] };
    // 保存されているすべての症状リスト（デフォルト＋自由入力されたもの）
    const allKnownSymptoms = [...new Set([...defaultSymptoms, ...Object.keys(data)])];

    return (
      <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
        <button onClick={() => setIsSetting(false)} style={{ border: 'none', padding: '10px 20px', borderRadius: '10px', marginBottom: '20px', background: '#fff', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>◀ 完了</button>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '14px', color: '#888' }}>設定する症状</label>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', appearance: 'none', background: '#fff', fontSize: '16px' }}>
              {allKnownSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '15px', color: '#aaa' }} />
          </div>

          <label style={{ fontSize: '14px', color: '#888' }}>設定するレベル</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            {[0, 1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #9ebbd7', background: settingLevel === n ? '#9ebbd7' : '#fff', color: settingLevel === n ? '#fff' : '#9ebbd7' }}>{n}</button>
            ))}
          </div>

          <section>
            <h4 style={{ color: '#5a8fb9', borderBottom: '2px solid #f0f7ff', paddingBottom: '5px' }}>👟 やっていること</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {[...new Set([...defaultOptions.doing, ...(currentConfig.doing || [])])].map(item => (
                <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, 'doing', item)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #eee', fontSize: '12px', background: currentConfig.doing?.includes(item) ? '#e0f0ff' : '#fff', color: currentConfig.doing?.includes(item) ? '#0070f3' : '#666' }}>{item}</button>
              ))}
              <button onClick={() => handleFreeInput('doing')} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px dashed #9ebbd7', fontSize: '12px', background: '#fff', color: '#9ebbd7', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14}/>自由入力</button>
            </div>

            <h4 style={{ color: '#b95a5a', borderBottom: '2px solid #fff0f0', paddingBottom: '5px' }}>🍼 おねがい</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {defaultOptions.requests.flatMap(g => g.items).concat(currentConfig.requests || []).filter((v, i, a) => a.indexOf(v) === i).map(item => (
                <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, 'requests', item)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #eee', fontSize: '12px', background: currentConfig.requests?.includes(item) ? '#fff0f0' : '#fff', color: currentConfig.requests?.includes(item) ? '#d04040' : '#666' }}>{item}</button>
              ))}
              <button onClick={() => handleFreeInput('requests')} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px dashed #b95a5a', fontSize: '12px', background: '#fff', color: '#b95a5a', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14}/>自由入力</button>
            </div>

            <h4 style={{ color: '#666', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>⚠️ 遠慮してほしい</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[...new Set([...defaultOptions.notToDo, ...(currentConfig.notToDo || [])])].map(item => (
                <button key={item} onClick={() => toggleSelection(activeSettingSymptom, settingLevel, 'notToDo', item)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #eee', fontSize: '12px', background: currentConfig.notToDo?.includes(item) ? '#f0f0f0' : '#fff', color: currentConfig.notToDo?.includes(item) ? '#333' : '#666' }}>{item}</button>
              ))}
              <button onClick={() => handleFreeInput('notToDo')} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px dashed #666', fontSize: '12px', background: '#fff', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14}/>自由入力</button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const combinedPlan = getCombinedPlan();
  const allDisplaySymptoms = [...new Set([...defaultSymptoms, ...Object.keys(data)])];

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#555', background: '#fcfdff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>1. 症状は？（複数選択可）</h2>
        <Settings onClick={() => setIsSetting(true)} size={24} style={{ color: '#aaa', cursor: 'pointer' }} />
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
        {allDisplaySymptoms.map(s => (
          <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid #eee', background: selectedSymptoms.includes(s) ? '#9ebbd7' : '#fff', color: selectedSymptoms.includes(s) ? '#fff' : '#777', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {selectedSymptoms.includes(s) && <Check size={14}/>} {s}
          </button>
        ))}
        <button onClick={() => toggleSymptom("その他")} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px dashed #9ebbd7', background: '#fff', color: '#9ebbd7', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={14}/> その他
        </button>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>2. しんどさレベルは？</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setLevel(n)} style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #9ebbd7', background: level === n ? '#9ebbd7' : '#fff', color: level === n ? '#fff' : '#9ebbd7', fontWeight: 'bold' }}>{n}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
          今のプラン (Lv.{level})
          <div style={{ fontSize: '12px', color: '#9ebbd7', marginTop: '4px' }}>{selectedSymptoms.join(' + ')}</div>
        </h3>
        <div style={{ marginBottom: '15px' }}>
          <small style={{ color: '#88a', fontWeight: 'bold' }}>👟 実行中</small>
          <div style={{ background: '#f0f7ff', padding: '10px', borderRadius: '8px', marginTop: '5px', fontSize: '14px' }}>
            {combinedPlan.doing.length > 0 ? combinedPlan.doing.join('、') : "設定なし"}
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <small style={{ color: '#a88', fontWeight: 'bold' }}>🍼 おねがい</small>
          <div style={{ background: '#fff0f0', padding: '10px', borderRadius: '8px', marginTop: '5px', fontSize: '14px' }}>
            {combinedPlan.requests.length > 0 ? combinedPlan.requests.join('、') : "設定なし"}
          </div>
        </div>
        <div>
          <small style={{ color: '#666', fontWeight: 'bold' }}>⚠️ 遠慮してほしい</small>
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', marginTop: '5px', fontSize: '14px' }}>
            {combinedPlan.notToDo.length > 0 ? combinedPlan.notToDo.join('、') : "設定なし"}
          </div>
        </div>
      </div>

      <button onClick={() => {
        const text = `【Yorisoi通知】\n状態：${selectedSymptoms.join('＆')}\nレベル：${level}\n■やってること：${combinedPlan.doing.join('、') || 'なし'}\n■おねがい：${combinedPlan.requests.join('、') || 'なし'}\n■遠慮：${combinedPlan.notToDo.join('、') || 'なし'}`;
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
      }} style={{ width: '100%', marginTop: '30px', padding: '15px', borderRadius: '30px', background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        LINEで今の状態を伝える <Send size={18} />
      </button>
    </div>
  );
}
