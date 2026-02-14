
export interface CharacterStyle {
  tone: 'friendly' | 'excited' | 'calm' | 'wise';
  length: 'short' | 'medium';
}

export type GeminiVoice = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
export type AppLanguage = 'en' | 'de' | 'zh' | 'ja' | 'fr' | 'es' | 'it';

export interface Character {
  id: string;
  name: string;
  persona: string;
  systemPrompt: string;
  voice: GeminiVoice;
  customVoiceId?: string;
  voiceCloningData?: string;
  style: CharacterStyle;
  image: string;
  isDefault?: boolean;
}

export interface Settings {
  searchEnabled: boolean;
  safeSearchStrict: boolean;
  timeLimitMinutes: number;
  remainingTime: number;
  language: AppLanguage;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  characterId: string;
}
