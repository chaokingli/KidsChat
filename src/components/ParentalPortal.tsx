
import React, { useState } from 'react';
import { Settings, Message, Character, AppLanguage, AppTheme, ApiProvider } from '../types';
import { UI_TRANSLATIONS, LANGUAGE_LABELS } from '../locales';
import { THEME_CONFIG, GOOGLE_REASONING_MODELS, GOOGLE_TTS_MODELS } from '../constants';

interface Props {
  settings: Settings;
  onUpdate: (s: Settings) => void;
  history: Message[];
  characters: Character[];
  onClearHistory: () => void;
  lang: AppLanguage;
}

export const ParentalPortal: React.FC<Props> = ({ settings, onUpdate, history, characters, onClearHistory, lang }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const t = UI_TRANSLATIONS[lang];
  const theme = THEME_CONFIG[settings.theme];

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') { 
      setIsUnlocked(true);
    } else {
      alert('Wrong magic word!');
    }
  };

  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || 'Unknown';
  };

  if (!isUnlocked) {
    return (
      <div className={`max-w-md mx-auto p-8 sm:p-12 text-center bg-white rounded-3xl shadow-xl mt-6 sm:mt-10 border border-${theme.secondary}`}>
        <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-${theme.secondary} text-${theme.accent} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <i className="fas fa-lock text-3xl sm:text-4xl"></i>
        </div>
        <h2 className={`text-xl sm:text-2xl font-bold text-gray-800 mb-2`}>{t.parentsOnly}</h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-8">{t.passwordHint}</p>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 border-gray-100 focus:border-${theme.primary} outline-none text-center text-xl sm:text-2xl tracking-widest font-bold bg-gray-50`}
            placeholder="****"
            inputMode="numeric"
          />
          <button className={`w-full py-3 sm:py-4 bg-${theme.primary} text-white rounded-2xl font-black text-sm sm:text-lg hover:opacity-90 transition-all active:scale-[0.98] shadow-md`}>
            {t.unlock}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto p-4 sm:p-8 bg-white rounded-3xl shadow-xl mt-4 sm:mt-6 mb-12 border border-${theme.secondary}`}>
      <div className="flex justify-between items-center mb-6 sm:mb-8 bg-gray-50 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 p-4 sm:p-6 rounded-t-3xl border-b border-gray-100">
        <h2 className="text-lg sm:text-2xl font-black text-gray-800 flex items-center gap-2">
          <i className="fas fa-shield-halved text-green-500"></i> {t.safetyControls}
        </h2>
        <button 
          onClick={() => setIsUnlocked(false)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
      </div>

      <div className="space-y-10 sm:space-y-12">
        {/* Core Settings */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl gap-3">
            <div>
              <h3 className="font-bold text-gray-700 text-sm sm:text-base">{t.language}</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-black tracking-widest opacity-60">Speech and UI language</p>
            </div>
            <select 
               value={settings.language}
               onChange={(e) => onUpdate({ ...settings, language: e.target.value as AppLanguage })}
               className={`bg-white border-2 border-${theme.secondary} px-4 py-2 rounded-xl outline-none font-bold text-sm text-${theme.primary} shadow-sm`}
            >
              {Object.keys(LANGUAGE_LABELS).map((key) => (
                <option key={key} value={key}>{LANGUAGE_LABELS[key as AppLanguage]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl gap-3">
            <div>
              <h3 className="font-bold text-gray-700 text-sm sm:text-base">{t.theme}</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-black tracking-widest opacity-60">Visual appearance</p>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {(['neutral', 'boy', 'girl'] as AppTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => onUpdate({ ...settings, theme: thm })}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-bold text-[10px] sm:text-xs transition-all uppercase tracking-wider ${
                    settings.theme === thm 
                      ? `bg-${THEME_CONFIG[thm].primary} text-white shadow-md scale-105` 
                      : `bg-white border border-gray-100 text-gray-400`
                  }`}
                >
                  {t[`theme${thm.charAt(0).toUpperCase() + thm.slice(1)}`]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* AI Provider Config */}
        <section className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 border-t border-gray-100">
          <h3 className="text-base sm:text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
            <i className={`fas fa-robot text-${theme.primary}`}></i> {t.aiProvider}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {(['google', 'custom'] as ApiProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ ...settings, apiProvider: p })}
                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
                  settings.apiProvider === p 
                    ? `border-${theme.primary} bg-${theme.bg}/50` 
                    : 'border-gray-50 bg-white opacity-60'
                }`}
              >
                <div className={`font-bold text-sm sm:text-base ${settings.apiProvider === p ? `text-${theme.primary}` : 'text-gray-600'}`}>
                  {p === 'google' ? t.providerGoogle : t.providerCustom}
                </div>
                {settings.apiProvider === p && <i className={`fas fa-circle-check text-${theme.primary}`}></i>}
              </button>
            ))}
          </div>

          {settings.apiProvider === 'google' && (
            <div className={`p-4 sm:p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 shadow-inner`}>
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Optional Key</label>
                <input 
                  type="password"
                  placeholder="Leave blank for system default"
                  value={settings.googleApiKey || ''}
                  onChange={(e) => onUpdate({ ...settings, googleApiKey: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">Reasoning Model</label>
                <select 
                  value={settings.googleModelName}
                  onChange={(e) => onUpdate({ ...settings, googleModelName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none bg-white font-bold text-sm text-gray-700"
                >
                  {GOOGLE_REASONING_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {settings.apiProvider === 'custom' && (
            <div className={`p-4 sm:p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 shadow-inner`}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">{t.customApiUrl}</label>
                  <input 
                    type="text"
                    value={settings.customApiUrl || ''}
                    onChange={(e) => onUpdate({ ...settings, customApiUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">{t.customApiKey}</label>
                  <input 
                    type="password"
                    value={settings.customApiKey || ''}
                    onChange={(e) => onUpdate({ ...settings, customApiKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-1 uppercase tracking-widest">{t.customModel}</label>
                  <input 
                    type="text"
                    value={settings.customModelName || ''}
                    onChange={(e) => onUpdate({ ...settings, customModelName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Time Limit */}
        <section className="space-y-6 pt-6 sm:pt-8 border-t border-gray-100">
          <div>
            <h3 className="text-base sm:text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide mb-4">
              <i className={`fas fa-hourglass-half text-${theme.primary}`}></i> {t.timeLimit}
            </h3>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
              <input 
                type="range"
                min="15"
                max="120"
                step="15"
                value={settings.timeLimitMinutes}
                onChange={(e) => onUpdate({ ...settings, timeLimitMinutes: parseInt(e.target.value) })}
                className={`flex-1 accent-${theme.primary}`}
              />
              <span className={`font-black text-${theme.primary} min-w-[70px] text-right text-sm sm:text-base`}>{settings.timeLimitMinutes} {t.mins}</span>
            </div>
          </div>
        </section>

        {/* Records */}
        <section className="space-y-4 pt-6 sm:pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base sm:text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
              <i className={`fas fa-history text-${theme.primary}`}></i> {t.records}
            </h3>
            
            {history.length > 0 && (
              <button 
                onClick={() => setShowConfirmClear(true)}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full transition-all active:scale-95"
              >
                <i className="fas fa-trash-can"></i>
                <span className="hidden xs:inline">{t.clearHistory}</span>
              </button>
            )}
          </div>

          {showConfirmClear && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
               <span className="text-xs sm:text-sm font-bold text-red-700">Are you sure you want to delete all chat history?</span>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={() => setShowConfirmClear(false)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-red-200 text-red-700 rounded-xl text-xs font-bold">Cancel</button>
                 <button onClick={() => { onClearHistory(); setShowConfirmClear(false); }} className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm">Delete All</button>
               </div>
            </div>
          )}
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {history.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest opacity-60">No records found</p>
              </div>
            ) : (
              history.map((msg, i) => (
                <div key={i} className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                  msg.role === 'user' ? `bg-${theme.bg}/30 border-${theme.secondary}` : 'bg-white border-gray-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center text-[8px] sm:text-[10px] uppercase tracking-widest font-black mb-2 opacity-60">
                    <span className={`${msg.role === 'user' ? `text-${theme.primary}` : 'text-purple-600'}`}>
                      {msg.role === 'user' ? 'Child' : getCharacterName(msg.characterId)}
                    </span>
                    <span className="text-gray-400">
                      {new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">{msg.content}</p>
                </div>
              )).reverse()
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
