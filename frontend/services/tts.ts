// TTS Service - Uses Edge TTS (FREE, no API key required)// tts.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface TTSResult {
    audioUrl: string;
    filename: string;
}

// Available voices for Edge TTS
export const VOICE_OPTIONS = [
    { id: 'en-US-ChristopherNeural', name: 'Christopher (US Male)', gender: 'male' },
    { id: 'en-US-GuyNeural', name: 'Guy (US Male)', gender: 'male' },
    { id: 'en-US-JennyNeural', name: 'Jenny (US Female)', gender: 'female' },
    { id: 'en-US-AriaNeural', name: 'Aria (US Female)', gender: 'female' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'male' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', gender: 'female' },
    { id: 'en-AU-WilliamNeural', name: 'William (AU Male)', gender: 'male' },
    { id: 'en-IN-PrabhatNeural', name: 'Prabhat (IN Male)', gender: 'male' },
];

export const generateVoiceover = async (text: string, voice: string = 'en-US-ChristopherNeural'): Promise<TTSResult> => {
    const response = await fetch(`${BACKEND_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate voiceover');
    }

    const data = await response.json();
    return {
        audioUrl: `${BACKEND_URL}${data.audioUrl}`,
        filename: data.filename
    };
};

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        return response.ok;
    } catch {
        return false;
    }
};
