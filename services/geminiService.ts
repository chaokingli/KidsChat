
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_SAFETY_RULES } from "../constants";
import { AppLanguage, AppTheme } from "../types";

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

/**
 * Generates an image based on a text prompt.
 * Uses the gemini-2.5-flash-image model.
 */
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
          aspectRatio: "1:1", // Default to square images for consistency
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


export const getEncyclopediaAnswer = async (query: string, characterPrompt: string, useSearch: boolean, lang: AppLanguage, theme: AppTheme) => {
  const tools = useSearch ? [{ googleSearch: {} }] : [];
  const languageContext = `IMPORTANT: You must respond in ${getLanguageName(lang)}. You are speaking to an 8-year-old child.`;
  
  const isImageRequest = (q: string) => {
    const lowerQuery = q.toLowerCase();
    return lowerQuery.includes('show me a picture of') ||
           lowerQuery.includes('show a picture of') ||
           lowerQuery.includes('draw a picture of') ||
           lowerQuery.includes('can you draw') ||
           lowerQuery.includes('image of') ||
           lowerQuery.includes('picture of');
  };

  let assistantText = '';
  let generatedImageUrl: string | undefined;
  let sources: any[] = [];

  if (isImageRequest(query)) {
    // Extract the part of the query that describes the image
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
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          systemInstruction: `${SYSTEM_SAFETY_RULES}\n${languageContext}\n${characterPrompt}`,
          tools: tools as any
        }
      });
      assistantText = response.text || "Oh oh! I couldn't find that out right now.";
      sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } catch (err) {
      console.error("Text generation failed", err);
      assistantText = "Oh oh! I couldn't find that out right now.";
    }
  }

  return {
    text: assistantText,
    imageUrl: generatedImageUrl,
    sources: sources
  };
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
