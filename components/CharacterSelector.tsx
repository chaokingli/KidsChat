
import React, { useState, useRef, useEffect } from 'react';
import { Character, GeminiVoice, AppLanguage, AppTheme, Settings } from '../types';
import { checkContentSafety, generateTTS } from '../services/geminiService';
import { AVAILABLE_VOICES, THEME_CONFIG } from '../constants';
import { decodeBase64, decodeAudioData, decodeStandardAudio } from '../services/audioUtils';
import { UI_TRANSLATIONS } from '../locales';

interface Props {
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: (char: Character) => void;
  onUpdate: (char: Character) => void;
  onDelete: (id: string) => void;
  lang: AppLanguage;
  theme: AppTheme;
  settings: Settings;
}

export const CharacterSelector: React.FC<Props> = ({ characters, selectedId, onSelect, onAdd, onUpdate, onDelete, lang, theme: appTheme, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [newSystemPrompt, setNewSystemPrompt] = useState('');
  const [newVoice, setNewVoice] = useState<GeminiVoice>('Zephyr');
  
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const t = UI_TRANSLATIONS[lang];
  const theme = THEME_CONFIG[appTheme];

  useEffect(() => {
    if (editingChar) {
      setNewName(editingChar.name);
      setNewPersona(editingChar.persona);
      setNewSystemPrompt(editingChar.systemPrompt);
      setNewVoice(editingChar.voice);
    } else {
      setNewName('');
      setNewPersona('');
      setNewSystemPrompt('');
      setNewVoice('Zephyr');
    }
  }, [editingChar]);

  useEffect(() => {
    if (!showAdvanced && newPersona && newName && !editingChar) {
      setNewSystemPrompt(`You are ${newName}, a friendly companion for an 8-year-old child. ${newPersona}. Always be kind, helpful, and use simple language.`);
    }
  }, [newName, newPersona, showAdvanced, editingChar]);

  const handlePreviewVoice = async () => {
    if (previewing) return;
    setPreviewing(true);
    
    try {
      const text = t.intro(newName || 'Friend');
      const result = await generateTTS(text, newVoice, settings);
      
      if (result) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        let audioBuffer: AudioBuffer;
        if (result.type === 'pcm') {
          audioBuffer = await decodeAudioData(decodeBase64(result.data as string), ctx, 24000, 1);
        } else {
          audioBuffer = await decodeStandardAudio(result.data as ArrayBuffer, ctx);
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => setPreviewing(false);
      } else {
        setPreviewing(false);
      }
    } catch (err) {
      console.error("Voice preview failed", err);
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!newName || !newPersona) return;
    setLoading(true);
    setError('');

    const charData: Character = {
      id: editingChar ? editingChar.id : Date.now().toString(),
      name: newName,
      persona: newPersona,
      systemPrompt: newSystemPrompt || `You are ${newName}. ${newPersona}`,
      voice: newVoice,
      style: editingChar ? editingChar.style : { tone: 'friendly', length: 'medium' },
      image: editingChar ? editingChar.image : `https://api.dicebear.com/adventurer/svg?seed=${newName}&backgroundColor=${appTheme === 'girl' ? 'ffd5dc' : 'b6e3f4'}`,
      isDefault: editingChar?.isDefault,
    };

    if (editingChar) {
      onUpdate(charData);
    } else {
      onAdd(charData);
    }
    
    setIsModalOpen(false);
    setEditingChar(null);
    setLoading(false);
  };

  const openEdit = (e: React.MouseEvent, char: Character) => {
    e.stopPropagation();
    setEditingChar(char);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h2 className={`text-xl sm:text-2xl font-bold text-${theme.text} mb-4 sm:mb-6 flex items-center gap-2`}>
        <i className="fas fa-users"></i> {t.chooseFriend}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {characters.map(char => (
          <div key={char.id} className="relative group">
            <button
              onClick={() => onSelect(char.id)}
              className={`w-full relative p-3 sm:p-4 rounded-3xl transition-all h-full flex flex-col ${
                selectedId === char.id 
                  ? `bg-${theme.primary} text-white shadow-lg ring-2 sm:ring-4 ring-${theme.secondary} scale-[1.02] sm:scale-105` 
                  : 'bg-white hover:bg-opacity-50 shadow-md border-2 border-transparent'
              }`}
            >
              <img 
                src={char.image} 
                alt={char.name}
                className="w-full aspect-square rounded-2xl object-cover mb-2 sm:mb-3"
              />
              <p className="font-bold text-center truncate text-sm sm:text-base w-full">{char.name}</p>
              <div className={`text-[8px] sm:text-[10px] bg-${theme.secondary} text-${theme.primary} rounded-full px-2 py-0.5 mt-1 mx-auto w-fit font-bold uppercase`}>
                {char.voice}
              </div>
              {selectedId === char.id && (
                <div className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-${theme.accent} w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm`}>
                  <i className="fas fa-check text-[10px] sm:text-xs"></i>
                </div>
              )}
            </button>
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
              <button 
                onClick={(e) => openEdit(e, char)}
                className={`w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-${theme.primary} hover:opacity-80`}
                title="Edit Friend"
              >
                <i className="fas fa-pencil text-[10px] sm:text-xs"></i>
              </button>
              {!char.isDefault && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(char.id); }}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-white hover:bg-red-600"
                  title="Remove Friend"
                >
                  <i className="fas fa-trash text-[10px] sm:text-xs"></i>
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className={`p-4 rounded-3xl bg-white/50 border-2 border-dashed border-${theme.primary} hover:border-solid hover:bg-white transition-all flex flex-col items-center justify-center text-${theme.primary} gap-2 min-h-[160px] sm:min-h-[180px]`}
        >
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${theme.secondary} flex items-center justify-center shadow-inner`}>
            <i className="fas fa-plus text-lg sm:text-xl"></i>
          </div>
          <p className="font-bold text-sm sm:text-base">{t.newFriend}</p>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[95vh] scrollbar-hide">
            <h3 className={`text-lg sm:text-xl font-bold text-${theme.text} mb-4`}>
              {editingChar ? `Edit ${editingChar.name}` : t.createFriend}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.name}</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 border-${theme.secondary} focus:border-${theme.primary} outline-none font-medium`}
                  placeholder="e.g. Robo-Buddy"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.whoAreThey}</label>
                <textarea 
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 border-${theme.secondary} focus:border-${theme.primary} outline-none min-h-[80px] font-medium text-sm`}
                  placeholder="Describe your friend's personality..."
                />
              </div>
              
              <div className="pt-1">
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`text-[10px] sm:text-xs font-black text-${theme.primary} hover:opacity-70 flex items-center gap-1 uppercase tracking-widest`}
                >
                  {showAdvanced ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
                  Advanced Settings
                </button>
                
                {showAdvanced && (
                  <div className={`mt-2 bg-${theme.bg} p-3 sm:p-4 rounded-2xl border border-${theme.secondary}`}>
                    <label className={`block text-[10px] font-black text-${theme.text} mb-2 uppercase tracking-widest`}>Custom AI Prompt</label>
                    <textarea 
                      value={newSystemPrompt}
                      onChange={(e) => setNewSystemPrompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none min-h-[100px] text-xs sm:text-sm bg-white font-medium"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{t.pickVoice}</label>
                <div className="flex gap-2">
                  <select 
                    value={newVoice}
                    onChange={(e) => setNewVoice(e.target.value as GeminiVoice)}
                    className={`flex-1 px-3 sm:px-4 py-2.5 rounded-xl border-2 border-${theme.secondary} focus:border-${theme.primary} outline-none bg-white font-bold text-sm sm:text-base text-${theme.text}`}
                  >
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handlePreviewVoice}
                    disabled={previewing}
                    className={`w-12 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                      previewing ? 'bg-gray-100 text-gray-300' : `bg-${theme.primary} text-white hover:opacity-90 active:scale-95`
                    }`}
                  >
                    <i className={`fas ${previewing ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingChar(null); }}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm sm:text-base hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading || !newName || !newPersona}
                  className={`flex-1 py-3 rounded-2xl bg-${theme.primary} text-white font-bold text-sm sm:text-base shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50`}
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : (editingChar ? 'Save' : t.create)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
