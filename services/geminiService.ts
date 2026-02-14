
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_SAFETY_RULES } from "../constants";
import { AppLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getLanguageName = (lang: AppLanguage) => {
  const names: Record<AppLanguage, string> = {
    en: 'English',
    de: 'German',
    zh: 'Chinese',
    ja: 'Japanese',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian'
  };
  return names[lang];
};

export const checkContentSafety = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform an 8-year-old child safety check on the following character description or message. 
      Flag any NSFW, violence, horror, or inappropriate themes. 
      Reply ONLY with a JSON object: {"safe": boolean, "reason": "string|null"}
      
      Content: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["safe"]
        }
      }
    });
    
    return JSON.parse(response.text || '{"safe": false, "reason": "Parsing error"}');
  } catch (err) {
    console.error("Safety check failed", err);
    return { safe: false, reason: "Service error" };
  }
};

export const getEncyclopediaAnswer = async (query: string, characterPrompt: string, useSearch: boolean, lang: AppLanguage) => {
  const tools = useSearch ? [{ googleSearch: {} }] : [];
  const languageContext = `IMPORTANT: You must respond in ${getLanguageName(lang)}. You are speaking to an 8-year-old child.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `${SYSTEM_SAFETY_RULES}\n${languageContext}\n${characterPrompt}`,
        tools: tools as any
      }
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err) {
    console.error("Query failed", err);
    return { text: "Oh oh! I couldn't find that out right now.", sources: [] };
  }
};

/**
 * Generates speech using the Gemini TTS model.
 * It uses a system instruction to ensure the speech is natural for the target language 
 * and maintains a child-friendly persona.
 */
export const generateTTS = async (text: string, voiceName: string, lang: AppLanguage = 'en'): Promise<string | undefined> => {
  const langName = getLanguageName(lang);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        // We use system instruction to guide the TTS model's performance beyond just the text.
        systemInstruction: `You are a high-quality multilingual speech engine for children. 
        Please read the text provided in ${langName}. 
        The audience is an 8-year-old child, so speak clearly, warmly, and naturally.
        Respect the linguistic nuances of ${langName} while keeping the character's energy level consistent with the chosen voice: ${voiceName}.`,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // These voices (Zephyr, Puck, etc.) are cross-lingual and will adapt to the language specified in the prompt/instruction.
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (err) {
    console.error("TTS generation failed", err);
    return undefined;
  }
};
