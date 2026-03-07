      {isSetting ? (
        /* --- 設定画面 --- */
        <div style={{ background: '#fff', padding: '25px', borderRadius: '30px', minHeight: '80vh', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <button onClick={() => setIsSetting(false)} className="push-btn" style={{ padding: '10px 20px', background: '#f0f7ff', borderRadius: '15px', color: '#9ebbd7', marginBottom: '20px', fontWeight: 'bold' }}>◀ 戻る</button>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#5a7d9a' }}>症状を選択</label>
            <select value={activeSettingSymptom} onChange={(e) => setActiveSettingSymptom(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #f0f7ff', background: '#fcfdff', marginTop: '5px' }}>
              {defaultSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#5a7d9a' }}>しんどさ Lv.{settingLevel}</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', background: '#f8fbff', padding: '10px', borderRadius: '25px' }}>
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setSettingLevel(n)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: settingLevel === n ? '#9ebbd7' : 'transparent', color: settingLevel === n ? '#fff' : '#ccc', fontWeight: 'bold' }}>{n}</button>
              ))}
            </div>
          </div>

          {['doing', 'requests', 'notToDo'].map(type => {
            // そのレベルで表示する選択肢のベース（前あった選択肢）
            const baseOptions = type === 'doing' ? defaultOptions.doing : (type === 'requests' ? defaultOptions.requests.flatMap(c => c.items) : defaultOptions.notToDo);
            // ユーザーが自分で追加して保存したもの
            const customSaved = data[activeSettingSymptom]?.[settingLevel]?.[type] || [];
            
            return (
              <div key={type} style={{ marginBottom: '25px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#5a7d9a', marginBottom: '10px' }}>
                  {type === 'doing' ? '😷 今の状態' : type === 'requests' ? '☺️ お願い' : '🥺 遠慮してほしいこと'}
                </p>
                
                {/* 自由記述入力 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    value={customInput[type]} 
                    onChange={(e) => setCustomInput({...customInput, [type]: e.target.value})} 
                    placeholder="自由に入力して保存" 
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '13px' }} 
                  />
                  <button onClick={() => saveCustomText(type)} style={{ padding: '10px 15px', background: '#9ebbd7', color: '#fff', borderRadius: '12px', border: 'none' }} className="push-btn">
                    <Save size={18}/>
                  </button>
                </div>

                {/* 選択肢（ベース + カスタム） */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[...new Set([...baseOptions, ...customSaved])].map(item => {
                    const isActive = customSaved.includes(item);
                    return (
                      <button 
                        key={item} 
                        onClick={() => toggleConfigItem(activeSettingSymptom, settingLevel, type, item)} 
                        className="push-btn" 
                        style={{ 
                          padding: '8px 14px', 
                          borderRadius: '15px', 
                          border: 'none', 
                          background: isActive ? '#9ebbd7' : '#f5f5f5', 
                          color: isActive ? '#fff' : '#888', 
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {item} {isActive ? <Check size={12}/> : <Plus size={12}/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
