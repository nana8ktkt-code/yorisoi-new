"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Settings, Send } from 'lucide-react';

// あなたのFirebase設定を反映
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
  const [activeSymptom, setActiveSymptom] = useState("生理痛");
  const [level, setLevel] = useState(2);
  const [data, setData] = useState({});
  const [isSetting, setIsSetting] = useState(false);
  const userId = "user_001"; // あなたのID

  const symptoms = ["生理痛", "PMS", "気持ちの浮き沈み", "頭痛", "腹痛", "熱がある", "体がだるい", "その他"];

  useEffect(() => {
    return onSnapshot(doc(db, "users", userId), (s) => {
      if (s.exists()) setData(s.data().config || {});
    });
  }, []);

  const save = async (newData) => {
    await setDoc(doc(db, "users", userId), { config: newData }, { merge: true });
  };

  const updateDetail = (lv, type) => {
    const val = window.prompt(`${activeSymptom} Lv.${lv} の「${type === 'doing' ? '実行中' : 'おねがい'}」を入力`);
    if (!val) return;
    const newData = { ...data };
    if (!newData[activeSymptom]) newData[activeSymptom] = {};
    if (!newData[activeSymptom][lv]) newData[activeSymptom][lv] = { doing: "", requests: "" };
    newData[activeSymptom][lv][type] = val;
    setData(newData);
    save(newData);
  };

  if (isSetting) {
    return (
      <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <button onClick={() => setIsSetting(false)} style={{ border: 'none', padding: '10px', borderRadius: '10px', marginBottom: '20px', background: '#fff', fontWeight: 'bold' }}>◀ 戻る</button>
        <h2 style={{ textAlign: 'center', color: '#555', fontSize: '18px' }}>レベル別設定: {activeSymptom}</h2>
        {[0, 1, 2, 3, 4, 5].map(lv => (
          <div key={lv} style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#9ebbd7' }}>Lv.{lv} のとき</h3>
            <div onClick={() => updateDetail(lv, 'doing')} style={{ padding: '12px', background: '#f0f7ff', borderRadius: '10px', marginBottom: '10px' }}>
              <small style={{ color: '#888' }}>実行中（ここをタップして入力）</small>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{data[activeSymptom]?.[lv]?.doing || "未設定"}</p>
            </div>
            <div onClick={() => updateDetail(lv, 'requests')} style={{ padding: '12px', background: '#fff0f0', borderRadius: '10px' }}>
              <small style={{ color: '#888' }}>おねがい（ここをタップして入力）</small>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{data[activeSymptom]?.[lv]?.requests || "未設定"}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#555', background: '#fcfdff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>1. 症状は？</h2>
        <Settings onClick={() => setIsSetting(true)} size={24} style={{ color: '#aaa', cursor: 'pointer' }} />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '15px 0' }}>
        {symptoms.map(s => (
          <button key={s} onClick={() => setActiveSymptom(s)} style={{
            padding: '12px', borderRadius: '12px', border: '1px solid #eee',
            background: activeSymptom === s ? '#9ebbd7' : '#fff',
            color: activeSymptom === s ? '#fff' : '#777',
            fontSize: '13px', fontWeight: 'bold'
          }}>{s}</button>
        ))}
      </div>

      <h2 style={{ fontSize: '18px', marginTop: '30px', fontWeight: 'bold' }}>2. しんどさレベルは？</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0' }}>
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setLevel(n)} style={{
            width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #9ebbd7',
            background: level === n ? '#9ebbd7' : '#fff',
            color: level === n ? '#fff' : '#9ebbd7',
            fontWeight: 'bold', fontSize: '16px'
          }}>{n}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginTop: '20px', border: '1px solid #f0f0f0' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>今のプラン</h3>
        <div style={{ marginBottom: '15px' }}>
          <small style={{ color: '#88a', fontWeight: 'bold' }}>👟 実行中</small>
          <div style={{ background: '#f0f7ff', padding: '12px', borderRadius: '8px', marginTop: '5px', fontSize: '15px' }}>
            {data[activeSymptom]?.[level]?.doing || "⚙️から設定してね"}
          </div>
        </div>
        <div>
          <small style={{ color: '#a88', fontWeight: 'bold' }}>🍼 おねがい</small>
          <div style={{ background: '#fff0f0', padding: '12px', borderRadius: '8px', marginTop: '5px', fontSize: '15px' }}>
            {data[activeSymptom]?.[level]?.requests || "⚙️から設定してね"}
          </div>
        </div>
      </div>

      <button style={{
        width: '100%', marginTop: '30px', padding: '15px', borderRadius: '30px',
        background: '#9ebbd7', color: '#fff', border: 'none', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px'
      }}>
        LINEで今の状態を伝える <Send size={18} />
      </button>
    </div>
  );
}
