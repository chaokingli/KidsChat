
import React, { useState } from 'react';
import { Settings, Message, Character, AppLanguage, AppTheme, ApiProvider } from '../types';
import { UI_TRANSLATIONS, LANGUAGE_LABELS } from '../locales';
import { THEME_CONFIG } from '../constants';

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
      <div className={`max-w-md mx-auto p-12 text-center bg-white rounded-3xl shadow-xl mt-10 border border-${theme.secondary}`}>
        <i className={`fas fa-lock text-5xl text-${theme.accent} mb-6`}></i>
        <h2 className={`text-2xl font-bold text-gray-800 mb-2`}>{t.parentsOnly}</h2>
        <p className="text-gray-500 mb-8">{t.passwordHint}</p>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-${theme.primary} outline-none text-center text-2xl tracking-widest`}
            placeholder="****"
          />
          <button className={`w-full py-4 bg-${theme.primary} text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-colors`}>
            {t.unlock}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-xl mt-6 mb-12 border border-${theme.secondary}`}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-shield-halved text-green-500"></i> {t.safetyControls}
        </h2>
        <button 
          onClick={() => setIsUnlocked(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="space-y-12">
        {/* Core Settings */}
        <section className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <h3 className="font-bold text-gray-700">{t.language}</h3>
              <p className="text-sm text-gray-500">App speaking and UI language</p>
            </div>
            <select 
               value={settings.language}
               onChange={(e) => onUpdate({ ...settings, language: e.target.value as AppLanguage })}
               className={`bg-white border-2 border-${theme.secondary} px-4 py-2 rounded-xl outline-none font-bold text-${theme.primary}`}
            >
              {Object.keys(LANGUAGE_LABELS).map((key) => (
                <option key={key} value={key}>{LANGUAGE_LABELS[key as AppLanguage]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <h3 className="font-bold text-gray-700">{t.theme}</h3>
              <p className="text-sm text-gray-500">Customize the look and feel</p>
            </div>
            <div className="flex gap-2">
              {(['neutral', 'boy', 'girl'] as AppTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => onUpdate({ ...settings, theme: thm })}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    settings.theme === thm 
                      ? `bg-${THEME_CONFIG[thm].primary} text-white shadow-md` 
                      : `bg-white border-2 border-gray-100 text-gray-400`
                  }`}
                >
                  {t[`theme${thm.charAt(0).toUpperCase() + thm.slice(1)}`]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Text AI Provider Settings */}
        <section className="space-y-6 pt-8 border-t border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className={`fas fa-robot text-${theme.primary}`}></i> {t.aiProvider}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {(['google', 'custom'] as ApiProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ ...settings, apiProvider: p })}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  settings.apiProvider === p 
                    ? `border-${theme.primary} bg-${theme.bg}/50` 
                    : 'border-gray-100 bg-white opacity-60'
                }`}
              >
                <div className={`font-bold ${settings.apiProvider === p ? `text-${theme.primary}` : 'text-gray-600'}`}>
                  {p === 'google' ? t.providerGoogle : t.providerCustom}
                </div>
              </button>
            ))}
          </div>

          {settings.apiProvider === 'custom' && (
            <div className={`p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4`}>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">{t.customApiUrl}</label>
                <input 
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={settings.customApiUrl || ''}
                  onChange={(e) => onUpdate({ ...settings, customApiUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">{t.customApiKey}</label>
                <input 
                  type="password"
                  placeholder="sk-..."
                  value={settings.customApiKey || ''}
                  onChange={(e) => onUpdate({ ...settings, customApiKey: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">{t.customModel}</label>
                <input 
                  type="text"
                  placeholder="gpt-4o"
                  value={settings.customModelName || ''}
                  onChange={(e) => onUpdate({ ...settings, customModelName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* Voice AI Provider Settings */}
        <section className="space-y-6 pt-8 border-t border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <i className={`fas fa-volume-up text-${theme.primary}`}></i> {t.voiceProvider}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {(['google', 'custom'] as ApiProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ ...settings, voiceProvider: p })}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  settings.voiceProvider === p 
                    ? `border-${theme.primary} bg-${theme.bg}/50` 
                    : 'border-gray-100 bg-white opacity-60'
                }`}
              >
                <div className={`font-bold ${settings.voiceProvider === p ? `text-${theme.primary}` : 'text-gray-600'}`}>
                  {p === 'google' ? t.providerGoogle : t.providerCustom}
                </div>
              </button>
            ))}
          </div>

          {settings.voiceProvider === 'custom' && (
            <div className={`p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4`}>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">{t.customApiUrl}</label>
                <input 
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={settings.customTtsUrl || ''}
                  onChange={(e) => onUpdate({ ...settings, customTtsUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">{t.customApiKey}</label>
                <input 
                  type="password"
                  placeholder="sk-..."
                  value={settings.customTtsApiKey || ''}
                  onChange={(e) => onUpdate({ ...settings, customTtsApiKey: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">{t.customTtsModel}</label>
                  <input 
                    type="text"
                    placeholder="tts-1"
                    value={settings.customTtsModel || ''}
                    onChange={(e) => onUpdate({ ...settings, customTtsModel: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">{t.customTtsVoice}</label>
                  <input 
                    type="text"
                    placeholder="alloy"
                    value={settings.customTtsVoice || ''}
                    onChange={(e) => onUpdate({ ...settings, customTtsVoice: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-sky-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Safety & Time Limits */}
        <section className="space-y-6 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <h3 className="font-bold text-gray-700">{t.internetSearch}</h3>
              <p className="text-sm text-gray-500">{t.searchDesc}</p>
            </div>
            <button 
              disabled={settings.apiProvider === 'custom'}
              onClick={() => onUpdate({ ...settings, searchEnabled: !settings.searchEnabled })}
              className={`w-14 h-8 rounded-full relative transition-colors ${settings.searchEnabled ? 'bg-green-400' : 'bg-gray-300'} ${settings.apiProvider === 'custom' ? 'opacity-30' : ''}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.searchEnabled ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div>
            <h3 className="font-bold text-gray-700 mb-4">{t.timeLimit}</h3>
            <div className="flex items-center gap-4">
              <input 
                type="range"
                min="15"
                max="120"
                step="15"
                value={settings.timeLimitMinutes}
                onChange={(e) => onUpdate({ ...settings, timeLimitMinutes: parseInt(e.target.value) })}
                className={`flex-1 accent-${theme.primary}`}
              />
              <span className={`font-bold text-${theme.primary} min-w-[80px] text-right`}>{settings.timeLimitMinutes} {t.mins}</span>
            </div>
          </div>
        </section>

        {/* History Management */}
        <section className="space-y-4 pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <i className={`fas fa-history text-${theme.primary}`}></i> {t.records}
            </h3>
            
            <div className="flex items-center gap-2">
              {showConfirmClear ? (
                <div className="flex items-center gap-3 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                  <span className="text-xs text-red-600 font-bold uppercase tracking-tight">Clear?</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { onClearHistory(); setShowConfirmClear(false); }} 
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-bold shadow-sm"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setShowConfirmClear(false)} 
                      className="text-xs bg-white text-gray-500 px-3 py-1 rounded-lg font-bold border border-gray-200"
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                history.length > 0 && (
                  <button 
                    onClick={() => setShowConfirmClear(true)}
                    className="text-sm text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <i className="fas fa-trash-can text-xs"></i>
                    {t.clearHistory}
                  </button>
                )
              )}
            </div>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <i className="fas fa-ghost text-gray-200 text-4xl mb-3"></i>
                <p className="text-gray-400 font-medium">Empty.</p>
              </div>
            ) : (
              history.map((msg, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all ${
                  msg.role === 'user' ? `bg-${theme.bg}/50 border-${theme.secondary}` : 'bg-white border-gray-100'
                }`}>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold mb-2">
                    <span className={`flex items-center gap-1.5 ${msg.role === 'user' ? `text-${theme.primary}` : 'text-purple-600'}`}>
                      {msg.role === 'user' ? 'Child' : getCharacterName(msg.characterId)}
                    </span>
                    <span className="text-gray-400 font-medium">
                      {new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm text-${theme.text} leading-relaxed font-medium opacity-90`}>{msg.content}</p>
                </div>
              )).reverse()
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
