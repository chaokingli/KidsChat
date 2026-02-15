
import React, { useState, useEffect } from 'react';
import { Character, Settings, Message, AppLanguage, AppTheme } from './types';
import { DEFAULT_CHARACTERS, THEME_CONFIG } from './constants';
import { CharacterSelector } from './components/CharacterSelector';
import { ParentalPortal } from './components/ParentalPortal';
import { MagicChat } from './components/MagicChat';
import { UI_TRANSLATIONS, LANGUAGE_LABELS } from './locales';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'characters' | 'parents'>('chat');
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  
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
      theme: 'neutral',
      apiProvider: 'google',
      googleModelName: 'gemini-3-flash-preview',
      googleApiKey: '', 
      customApiUrl: 'https://api.openai.com/v1',
      customApiKey: '',
      customModelName: 'gpt-4o',
      voiceProvider: 'google',
      googleTtsModel: 'gemini-2.5-flash-preview-tts',
      customTtsUrl: 'https://api.openai.com/v1',
      customTtsApiKey: '',
      customTtsModel: 'tts-1',
      customTtsVoice: 'alloy'
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

  const CharacterListSidebar = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex flex-col gap-2 p-4 h-full overflow-y-auto scrollbar-hide`}>
      <h2 className={`text-xs font-black text-${theme.primary} uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-2`}>
        <i className="fas fa-history"></i> {compact ? '' : t.conversations}
      </h2>
      {characters.map((char) => {
        const charHistory = history.filter(m => m.characterId === char.id);
        const lastMsg = charHistory[charHistory.length - 1]?.content;
        
        return (
          <button
            key={char.id}
            onClick={() => {
              setSelectedCharId(char.id);
              setActiveTab('chat');
              setIsHistoryDrawerOpen(false);
            }}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
              selectedCharId === char.id 
                ? `bg-${theme.primary} text-white shadow-lg shadow-${theme.primary}/20 scale-[1.02]` 
                : `bg-white hover:bg-${theme.secondary} text-gray-700`
            }`}
          >
            <img src={char.image} className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white shadow-sm" alt={char.name} />
            {!compact && (
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{char.name}</p>
                {lastMsg && (
                  <p className={`text-[10px] truncate opacity-70`}>{lastMsg}</p>
                )}
              </div>
            )}
            {!compact && selectedCharId === char.id && (
              <div className="w-2 h-2 rounded-full bg-white animate-pulse ml-auto flex-shrink-0"></div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`flex flex-col h-full w-full transition-colors duration-500 bg-${theme.bg} overflow-hidden`}>
      <header className={`p-3 sm:p-4 bg-${theme.header} border-b border-${theme.secondary} flex items-center justify-between shadow-sm z-30 flex-shrink-0`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${theme.accent} rounded-2xl flex items-center justify-center shadow-md rotate-3`}>
            <i className={`fas fa-book-open text-white text-xl sm:text-2xl`}></i>
          </div>
          <div className="hidden xs:block">
            <h1 className={`text-lg sm:text-xl font-black text-${theme.text} leading-none`}>Magic</h1>
            <p className={`text-[10px] sm:text-xs font-bold text-${theme.primary} uppercase tracking-widest`}>Encyclopedia</p>
          </div>
        </div>

        <nav className={`flex bg-${theme.secondary} p-1 rounded-2xl gap-0.5 sm:gap-1`}>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'chat' ? `bg-white text-${theme.primary} shadow-sm` : `text-${theme.primary} opacity-60 hover:opacity-100`
            }`}
          >
            <i className="fas fa-message xs:mr-2"></i> <span className="hidden xs:inline">{t.chat}</span>
          </button>
          <button 
            onClick={() => setActiveTab('characters')}
            className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'characters' ? `bg-white text-${theme.primary} shadow-sm` : `text-${theme.primary} opacity-60 hover:opacity-100`
            }`}
          >
            <i className="fas fa-paw xs:mr-2"></i> <span className="hidden xs:inline">{t.friends}</span>
          </button>
          <button 
            onClick={() => setActiveTab('parents')}
            className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'parents' ? `bg-white text-${theme.primary} shadow-sm` : `text-${theme.primary} opacity-60 hover:opacity-100`
            }`}
          >
            <i className="fas fa-shield-halved xs:mr-2"></i> <span className="hidden xs:inline">{t.parents}</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
           <div className={`bg-${theme.secondary} px-2 sm:px-3 py-1.5 rounded-full flex items-center gap-1 sm:gap-2 text-${theme.primary} font-bold text-[10px] sm:text-xs`}>
              <i className="fas fa-globe"></i>
              <span className="hidden sm:inline">{LANGUAGE_LABELS[settings.language]}</span>
              <span className="sm:hidden">{settings.language.toUpperCase()}</span>
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Landscape Sidebar: Visible on Desktop (any width) and Tablet Landscape (md+) */}
        {activeTab === 'chat' && (
          <aside className="hidden md:landscape:flex lg:flex flex-shrink-0 w-64 xl:w-80 bg-white/40 border-r border-gray-100 overflow-hidden flex-col">
            <CharacterListSidebar />
          </aside>
        )}

        {/* Mobile History Drawer: Portrait or Mobile (sm) */}
        {activeTab === 'chat' && isHistoryDrawerOpen && (
          <>
            <div 
              className="md:landscape:hidden lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsHistoryDrawerOpen(false)}
            />
            <div className="md:landscape:hidden lg:hidden fixed left-0 top-0 bottom-0 w-3/4 max-w-sm bg-white z-50 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">{t.conversations}</h3>
                  <button onClick={() => setIsHistoryDrawerOpen(false)} className="text-gray-400 p-2">
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CharacterListSidebar />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
          <div className={`flex-1 h-full transition-all duration-300 ${activeTab === 'chat' ? 'opacity-100 z-10 translate-y-0' : 'opacity-0 z-0 absolute inset-0 pointer-events-none translate-y-4'}`}>
            <div className="p-2 sm:p-4 h-full relative">
              {/* History Toggle Button: Only in Portrait or Mobile Portrait/Landscape */}
              {activeTab === 'chat' && (
                <button 
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className={`md:landscape:hidden lg:hidden absolute left-4 top-5 sm:top-7 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-${theme.primary} active:scale-90 transition-transform`}
                >
                  <i className="fas fa-folder-open"></i>
                </button>
              )}
              
              <MagicChat 
                character={selectedChar} 
                settings={settings} 
                history={history.filter(m => m.characterId === selectedCharId)}
                onAddMessage={handleAddMessage}
              />
            </div>
          </div>

          <div className={`flex-1 h-full transition-all duration-300 ${activeTab === 'characters' ? 'opacity-100 z-10 translate-y-0' : 'opacity-0 z-0 absolute inset-0 pointer-events-none translate-y-4'}`}>
            <div className="h-full overflow-y-auto scrollbar-hide">
              <CharacterSelector 
                characters={characters} 
                selectedId={selectedCharId} 
                onSelect={setSelectedCharId} 
                onAdd={handleAddCharacter}
                onUpdate={handleUpdateCharacter}
                onDelete={handleDeleteCharacter}
                lang={settings.language}
                theme={settings.theme}
                settings={settings}
              />
            </div>
          </div>

          <div className={`flex-1 h-full transition-all duration-300 ${activeTab === 'parents' ? 'opacity-100 z-10 scale-100 translate-y-0' : 'opacity-0 z-0 absolute inset-0 pointer-events-none scale-95 translate-y-4'}`}>
            <div className="h-full overflow-y-auto scrollbar-hide">
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
        </div>
      </main>

      <footer className={`h-1 bg-gradient-to-r from-${theme.primary} via-${theme.accent} to-green-400 z-30 flex-shrink-0`}></footer>
    </div>
  );
};

export default App;
