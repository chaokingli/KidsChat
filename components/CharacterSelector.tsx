
import React, { useState, useRef, useEffect } from 'react';
import { Character, GeminiVoice, AppLanguage } from '../types';
import { checkContentSafety, generateTTS } from '../services/geminiService';
import { AVAILABLE_VOICES } from '../constants';
import { decodeBase64, decodeAudioData } from '../services/audioUtils';
import { UI_TRANSLATIONS } from '../locales';

interface Props {
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: (char: Character) => void;
  onUpdate: (char: Character) => void;
  onDelete: (id: string) => void;
  lang: AppLanguage;
}

export const CharacterSelector: React.FC<Props> = ({ characters, selectedId, onSelect, onAdd, onUpdate, onDelete, lang }) => {
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

  // Automatically update the system prompt recommendation as they type persona (only if not manually edited)
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
      const base64Audio = await generateTTS(text, newVoice, lang);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
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

    const contentToWash = `${newPersona} ${newSystemPrompt}`;
    const safety = await checkContentSafety(contentToWash);
    if (!safety.safe) {
      setError(`Safety check failed: ${safety.reason}`);
      setLoading(false);
      return;
    }

    const charData: Character = {
      id: editingChar ? editingChar.id : Date.now().toString(),
      name: newName,
      persona: newPersona,
      systemPrompt: newSystemPrompt || `You are ${newName}. ${newPersona}`,
      voice: newVoice,
      style: editingChar ? editingChar.style : { tone: 'friendly', length: 'medium' },
      image: editingChar ? editingChar.image : `https://picsum.photos/seed/${newName}/400/400`,
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

  const openAdd = () => {
    setEditingChar(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-sky-800 mb-6 flex items-center gap-2">
        <i className="fas fa-users"></i> {t.chooseFriend}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {characters.map(char => (
          <div key={char.id} className="relative group">
            <button
              onClick={() => onSelect(char.id)}
              className={`w-full relative p-4 rounded-3xl transition-all ${
                selectedId === char.id 
                  ? 'bg-sky-400 text-white shadow-lg ring-4 ring-sky-200 scale-105' 
                  : 'bg-white hover:bg-sky-50 shadow-md border-2 border-transparent'
              }`}
            >
              <img 
                src={char.image} 
                alt={char.name}
                className="w-full aspect-square rounded-2xl object-cover mb-3"
              />
              <p className="font-semibold text-center truncate">{char.name}</p>
              <div className="text-[10px] bg-sky-100 text-sky-600 rounded-full px-2 py-0.5 mt-1 mx-auto w-fit font-bold uppercase">
                {char.voice}
              </div>
              {selectedId === char.id && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </button>
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button 
                onClick={(e) => openEdit(e, char)}
                className="w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-sky-500 hover:text-sky-700"
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
          onClick={openAdd}
          className="p-4 rounded-3xl bg-white border-2 border-dashed border-sky-300 hover:border-sky-500 hover:bg-sky-50 transition-colors flex flex-col items-center justify-center text-sky-500 gap-2 min-h-[180px]"
        >
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
            <i className="fas fa-plus text-xl"></i>
          </div>
          <p className="font-medium">{t.newFriend}</p>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-sky-800 mb-4">
              {editingChar ? `Edit ${editingChar.name}` : t.createFriend}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t.name}</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-sky-100 focus:border-sky-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t.whoAreThey}</label>
                <textarea 
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-sky-100 focus:border-sky-400 outline-none min-h-[80px]"
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-sky-500 hover:text-sky-700 flex items-center gap-1 uppercase tracking-wider"
                >
                  {showAdvanced ? <i className="fas fa-chevron-up"></i> : <i className="fas fa-chevron-down"></i>}
                  Advanced Settings
                </button>
                
                {showAdvanced && (
                  <div className="mt-3 bg-sky-50 p-4 rounded-2xl border border-sky-100">
                    <label className="block text-xs font-bold text-sky-700 mb-2 uppercase">Custom Prompt</label>
                    <textarea 
                      value={newSystemPrompt}
                      onChange={(e) => setNewSystemPrompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 focus:border-sky-400 outline-none min-h-[100px] text-sm bg-white"
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
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-sky-100 focus:border-sky-400 outline-none bg-white font-medium text-sky-700"
                  >
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.description})</option>
                    ))}
                  </select>
                  <button 
                    onClick={handlePreviewVoice}
                    disabled={previewing}
                    className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all ${
                      previewing ? 'bg-sky-100 text-sky-300' : 'bg-sky-500 text-white hover:bg-sky-600'
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
                  className="flex-1 py-3 rounded-2xl bg-sky-500 text-white font-bold hover:bg-sky-600 transition-colors disabled:opacity-50"
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
