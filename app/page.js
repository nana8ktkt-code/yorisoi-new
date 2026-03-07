"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { Settings, CheckCircle2, Circle, Edit3, Plus, Sparkles, Trash2, Check, Lightbulb, Heart, Copy, Share, LogOut, Save } from 'lucide-react';

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

const levelFeelings = ["落ち着いたよ", "違和感あり", "ちょっとしんどい", "しんどい", "かなりつらい", "限界"];
const levelEmojis = ["🍃", "😅", "😷", "😭", "🥶", "🤮"];
const moodOptions = [
  { emoji: "🙂", label: "落ち着いてる" },
  { emoji: "😢", label: "寂しい" },
  { emoji: "😡", label: "イライラ" },
  { emoji: "😴", label: "眠い" },
  { emoji: "🤢", label: "気持ち悪い" }
];

const defaultSymptoms = ["つわり", "生理痛", "頭痛", "腹痛", "だるい", "熱がある"];
const softFontFace = '"Hiragino Maru Gothic ProN", "Meiryo", sans-serif';

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
  const [customInput, setCustomInput] = useState({ doing: "", requests: "", notToDo: "" });

  // 1. ログイン保持 (localStorageから復元)
  useEffect(() => {
    const savedCode = localStorage.getItem('yorisoi_pairCode');
    const savedRole = localStorage.getItem('yorisoi_role');
    if (savedCode && savedRole) {
      setPairCode(savedCode);
      setRole(savedRole);
      setShowIntro(false);
    }
  }, []);

  // Firebase同期
  useEffect(() => {
    if (!pairCode) return;
    const unsubStatus = onSnapshot(doc(db, "pairs", pairCode), (s) => { if (s.exists()) setStatus(s.data()); });
    const unsubConfig = onSnapshot(doc(db, "configs", pairCode), (s) => { if (s.exists()) setData(s.data()); });
    return () => { unsubStatus(); unsubConfig(); };
  }, [pairCode]);

  const saveLogin = (code, r) => {
    localStorage.setItem('yorisoi_pairCode', code);
    localStorage.setItem('yorisoi_role', r);
    setPairCode(code);
    setRole(r);
  };

  const logout = () => {
    if(confirm("ログアウトしますか？ペアコードを控えていない場合、再ログインできません。")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const startAsReporter = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    saveLogin(code, 'her');
  };

  const startAsSupporter = () => {
    if (inputCode.length >= 4) saveLogin(inputCode.toUpperCase(), 'him');
  };

  // ステータス更新
  const updateStatus = async (newSyms, newLv, customPlan = null, mood = null, mode = null) => {
    if (!pairCode) return;
    const plan = customPlan || getPlan(newSyms, newLv);
    await setDoc(doc(db, "pairs", pairCode), {
      symptoms: newSyms, level: newLv, feeling: levelFeelings[newLv], emoji: levelEmojis[newLv],
      mood: mood !== null ? (status?.mood === mood ? "" : mood) : (status?.mood || ""),
      mode: mode !== null ? (status?.mode === mode ? "" : mode) : (status?.mode || ""),
      updatedAt: new Date().getTime(), doing: plan.doing, requests: plan.requests, notToDo: plan.notToDo,
      completedTasks: status?.completedTasks || []
    }, { merge: true });
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

  // 設定画面での自由記述保存
  const saveCustomText = async (type) => {
    const text = customInput[type];
    if (!text.trim()) return;
    const newData = { ...data };
    if (!newData[activeSettingSymptom]) newData[activeSettingSymptom] = {};
    if (!newData[activeSettingSymptom][settingLevel]) newData[activeSettingSymptom][settingLevel] = { doing: [], requests: [], notToDo: [] };
    
    if (!newData[activeSettingSymptom][settingLevel][type].includes(text)) {
      newData[activeSettingSymptom][settingLevel][type] = [...newData[activeSettingSymptom][settingLevel][type], text];
      setData(newData);
      await setDoc(doc(db, "configs", pairCode), newData);
      setCustomInput({ ...customInput, [type]: "" });
    }
  };

  const toggleConfigItem = async (symptom, lv, type, item) => {
    const newData = { ...data };
    const list = newData[symptom]?.[lv]?.[type] || [];
    newData[symptom][lv][type] = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setData(newData);
    await setDoc(doc(db, "configs", pairCode), newData);
  };
