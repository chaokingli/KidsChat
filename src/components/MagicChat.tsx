
import React, { useState, useEffect, useRef } from 'react';
import { Character, Message, Settings } from '../types';
import { getEncyclopediaAnswer, generateTTS } from '../services/geminiService';
import { decodeBase64, decodeAudioData, decodeStandardAudio } from '../services/audioUtils';
import { UI_TRANSLATIONS } from '../locales';
import { THEME_CONFIG } from '../constants';

interface Props {
  character: Character;
  settings: Settings;
  history: Message[];
  onAddMessage: (msg: Message) => void;
  showHistoryButton?: boolean;
}

export const MagicChat: React.FC<Props> = ({ character, settings, history, onAddMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = UI_TRANSLATIONS[settings.language];
  const theme = THEME_CONFIG[settings.theme];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping, isGeneratingImage]);

  const stopCurrentAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playTTS = async (text: string) => {
    stopCurrentAudio();
    const result = await generateTTS(text, character.voice, settings);
    if (!result) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;

    try {
      let audioBuffer: AudioBuffer;
      if (result.type === 'pcm') {
        audioBuffer = await decodeAudioData(decodeBase64(result.data as string), ctx, 24000, 1);
      } else {
        audioBuffer = await decodeStandardAudio(result.data as ArrayBuffer, ctx);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsSpeaking(false);
        currentSourceRef.current = null;
      };
      currentSourceRef.current = source;
      setIsSpeaking(true);
      source.start();
    } catch (err) {
      console.error("Audio playback error", err);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = text || inputValue;
    if (!content.trim()) return;

    stopCurrentAudio();

    const userMsg: Message = { 
      role: 'user', 
      content, 
      timestamp: Date.now(),
      characterId: character.id 
    };
    onAddMessage(userMsg);
    setInputValue('');
    setIsTyping(true);
    setIsGeneratingImage(false);

    const imageRequestKeywords = ['show me a picture of', 'draw a picture of', 'image of', 'picture of'];
    const isExplicitImageRequest = imageRequestKeywords.some(keyword => content.toLowerCase().includes(keyword));

    if (isExplicitImageRequest) {
      setIsGeneratingImage(true);
    }

    const response = await getEncyclopediaAnswer(
      content, 
      character.systemPrompt, 
      settings
    );

    const responseText = response.text || "I'm sorry, I couldn't find an answer to that.";
    const aiMsg: Message = { 
      role: 'assistant', 
      content: responseText, 
      timestamp: Date.now(),
      characterId: character.id,
      imageUrl: response.imageUrl
    };
    onAddMessage(aiMsg);
    setIsTyping(false);
    setIsGeneratingImage(false);
    
    playTTS(responseText);
  };

  const simulateVoiceInput = () => {
    if (isListening) return;
    setIsListening(true);
    const defaultQueries: any = {
      en: "Why is the sky blue?",
      de: "Warum ist der Himmel blau?",
      zh: "天空为什么是蓝色的？",
      ja: "空はなぜ青いの？",
      fr: "Pourquoi le ciel est-il bleu ?",
      es: "¿Por qué el cielo es azul?",
      it: "Perché il cielo è blu?"
    };
    setTimeout(() => {
      setIsListening(false);
      handleSend(defaultQueries[settings.language] || "Hello!");
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto overflow-hidden">
      {/* Chat Header */}
      <div className={`flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur p-3 sm:p-4 rounded-3xl shadow-sm mb-2 sm:mb-4 border border-${theme.secondary} flex-shrink-0 w-full`}>
        {/* Placeholder for the History Toggle on portrait/mobile landscape only */}
        <div className="md:landscape:hidden lg:hidden w-10 sm:w-12 h-10 flex-shrink-0" />
        
        <div className="relative flex-shrink-0 ml-auto md:landscape:ml-0 lg:ml-0">
          <img src={character.image} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full ring-2 ring-${theme.primary} bg-white shadow-sm`} alt={character.name} />
          {isSpeaking && (
            <div className={`absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white`}>
              <span className="flex gap-0.5">
                <span className="w-0.5 h-1.5 sm:w-1 sm:h-2 bg-white rounded-full animate-pulse"></span>
                <span className="w-0.5 h-2 sm:w-1 sm:h-3 bg-white rounded-full animate-pulse [animation-delay:0.2s]"></span>
                <span className="w-0.5 h-1.5 sm:w-1 sm:h-2 bg-white rounded-full animate-pulse [animation-delay:0.4s]"></span>
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 mr-auto md:landscape:mr-0 lg:mr-0">
          <h3 className={`font-bold text-${theme.text} truncate text-sm sm:text-base`}>{character.name}</h3>
          <p className={`text-[10px] sm:text-xs text-${theme.primary} font-medium truncate opacity-70`}>{isSpeaking ? t.speaking : t.ready}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isSpeaking && (
            <button 
              onClick={stopCurrentAudio}
              className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 transition-colors"
              title="Stop"
            >
              <i className="fas fa-volume-xmark text-sm sm:text-base"></i>
            </button>
          )}
          <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-${theme.secondary} rounded-full flex-shrink-0`}>
            <i className={`fas fa-clock text-${theme.primary} opacity-60 text-xs sm:text-sm`}></i>
            <span className={`font-bold text-${theme.primary} text-xs sm:text-sm`}>{settings.remainingTime}{t.mins}</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 px-1 sm:px-4 lg:px-8 pb-4 scrollbar-hide w-full"
      >
        <div className="max-w-5xl mx-auto w-full space-y-3 sm:space-y-4">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 sm:space-y-4">
               <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-${theme.secondary} rounded-full flex items-center justify-center bubble-anim`}>
                  <i className={`fas fa-magic text-4xl sm:text-5xl text-${theme.primary} opacity-40`}></i>
               </div>
               <div>
                  <h2 className={`text-lg sm:text-xl font-bold text-${theme.text}`}>{t.hi}</h2>
                  <p className={`text-sm sm:text-base text-${theme.primary}`}>{t.intro(character.name)}</p>
               </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-sm break-words ${
                msg.role === 'user' 
                  ? `bg-${theme.primary} text-white rounded-br-none` 
                  : 'bg-white text-gray-800 rounded-bl-none border-b-2 border-gray-100 shadow-sm'
              }`}>
                <p className="text-sm sm:text-base leading-relaxed font-medium">{msg.content}</p>
                {msg.imageUrl && (
                  <div className="mt-2 sm:mt-3 rounded-xl overflow-hidden shadow-md border border-gray-100 bg-gray-50">
                    <img src={msg.imageUrl} alt="Generated content" className="w-full h-auto object-cover max-h-64 sm:max-h-96" />
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => playTTS(msg.content)}
                    className={`absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-${theme.primary} hidden sm:block`}
                  >
                    <i className="fas fa-volume-up"></i>
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border-b-2 border-gray-100 flex gap-1">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 bg-${theme.primary} opacity-20 rounded-full animate-bounce`}></span>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 bg-${theme.primary} opacity-40 rounded-full animate-bounce [animation-delay:0.2s]`}></span>
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 bg-${theme.primary} opacity-60 rounded-full animate-bounce [animation-delay:0.4s]`}></span>
              </div>
            </div>
          )}

          {isGeneratingImage && (
            <div className="flex justify-start">
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border-b-2 border-gray-100 flex items-center gap-3">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 border-2 border-dashed border-${theme.primary} rounded-full animate-spin`}></div>
                <span className="text-xs sm:text-sm text-gray-600 font-bold uppercase tracking-wider">Magic Drawing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="relative pt-2 pb-2 sm:pb-4 px-1 flex-shrink-0 w-full">
        <div className="max-w-5xl mx-auto w-full relative">
          {isListening && (
            <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-${theme.primary} text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-lg animate-pulse text-xs sm:text-sm z-30 font-bold`}>
              Listening... 👂
            </div>
          )}
          
          <div className={`bg-white rounded-full shadow-xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 ring-2 sm:ring-4 ring-${theme.secondary}`}>
            <button 
              onClick={simulateVoiceInput}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                isListening ? 'bg-red-500 animate-pulse' : `bg-${theme.primary} hover:opacity-90 active:scale-95`
              } text-white shadow-lg`}
            >
              <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-lines'} text-lg sm:text-xl`}></i>
            </button>
            
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.typePlaceholder}
              className={`flex-1 bg-transparent border-none outline-none px-2 sm:px-4 font-bold text-sm sm:text-lg placeholder:text-gray-300 text-${theme.text} min-w-0`}
            />
            
            <button 
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping || isGeneratingImage}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-${theme.secondary} text-${theme.primary} rounded-full hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center active:scale-95 shadow-inner`}
            >
              {isTyping || isGeneratingImage ? <i className="fas fa-spinner fa-spin text-sm sm:text-base"></i> : <i className="fas fa-paper-plane text-sm sm:text-base"></i>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
