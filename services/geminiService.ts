
import { GoogleGenAI } from "@google/genai";
import { Character, LifestyleData } from "../types.ts";

// Helper to get AI instance on demand using direct API_KEY from process.env
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateNeuralStory = async (character: Partial<Character>, storyPrompt: string, lifestyle?: LifestyleData) => {
  try {
    const ai = getAI();
    const systemInstruction = `You are a Neural-Link Archivist in Night City. Your job is to take fragmented user data and expand it into a "Neural Story" — a rich, cinematic, and gritty cyberpunk backstory. 
    Use the character's Name, Gender, and Lifestyle to ground the story.
    If the user provides specific narrative fragments, weave them into a high-octane 3-paragraph narrative. 
    Use terminology like 'chrome', 'ICE', 'the sprawl', 'flatlined', and 'neural-shunts'.
    Highlight their lifestyle features: ${lifestyle?.efficiency.label} and their struggles with ${lifestyle?.negative.label}.`;

    const prompt = `
    Character Name: ${character.name || 'Unknown'}
    Character Gender: ${character.gender || 'Unknown'}
    Character Lifestyle: ${lifestyle?.name || 'Unknown'}
    
    Narrative Fragments provided by user: "${storyPrompt || 'Generate a standard origin story'}"
    
    CRITICAL: Expand these fragments into a full blown neural history. Make it atmospheric and dangerous.`;

    // Accessing .text property directly instead of text() method.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.9,
        topP: 0.95,
      }
    });

    return response.text || "Connection lost... Signal scrambled. Story data unrecoverable.";
  } catch (error) {
    console.error("Gemini Story Error:", error);
    return `Error: Deep-net link severed. Neural archives corrupted. (${error instanceof Error ? error.message : 'Unknown failure'})`;
  }
};

export const generateImagePrompt = async (character: Partial<Character>, userDescription?: string, lifestyle?: LifestyleData) => {
  try {
    const ai = getAI();
    const baseDescription = userDescription ? `Include these user-specified details: ${userDescription}.` : "";
    const prompt = `Create a professional, highly detailed AI image generation prompt for a cyberpunk character portrait.
    Character Details:
    - Name: ${character.name}
    - Gender: ${character.gender}
    - Lifestyle: ${lifestyle?.name}
    ${baseDescription}

    The final prompt should focus on:
    - High-fidelity facial features and specific cyberware reflecting their ${lifestyle?.name} background.
    - Dramatic neon lighting (e.g., cyan and magenta chiaroscuro).
    - Authentic techwear clothing and urban background.
    - Artistic style: High-end digital art, octane render, 8k resolution.
    
    Return ONLY the final prompt text.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Image Prompt Error:", error);
    return null;
  }
};

export const generatePortrait = async (textPrompt: string) => {
  try {
    const ai = getAI();
    // Correct usage of generateContent for image generation with gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: textPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Iterating through response parts to find image data as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image Gen Error:", error);
  }
  return null;
};
