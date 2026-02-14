
import React, { useState, useEffect } from 'react';
import { Character, Settings, Message, AppLanguage, AppTheme } from './types';
import { DEFAULT_CHARACTERS, THEME_CONFIG } from './constants';
import { CharacterSelector } from './components/CharacterSelector';
import { ParentalPortal } from './components/ParentalPortal';
import { MagicChat } from './components/MagicChat';
import { UI_TRANSLATIONS, LANGUAGE_LABELS } from './locales';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'characters' | 'parents'>('chat');
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('magic_encyclopedia_characters');
    if (saved) return JSON.parse(saved);
    return DEFAULT_CHARACTERS;
  });
  const [selectedCharId, setSelectedCharId] = useState(() => {
    const saved = localStorage.getItem('magic_encyclopedia_selected_char');
    return saved || DEFAULT_CHARACTERS[0].id;
  });
  
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('magic_encyclopedia_settings');
    if (saved) return JSON.parse(saved);
    return {
      searchEnabled: true,
      safeSearchStrict: true,
      timeLimitMinutes: 60,
      remainingTime: 60,
      language: 'en',
      theme: 'neutral'
    };
  });

  const [history, setHistory] = useState<Message[]>(() => {
    const saved = localStorage.getItem('magic_encyclopedia_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('magic_encyclopedia_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('magic_encyclopedia_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('magic_encyclopedia_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('magic_encyclopedia_selected_char', selectedCharId);
  }, [selectedCharId]);

  const selectedChar = characters.find(c => c.id === selectedCharId) || characters[0];
  const t = UI_TRANSLATIONS[settings.language];
  const theme = THEME_CONFIG[settings.theme];

  useEffect(() => {
    const timer = setInterval(() => {
      setSettings(prev => ({
        ...prev,
        remainingTime: Math.max(0, prev.remainingTime - 1)
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAddCharacter = (char: Character) => {
    setCharacters(prev => [...prev, char]);
    setSelectedCharId(char.id);
    setActiveTab('chat');
  };

  const handleUpdateCharacter = (updatedChar: Character) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const handleDeleteCharacter = (id: string) => {
    if (characters.length <= 1) return;
    setCharacters(prev => prev.filter(c => c.id !== id));
    if (selectedCharId === id) {
      setSelectedCharId(characters.find(c => c.id !== id)?.id || '');
    }
  };

  const handleAddMessage = (msg: Message) => {
    setHistory(prev => [...prev, msg]);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('magic_encyclopedia_history');
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-6xl mx-auto shadow-2xl transition-colors duration-500 bg-${theme.bg}`}>
      <header className={`p-4 bg-${theme.header} border-b border-${theme.secondary} flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-${theme.accent} rounded-2xl flex items-center justify-center shadow-md rotate-3`}>
            <i className={`fas fa-book-open text-white text-2xl`}></i>
          </div>
          <div className="hidden sm:block">
            <h1 className={`text-xl font-black text-${theme.text} leading-none`}>Magic</h1>
            <p className={`text-xs font-bold text-${theme.primary} uppercase tracking-widest`}>Encyclopedia</p>
          </div>
        </div>

        <nav className={`flex bg-${theme.secondary} p-1.5 rounded-2xl gap-1`}>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'chat' ? `bg-white text-${theme.primary} shadow-sm` : `text-${theme.primary} opacity-60 hover:opacity-100`
            }`}
          >
            <i className="fas fa-message sm:mr-2"></i> <span className="hidden sm:inline">{t.chat}</span>
          </button>
          <button 
            onClick={() => setActiveTab('characters')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'characters' ? `bg-white text-${theme.primary} shadow-sm` : `text-${theme.primary} opacity-60 hover:opacity-100`
            }`}
          >
            <i className="fas fa-paw sm:mr-2"></i> <span className="hidden sm:inline">{t.friends}</span>
          </button>
          <button 
            onClick={() => setActiveTab('parents')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'parents' ? `bg-white text-${theme.primary} shadow-sm` : `text-${theme.primary} opacity-60 hover:opacity-100`
            }`}
          >
            <i className="fas fa-shield-halved sm:mr-2"></i> <span className="hidden sm:inline">{t.parents}</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
           <div className={`bg-${theme.secondary} px-3 py-1.5 rounded-full flex items-center gap-2 text-${theme.primary} font-bold text-xs`}>
              <i className="fas fa-globe"></i>
              {LANGUAGE_LABELS[settings.language]}
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full transition-all duration-300 ${activeTab === 'chat' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute inset-0'}`}>
          <div className="p-4 h-full">
            <MagicChat 
              character={selectedChar} 
              settings={settings} 
              history={history.filter(m => m.characterId === selectedCharId)}
              onAddMessage={handleAddMessage}
            />
          </div>
        </div>

        <div className={`h-full transition-all duration-300 ${activeTab === 'characters' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute inset-0'}`}>
          <div className="h-full overflow-y-auto">
            <CharacterSelector 
              characters={characters} 
              selectedId={selectedCharId} 
              onSelect={setSelectedCharId} 
              onAdd={handleAddCharacter}
              onUpdate={handleUpdateCharacter}
              onDelete={handleDeleteCharacter}
              lang={settings.language}
              theme={settings.theme}
            />
          </div>
        </div>

        <div className={`h-full transition-all duration-300 ${activeTab === 'parents' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'}`}>
          <div className="h-full overflow-y-auto">
            <ParentalPortal 
              settings={settings} 
              onUpdate={setSettings} 
              history={history}
              characters={characters}
              onClearHistory={clearHistory}
              lang={settings.language}
            />
          </div>
        </div>
      </main>

      <footer className={`h-1 bg-gradient-to-r from-${theme.primary} via-${theme.accent} to-green-400`}></footer>
    </div>
  );
};

export default App;
