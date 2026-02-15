
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_SAFETY_RULES } from "../constants";
import { AppLanguage, Settings } from "../types";

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

export const generateImage = async (prompt: string): Promise<string | undefined> => {
  const modelToUse = 'gemini-2.5-flash-image'; 

  try {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (err) {
    console.error("Image generation failed", err);
    return undefined;
  }
};

const callCustomApi = async (query: string, systemPrompt: string, settings: Settings) => {
  if (!settings.customApiUrl || !settings.customApiKey) {
    throw new Error("Custom API settings incomplete");
  }

  const response = await fetch(`${settings.customApiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.customApiKey}`
    },
    body: JSON.stringify({
      model: settings.customModelName || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Custom API error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const getEncyclopediaAnswer = async (query: string, characterPrompt: string, settings: Settings) => {
  const lang = settings.language;
  const useSearch = settings.searchEnabled;
  const languageContext = `IMPORTANT: You must respond in ${getLanguageName(lang)}. You are speaking to an 8-year-old child.`;
  const fullSystemPrompt = `${SYSTEM_SAFETY_RULES}\n${languageContext}\n${characterPrompt}`;
  
  const isImageRequest = (q: string) => {
    const lowerQuery = q.toLowerCase();
    const keywords = ['show me a picture of', 'show a picture of', 'draw a picture of', 'can you draw', 'image of', 'picture of'];
    return keywords.some(k => lowerQuery.includes(k));
  };

  let assistantText = '';
  let generatedImageUrl: string | undefined;
  let sources: any[] = [];

  if (isImageRequest(query)) {
    const imagePromptMatch = query.match(/(?:show me a picture of|show a picture of|draw a picture of|can you draw|image of|picture of)\s*(.*)/i);
    const imagePrompt = imagePromptMatch && imagePromptMatch[1] ? imagePromptMatch[1].trim() : query.replace(/show me a|show a|draw a|can you|image|picture/i, '').trim();

    if (imagePrompt) {
      assistantText = `Okay! Here is an image of "${imagePrompt}"!`;
      generatedImageUrl = await generateImage(imagePrompt);
      if (!generatedImageUrl) {
        assistantText = `I tried to create an image of "${imagePrompt}", but something went wrong. Could you try a different request?`;
      }
    } else {
      assistantText = "I can show you a picture! What would you like it to be of?";
    }
  } else {
    try {
      if (settings.apiProvider === 'custom') {
        assistantText = await callCustomApi(query, fullSystemPrompt, settings);
      } else {
        const tools = useSearch ? [{ googleSearch: {} }] : [];
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: query,
          config: {
            systemInstruction: fullSystemPrompt,
            tools: tools as any
          }
        });
        assistantText = response.text || "Oh oh! I couldn't find that out right now.";
        sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      }
    } catch (err) {
      console.error("Text generation failed", err);
      assistantText = "Oh oh! My magic brain is a bit tired. Can you ask again in a moment?";
    }
  }

  return {
    text: assistantText,
    imageUrl: generatedImageUrl,
    sources: sources
  };
};

/**
 * Generates speech. Supports Gemini (PCM) or OpenAI-compatible (Standard File) providers.
 */
export const generateTTS = async (text: string, voiceName: string, settings: Settings): Promise<{ data: string | ArrayBuffer; type: 'pcm' | 'file' } | undefined> => {
  const lang = settings.language;
  const langName = getLanguageName(lang);

  if (settings.voiceProvider === 'custom') {
    if (!settings.customTtsUrl || !settings.customTtsApiKey) {
      console.warn("Custom TTS settings missing");
      return undefined;
    }

    try {
      const response = await fetch(`${settings.customTtsUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.customTtsApiKey}`
        },
        body: JSON.stringify({
          model: settings.customTtsModel || 'tts-1',
          input: text,
          voice: settings.customTtsVoice || 'alloy',
        })
      });

      if (!response.ok) throw new Error("Custom TTS API failed");
      const buffer = await response.arrayBuffer();
      return { data: buffer, type: 'file' };
    } catch (err) {
      console.error("Custom TTS generation failed", err);
      return undefined;
    }
  }

  // Default: Gemini
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        systemInstruction: `You are a high-quality multilingual speech engine for children. 
        Please read the text provided in ${langName}. 
        The audience is an 8-year-old child, so speak clearly, warmly, and naturally.
        Respect the linguistic nuances of ${langName} while keeping the character's energy level consistent with the chosen voice: ${voiceName}.`,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    const b64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return b64 ? { data: b64, type: 'pcm' } : undefined;
  } catch (err) {
    console.error("Gemini TTS generation failed", err);
    return undefined;
  }
};
