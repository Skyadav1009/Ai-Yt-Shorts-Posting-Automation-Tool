import { ShortPackage, GeneratorConfig } from "../types";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const generateShortPackage = async (config: GeneratorConfig): Promise<ShortPackage> => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Groq API Key not found in environment variables. Get your free key at https://console.groq.com");
    }

    // Inject user config into the system prompt template
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE
        .replace("{{NICHE}}", config.niche)
        .replace("{{TONE}}", config.tone)
        .replace("{{THEME}}", config.theme);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Generate ONE complete YouTube Short package now. Return ONLY valid JSON." }
                ],
                temperature: 0.8,
                max_tokens: 2048,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No response content received from Groq");
        }

        const parsed = JSON.parse(content) as ShortPackage;
        return parsed;

    } catch (error) {
        console.error("Groq API Error:", error);
        throw error;
    }
};

// Keep this for future use with paid GCP project
export const generateVideoPreview = async (prompt: string): Promise<string> => {
    throw new Error("AI Video generation requires a paid Google Cloud Project. Use Pexels videos instead.");
};
