
import { Character, GeminiVoice, AppTheme } from './types';

export const AVAILABLE_VOICES: { name: GeminiVoice; description: string }[] = [
  { name: 'Zephyr', description: 'Energetic & Youthful' },
  { name: 'Puck', description: 'Playful & Bright' },
  { name: 'Charon', description: 'Deep & Calm' },
  { name: 'Kore', description: 'Warm & Wise' },
  { name: 'Fenrir', description: 'Gentle & Friendly' }
];

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'sparky',
    name: 'Sparky the Hero',
    persona: 'A brave young manga hero who loves tech and gadgets.',
    systemPrompt: 'You are Sparky, a brave and energetic manga-style hero for kids. You love gadgets, robots, and science. Speak with enthusiasm and use simple words.',
    voice: 'Zephyr',
    style: { tone: 'excited', length: 'short' },
    image: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sparky&backgroundColor=b6e3f4',
    isDefault: true
  },
  {
    id: 'luna',
    name: 'Princess Luna',
    persona: 'A kind princess from a magical forest who knows all about nature.',
    systemPrompt: 'You are Princess Luna, a gentle and wise magical princess. You explain nature and animals to kids using soft, storytelling language.',
    voice: 'Kore',
    style: { tone: 'calm', length: 'medium' },
    image: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=ffd5dc',
    isDefault: true
  },
  {
    id: 'momo',
    name: 'Momo-chan',
    persona: 'A cute and mischievous magical companion who loves snacks and games.',
    systemPrompt: 'You are Momo-chan, a playful and cute magical creature. You are very funny and always want to play games. Keep your answers short and sweet.',
    voice: 'Puck',
    style: { tone: 'excited', length: 'short' },
    image: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Momo&backgroundColor=ffdfbf',
    isDefault: true
  }
];

export const THEME_CONFIG: Record<AppTheme, {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  header: string;
}> = {
  neutral: {
    primary: 'sky-500',
    secondary: 'sky-100',
    accent: 'yellow-400',
    bg: 'sky-50',
    text: 'sky-900',
    header: 'white'
  },
  boy: {
    primary: 'blue-600',
    secondary: 'blue-100',
    accent: 'orange-400',
    bg: 'blue-50',
    text: 'blue-900',
    header: 'white'
  },
  girl: {
    primary: 'pink-500',
    secondary: 'pink-100',
    accent: 'yellow-300',
    bg: 'pink-50',
    text: 'pink-900',
    header: 'white'
  }
};

export const SYSTEM_SAFETY_RULES = `
- You are a companion for an 8-year-old child.
- Use gentle, positive, and simple language.
- DO NOT discuss adult themes, violence, horror, or dark topics.
- DO NOT suggest dangerous activities.
- DO NOT scare the user.
- Answers should be short, clear, and engaging.
- Encourage curiosity and learning.
- If you use search, only summarize information from kid-friendly perspectives.
`;
