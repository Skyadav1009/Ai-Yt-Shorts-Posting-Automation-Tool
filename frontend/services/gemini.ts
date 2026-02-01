import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ShortPackage, GeneratorConfig } from "../types";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    idea: { type: Type.STRING },
    script: { type: Type.STRING },
    voiceover: { type: Type.STRING },
    stock_video_keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    subtitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        estimated_duration_seconds: { type: Type.NUMBER },
        category: { type: Type.STRING },
        posting_time_suggestion: { type: Type.STRING }
      },
      required: ["estimated_duration_seconds", "category", "posting_time_suggestion"]
    }
  },
  required: [
    "idea",
    "script",
    "voiceover",
    "stock_video_keywords",
    "subtitles",
    "title",
    "description",
    "hashtags",
    "metadata"
  ]
};

export const generateShortPackage = async (config: GeneratorConfig): Promise<ShortPackage> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Inject user config into the system prompt template
  const systemInstruction = SYSTEM_PROMPT_TEMPLATE
    .replace("{{NICHE}}", config.niche)
    .replace("{{TONE}}", config.tone)
    .replace("{{THEME}}", config.theme);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: "Generate ONE complete YouTube Short package now." }]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8, // Slightly creative but structured
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini");
    }

    const data = JSON.parse(text) as ShortPackage;
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateVideoPreview = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  // Create new instance for every call to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed: No download URI returned.");
    }

    // Fetch the video bytes using the API key
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};