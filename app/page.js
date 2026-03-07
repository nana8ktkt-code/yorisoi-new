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

// 6桁のランダムコード生成
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function YorisoiApp() {
  const [showIntro, setShowIntro] = useState(true);
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
        <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '40px', color: '#7ba2c7' }}>
          体調を言葉にしなくても<br />
          <strong>大切な人に</strong>伝えられるアプリ
        </p>
        <div style={{ textAlign: 'left', background: '#fff', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)', width: '100%', marginBottom: '50px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>①</span><span style={{ fontSize: '14px' }}>体調を入力</span></div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>②</span><span style={{ fontSize: '14px' }}>お願いが自動生成</span></div>
          <div style={{ display: 'flex', gap: '15px' }}><span style={{ color: '#9ebbd7', fontWeight: 'bold' }}>③</span><span style={{ fontSize: '14px' }}><strong>お相手に</strong>共有</span></div>
        </div>
        <button onClick={() => setShowIntro(false)} className="push-btn" style={{ width: '100%', padding: '22px', borderRadius: '35px', background: '#9ebbd7', color: '#fff', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 6px 20px rgba(158,187,215,0.4)' }}>はじめる</button>
      </div>
    );
  }

  // 役割選択とコード入力画面
  if (!pairCode || !role) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center', padding: '80px 20px', background: '#f0f7ff' }}>
        <h1 style={{ color: '#9ebbd7', fontSize: '36px', letterSpacing: '2px' }}>🕊️ YORISOI</h1>
        <p style={{ fontSize: '14px', marginBottom: '60px' }}>ふたりのための、寄り添う空間</p
        