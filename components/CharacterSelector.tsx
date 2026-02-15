
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
  // Pass the full settings object for accurate voice previewing
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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className={`text-2xl font-bold text-${theme.text} mb-6 flex items-center gap-2`}>
        <i className="fas fa-users"></i> {t.chooseFriend}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {characters.map(char => (
          <div key={char.id} className="relative group">
            <button
              onClick={() => onSelect(char.id)}
              className={`w-full relative p-4 rounded-3xl transition-all ${
                selectedId === char.id 
                  ? `bg-${theme.primary} text-white shadow-lg ring-4 ring-${theme.secondary} scale-105` 
                  : 'bg-white hover:bg-opacity-50 shadow-md border-2 border-transparent'
              }`}
            >
              <img 
                src={char.image} 
                alt={char.name}
                className="w-full aspect-square rounded-2xl object-cover mb-3"
              />
              <p className="font-semibold text-center truncate">{char.name}</p>
              <div className={`text-[10px] bg-${theme.secondary} text-${theme.primary} rounded-full px-2 py-0.5 mt-1 mx-auto w-fit font-bold uppercase`}>
                {char.voice}
              </div>
              {selectedId === char.id && (
                <div className={`absolute -top-2 -right-2 bg-${theme.accent} w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white`}>
                  <i className="fas fa-check"></i>
                </div>
              )}
            </button>
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button 
                onClick={(e) => openEdit(e, char)}
                className={`w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-${theme.primary} hover:opacity-80`}
                title="Edit Friend"
              >
                <i className="fas fa-pencil text-xs"></i>
              </button>
              {!char.isDefault && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(char.id); }}
                  className="w-8 h-8 bg-red-500/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-white hover:bg-red-600"
                  title="Remove Friend"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className={`p-4 rounded-3xl bg-white border-2 border-dashed border-${theme.primary} opacity-40 hover:opacity-100 hover:bg-white transition-all flex flex-col items-center justify-center text-${theme.primary} gap-2 min-h-[180px]`}
        >
          <div className={`w-12 h-12 rounded-full bg-${theme.secondary} flex items-center justify-center`}>
            <i className="fas fa-plus text-xl"></i>
          </div>
          <p className="font-medium">{t.newFriend}</p>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className={`text-xl font-bold text-${theme.text} mb-4`}>
              {editingChar ? `Edit ${editingChar.name}` : t.createFriend}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t.name}</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border-2 border-${theme.secondary} focus:border-${theme.primary} outline-none`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t.whoAreThey}</label>
                <textarea 
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border-2 border-${theme.secondary} focus:border-${theme.primary} outline-none min-h-[80px]`}
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`text-xs font-bold text-${theme.primary} hover:opacity-70 flex items-center gap-1 uppercase tracking-wider`}
                >
                  {showAdvanced ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
                  Advanced Settings
                </button>
                
                {showAdvanced && (
                  <div className={`mt-3 bg-${theme.bg} p-4 rounded-2xl border border-${theme.secondary}`}>
                    <label className={`block text-xs font-bold text-${theme.text} mb-2 uppercase`}>Custom Prompt</label>
                    <textarea 
                      value={newSystemPrompt}
                      onChange={(e) => setNewSystemPrompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none min-h-[100px] text-sm bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t.pickVoice}</label>
                <div className="flex gap-2">
                  <select 
                    value={newVoice}
                    onChange={(e) => setNewVoice(e.target.value as GeminiVoice)}
                    className={`flex-1 px-4 py-2 rounded-xl border-2 border-${theme.secondary} focus:border-${theme.primary} outline-none bg-white font-medium text-${theme.text}`}
                  >
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.description})</option>
                    ))}
                  </select>
                  <button 
                    onClick={handlePreviewVoice}
                    disabled={previewing}
                    className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all ${
                      previewing ? 'bg-gray-100 text-gray-300' : `bg-${theme.primary} text-white`
                    }`}
                  >
                    <i className={`fas ${previewing ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingChar(null); }}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading || !newName || !newPersona}
                  className={`flex-1 py-3 rounded-2xl bg-${theme.primary} text-white font-bold hover:opacity-90 transition-all disabled:opacity-50`}
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : (editingChar ? 'Save Changes' : t.create)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
